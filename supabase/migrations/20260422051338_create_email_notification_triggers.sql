/*
  # Create Email Notification Triggers

  Replaces the old SMS notification system with email notifications
  via the send-email Edge Function and Resend API.

  1. New Functions
    - `handle_new_booking_email()` - Triggered on new booking insert,
      sends booking confirmation email to client and notification to admin
    - `handle_new_contact_email()` - Triggered on new contact message insert,
      sends notification email to admin

  2. New Triggers
    - `on_new_booking_send_email` on bookings table (AFTER INSERT)
    - `on_new_contact_send_email` on contact_messages table (AFTER INSERT)

  3. Notes
    - Uses pg_net extension for async HTTP calls to Edge Function
    - Emails are sent asynchronously and do not block the insert operation
    - Uses SUPABASE_URL from project config and service role key for auth
*/

-- Trigger function for new bookings
CREATE OR REPLACE FUNCTION handle_new_booking_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
BEGIN
  SELECT decrypted_secret INTO supabase_url
    FROM vault.decrypted_secrets
    WHERE name = 'supabase_url'
    LIMIT 1;

  SELECT decrypted_secret INTO service_role_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;

  IF supabase_url IS NULL THEN
    supabase_url := 'https://yfpdwhgfezlmjdjoqpfe.supabase.co';
  END IF;

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := jsonb_build_object(
      'type', 'booking',
      'data', jsonb_build_object(
        'id', NEW.id,
        'date', NEW.date,
        'start_time', NEW.start_time,
        'end_time', NEW.end_time,
        'duration', NEW.duration,
        'client_name', NEW.client_name,
        'client_email', NEW.client_email,
        'client_phone', NEW.client_phone,
        'project_type', NEW.project_type,
        'total_price', NEW.total_price,
        'status', NEW.status,
        'notes', COALESCE(NEW.notes, '')
      )
    )
  );

  RETURN NEW;
END;
$$;

-- Trigger function for new contact messages
CREATE OR REPLACE FUNCTION handle_new_contact_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
BEGIN
  SELECT decrypted_secret INTO supabase_url
    FROM vault.decrypted_secrets
    WHERE name = 'supabase_url'
    LIMIT 1;

  SELECT decrypted_secret INTO service_role_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;

  IF supabase_url IS NULL THEN
    supabase_url := 'https://yfpdwhgfezlmjdjoqpfe.supabase.co';
  END IF;

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := jsonb_build_object(
      'type', 'contact',
      'data', jsonb_build_object(
        'name', NEW.name,
        'email', NEW.email,
        'phone', COALESCE(NEW.phone, ''),
        'message', NEW.message
      )
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger for new bookings
DROP TRIGGER IF EXISTS on_new_booking_send_email ON bookings;
CREATE TRIGGER on_new_booking_send_email
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_booking_email();

-- Create trigger for new contact messages
DROP TRIGGER IF EXISTS on_new_contact_send_email ON contact_messages;
CREATE TRIGGER on_new_contact_send_email
  AFTER INSERT ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_contact_email();
