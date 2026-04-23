/*
  # Create contact_messages table

  1. New Tables
    - `contact_messages`
      - `id` (bigint, primary key, auto-increment) - Unique message identifier
      - `name` (text, not null) - Sender's full name
      - `email` (text, not null) - Sender's email address
      - `phone` (text, nullable) - Sender's phone number (optional)
      - `message` (text, not null) - Message content
      - `status` (text, default 'new') - Message status: 'new', 'read', or 'archived'
      - `created_at` (timestamptz, default now()) - Timestamp of message creation

  2. Security
    - Enable RLS on `contact_messages` table
    - Add policy for authenticated users to read all messages (admin access)
    - Add policy for authenticated users to update message status
    - Add policy for authenticated users to delete messages
    - Insert is handled via Edge Function (spam-protection) using service_role_key

  3. Indexes
    - Index on `status` for filtering
    - Index on `created_at` for ordering

  4. Notes
    - Public users submit messages through the spam-protection Edge Function
    - Only authenticated admin users can view, update, and delete messages
    - Status check constraint ensures only valid values
*/

CREATE TABLE IF NOT EXISTS contact_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new'
    CHECK (status = ANY (ARRAY['new'::text, 'read'::text, 'archived'::text])),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update message status"
  ON contact_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete messages"
  ON contact_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);