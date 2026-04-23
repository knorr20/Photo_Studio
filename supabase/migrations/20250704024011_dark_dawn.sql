/*
  # Create bookings table

  1. New Tables
    - `bookings`
      - `id` (bigint, primary key, auto-increment)
      - `date` (text) - booking date in YYYY-MM-DD format
      - `start_time` (text) - start time like "10:00 AM"
      - `end_time` (text) - end time like "2:00 PM"
      - `duration` (text) - human readable duration like "4 hours"
      - `client_name` (text) - client's full name
      - `client_email` (text) - client's email address
      - `client_phone` (text) - client's phone number
      - `project_type` (text) - type of project/shoot
      - `total_price` (integer) - total price in dollars
      - `status` (text) - booking status: pending, confirmed, cancelled
      - `notes` (text) - additional notes from client
      - `created_at` (timestamptz) - when booking was created

  2. Security
    - Enable RLS on `bookings` table
    - Add policy for public read access (for calendar display)
    - Add policy for public insert access (for booking submissions)
    - Add policy for authenticated users to manage bookings (admin panel)
*/

-- Create the bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  date text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  duration text NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text NOT NULL,
  project_type text NOT NULL,
  total_price integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy for public read access (anyone can view bookings for calendar)
CREATE POLICY "Anyone can view bookings"
  ON bookings
  FOR SELECT
  TO public
  USING (true);

-- Policy for public insert access (anyone can create bookings)
CREATE POLICY "Anyone can create bookings"
  ON bookings
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy for authenticated users to update bookings (admin panel)
CREATE POLICY "Authenticated users can update bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for authenticated users to delete bookings (admin panel)
CREATE POLICY "Authenticated users can delete bookings"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);