/*
  # Fix bookings status check constraint

  The existing constraint only allows 'confirmed' and 'cancelled', blocking 'pending'.
  This migration drops the old constraint and adds a new one that allows all three valid statuses.
*/

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status = ANY (ARRAY['confirmed'::text, 'pending'::text, 'cancelled'::text]));
