/*
  # Create rate limiting table for spam protection

  1. New Tables
    - `rate_limiting`
      - `id` (uuid, primary key)
      - `ip_address` (text) - client IP address
      - `endpoint` (text) - which endpoint was accessed (booking/contact)
      - `request_count` (integer) - number of requests in current window
      - `window_start` (timestamptz) - start of current rate limiting window
      - `created_at` (timestamptz) - when record was created
      - `updated_at` (timestamptz) - when record was last updated

  2. Security
    - Enable RLS on `rate_limiting` table
    - Add policy for service role access only (for edge functions)

  3. Indexes
    - Index on ip_address and endpoint for fast lookups
    - Index on window_start for cleanup operations
*/

-- Create the rate_limiting table
CREATE TABLE IF NOT EXISTS rate_limiting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE rate_limiting ENABLE ROW LEVEL SECURITY;

-- Policy for service role access only (edge functions)
CREATE POLICY "Service role can manage rate limiting"
  ON rate_limiting
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rate_limiting_ip_endpoint ON rate_limiting(ip_address, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limiting_window_start ON rate_limiting(window_start);

-- Create unique constraint to prevent duplicate entries for same IP/endpoint combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limiting_unique ON rate_limiting(ip_address, endpoint);

-- Function to clean up old rate limiting records (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_rate_limiting()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limiting 
  WHERE window_start < now() - interval '1 hour';
END;
$$;