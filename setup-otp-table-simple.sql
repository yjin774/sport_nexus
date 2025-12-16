-- Simple SQL to create/fix password_resets table for OTP
-- Copy and paste this ENTIRE script into Supabase SQL Editor and click RUN

-- Step 0: Enable extension for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 1: Drop the table if it exists (to start fresh)
DROP TABLE IF EXISTS public.password_resets CASCADE;

-- Step 2: Create the table with correct schema
CREATE TABLE public.password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_password_resets_email ON public.password_resets(email);
CREATE INDEX idx_password_resets_expires ON public.password_resets(expires_at);
CREATE INDEX idx_password_resets_email_used ON public.password_resets(email, used) WHERE used = false;

-- Step 4: Enable Row Level Security
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow insert for password reset" ON public.password_resets;
DROP POLICY IF EXISTS "Allow read own OTP" ON public.password_resets;
DROP POLICY IF EXISTS "Allow update own OTP" ON public.password_resets;

-- Step 6: Create policies to allow operations
CREATE POLICY "Allow insert for password reset" ON public.password_resets
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow read own OTP" ON public.password_resets
  FOR SELECT
  USING (true);

CREATE POLICY "Allow update own OTP" ON public.password_resets
  FOR UPDATE
  USING (true);

-- Step 7: Grant necessary permissions (if needed)
GRANT ALL ON public.password_resets TO authenticated;
GRANT ALL ON public.password_resets TO anon;

-- Verify the table was created
SELECT 
  'Table created successfully!' as status,
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'password_resets'
ORDER BY ordinal_position;

