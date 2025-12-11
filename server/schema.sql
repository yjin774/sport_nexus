-- SQL to create a password_resets table for OTP storage
CREATE TABLE IF NOT EXISTS public.password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_hmac text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Note: gen_random_uuid() requires the pgcrypto extension. If not enabled, use uuid_generate_v4().