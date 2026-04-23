import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RateLimitRecord {
  id: string;
  ip_address: string;
  endpoint: string;
  request_count: number;
  window_start: string;
}

function getTimeValue(timeString: string): number {
  const [time, period] = timeString.split(" ");
  const [hours, minutes] = time.split(":").map(Number);
  let hour24 = hours;

  if (period === "PM" && hours !== 12) {
    hour24 += 12;
  } else if (period === "AM" && hours === 12) {
    hour24 = 0;
  }

  return hour24 * 60 + minutes;
}

function checkTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Value = getTimeValue(start1);
  const end1Value = getTimeValue(end1);
  const start2Value = getTimeValue(start2);
  const end2Value = getTimeValue(end2);

  return start1Value < end2Value && start2Value < end1Value;
}

async function checkBookingConflicts(
  supabase: any,
  date: string,
  startTime: string,
  endTime: string
): Promise<{ hasConflict: boolean; conflictingBooking?: any }> {
  try {
    const { data: existingBookings, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("date", date)
      .in("status", ["pending", "confirmed"]);

    if (error) {
      console.error("Error checking booking conflicts:", error);
      throw error;
    }

    if (!existingBookings || existingBookings.length === 0) {
      return { hasConflict: false };
    }

    for (const booking of existingBookings) {
      if (
        checkTimeOverlap(
          startTime,
          endTime,
          booking.start_time,
          booking.end_time
        )
      ) {
        return {
          hasConflict: true,
          conflictingBooking: booking,
        };
      }
    }

    return { hasConflict: false };
  } catch (error) {
    console.error("Error in checkBookingConflicts:", error);
    throw error;
  }
}

async function checkRateLimit(
  supabase: any,
  ipAddress: string,
  endpoint: string
): Promise<{ allowed: boolean }> {
  const now = new Date();
  const maxRequests = 5;

  try {
    const { data: existingRecord, error: fetchError } = await supabase
      .from("rate_limiting")
      .select("*")
      .eq("ip_address", ipAddress)
      .eq("endpoint", endpoint)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching rate limit record:", fetchError);
      return { allowed: true };
    }

    if (!existingRecord) {
      const { error: insertError } = await supabase
        .from("rate_limiting")
        .insert([
          {
            ip_address: ipAddress,
            endpoint: endpoint,
            request_count: 1,
            window_start: now.toISOString(),
          },
        ]);

      if (insertError) {
        console.error("Error creating rate limit record:", insertError);
        return { allowed: true };
      }

      return { allowed: true };
    }

    const recordWindowStart = new Date(existingRecord.window_start);
    const timeSinceWindowStart =
      now.getTime() - recordWindowStart.getTime();
    const windowDurationMs = 5 * 60 * 1000;

    if (timeSinceWindowStart > windowDurationMs) {
      const { error: updateError } = await supabase
        .from("rate_limiting")
        .update({
          request_count: 1,
          window_start: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", existingRecord.id);

      if (updateError) {
        console.error("Error resetting rate limit record:", updateError);
        return { allowed: true };
      }

      return { allowed: true };
    }

    if (existingRecord.request_count >= maxRequests) {
      return { allowed: false };
    }

    const { error: updateError } = await supabase
      .from("rate_limiting")
      .update({
        request_count: existingRecord.request_count + 1,
        updated_at: now.toISOString(),
      })
      .eq("id", existingRecord.id);

    if (updateError) {
      console.error("Error updating rate limit record:", updateError);
      return { allowed: true };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error in rate limiting check:", error);
    return { allowed: true };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientIP =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const body = await req.json();
    const { type, data, honeypot } = body;

    if (!type || !data || (type !== "booking" && type !== "contact")) {
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (honeypot && honeypot.trim() !== "") {
      console.log(`Honeypot triggered for IP: ${clientIP}`);
      return new Response(JSON.stringify({ error: "Spam detected" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rateLimitResult = await checkRateLimit(supabase, clientIP, type);
    if (!rateLimitResult.allowed) {
      console.log(
        `Rate limit exceeded for IP: ${clientIP}, endpoint: ${type}`
      );
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let result;
    if (type === "booking") {
      const conflictCheck = await checkBookingConflicts(
        supabase,
        data.date,
        data.startTime,
        data.endTime
      );

      if (conflictCheck.hasConflict) {
        const conflictingBooking = conflictCheck.conflictingBooking;
        const conflictMessage = `This time slot is already booked. Another booking exists from ${conflictingBooking.start_time} to ${conflictingBooking.end_time} on ${conflictingBooking.date}. Please choose a different time slot.`;

        console.log(
          `Booking conflict detected for ${data.date} ${data.startTime}-${data.endTime}. Conflicting with booking ID: ${conflictingBooking.id}`
        );

        return new Response(
          JSON.stringify({
            error: conflictMessage,
            conflictDetails: {
              date: conflictingBooking.date,
              startTime: conflictingBooking.start_time,
              endTime: conflictingBooking.end_time,
              status: conflictingBooking.status,
            },
          }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: inserted, error } = await supabase.from("bookings").insert([
        {
          date: data.date,
          start_time: data.startTime,
          end_time: data.endTime,
          duration: data.duration,
          client_name: data.clientName,
          client_email: data.clientEmail,
          client_phone: data.clientPhone,
          project_type: data.projectType,
          total_price: data.totalPrice,
          status: data.status || "pending",
          notes: data.notes || "",
          receive_promotional_comms: data.receivePromotionalComms || false,
          agreed_to_terms: data.agreedToTerms || false,
          terms_agreed_at: data.termsAgreedAt || null,
          receive_promotional_comms_at: data.receivePromotionalCommsAt || null,
        },
      ]).select("id").single();

      if (error) throw error;
      result = { success: true, message: "Booking created successfully", bookingId: inserted.id };
    } else if (type === "contact") {
      const { error } = await supabase.from("contact_messages").insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          message: data.message,
          status: "new",
        },
      ]);

      if (error) throw error;
      result = { success: true, message: "Message sent successfully" };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in spam-protection function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
