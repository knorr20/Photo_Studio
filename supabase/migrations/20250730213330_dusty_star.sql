/*
  # Add consent tracking fields to bookings table

  1. New Fields
    - `agreed_to_terms` (boolean, not null, default false) - explicit consent to Terms & Privacy Policy
    - `terms_agreed_at` (timestamptz) - timestamp when user agreed to terms
    - `receive_promotional_comms_at` (timestamptz) - timestamp when user consented to marketing

  2. Purpose
    - Legal compliance and audit trail for user consents
    - Explicit tracking of when agreements were made
    - Version control for future terms updates

  3. Notes
    - All existing bookings will have agreed_to_terms=true since they completed booking process
    - Timestamps will be null for existing records (can be backfilled if needed)
*/

-- Add consent tracking fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS agreed_to_terms boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_agreed_at timestamptz,
ADD COLUMN IF NOT EXISTS receive_promotional_comms_at timestamptz;

-- Update existing bookings to reflect that they agreed to terms (since booking was completed)
UPDATE bookings 
SET agreed_to_terms = true 
WHERE agreed_to_terms = false;

-- Create index for consent queries
CREATE INDEX IF NOT EXISTS idx_bookings_agreed_to_terms ON bookings(agreed_to_terms);
CREATE INDEX IF NOT EXISTS idx_bookings_terms_agreed_at ON bookings(terms_agreed_at);

-- Add comment for documentation
COMMENT ON COLUMN bookings.agreed_to_terms IS 'Explicit consent to Terms of Service and Privacy Policy';
COMMENT ON COLUMN bookings.terms_agreed_at IS 'Timestamp when user agreed to Terms and Privacy Policy';
COMMENT ON COLUMN bookings.receive_promotional_comms_at IS 'Timestamp when user consented to promotional communications';