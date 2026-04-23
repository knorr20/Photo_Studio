import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });
    const body = await req.json();
    const { action, amount, bookingId, description, clientEmail, paymentIntentId } = body;

    if (action === "create_payment_intent") {
      if (!amount || amount <= 0) {
        return new Response(JSON.stringify({ error: "Invalid amount" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        description: description ?? `Studio booking #${bookingId}`,
        receipt_email: clientEmail ?? undefined,
        metadata: { bookingId: String(bookingId ?? "") },
        automatic_payment_methods: { enabled: true },
      });

      return new Response(
        JSON.stringify({ clientSecret: paymentIntent.client_secret }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "confirm_payment") {
      if (!paymentIntentId || !bookingId) {
        return new Response(JSON.stringify({ error: "Missing paymentIntentId or bookingId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify the payment intent actually succeeded with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== "succeeded") {
        return new Response(JSON.stringify({ error: "Payment not completed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get receipt URL from the charge if available
      let receiptUrl: string | null = null;
      if (paymentIntent.latest_charge) {
        try {
          const charge = await stripe.charges.retrieve(String(paymentIntent.latest_charge));
          receiptUrl = charge.receipt_url ?? null;
        } catch {
          // non-critical
        }
      }

      // Update the booking using service_role to bypass RLS
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!supabaseUrl || !serviceRoleKey) {
        return new Response(JSON.stringify({ error: "Supabase not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(supabaseUrl, serviceRoleKey);

      const { error: dbError } = await supabase
        .from("bookings")
        .update({
          stripe_payment_intent_id: paymentIntentId,
          payment_status: "paid",
          receipt_url: receiptUrl,
        })
        .eq("id", bookingId);

      if (dbError) {
        console.error("DB update error:", dbError);
        return new Response(JSON.stringify({ error: "Failed to update booking" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ success: true, receiptUrl }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stripe-payment error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
