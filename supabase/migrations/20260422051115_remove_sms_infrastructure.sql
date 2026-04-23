/*
  # Remove SMS/Twilio Infrastructure

  This migration removes all SMS-related database objects that were
  previously used for Twilio SMS notifications. SMS is being replaced
  by email notifications via Resend.

  1. Removed Objects
    - Trigger `on_new_booking_send_sms` on bookings table
    - Function `handle_new_booking_sms()`
    - Table `sms_logs` (booking SMS delivery logs)
    - Extension `pg_net` if no longer needed

  2. Notes
    - Booking creation flow is unaffected (SMS was async via trigger)
    - Email notifications will replace SMS functionality
*/

-- Drop the trigger first (depends on the function)
DROP TRIGGER IF EXISTS on_new_booking_send_sms ON bookings;

-- Drop the trigger function
DROP FUNCTION IF EXISTS handle_new_booking_sms();

-- Drop the sms_logs table (indexes and policies are dropped automatically)
DROP TABLE IF EXISTS sms_logs;
