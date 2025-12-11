Supabase Edge Functions for OTP password reset
============================================

This folder contains two example Supabase Edge Functions (Deno/TypeScript):

- `send-otp` — generate a 6-digit OTP, store HMAC in `password_resets` table via PostgREST, and send email via SendGrid (or log OTP if no API key).
- `verify-otp` — validate OTP, call Supabase Admin API to update the user's password, and mark the OTP record used.

Why Edge Functions?
- They run server-side and let you safely use the Supabase `service_role` key to update Auth users.
- They integrate with Supabase easily and can access Postgres via PostgREST.

Required environment variables (set these in Supabase UI under Functions -> Settings -> Environment variables):
- SUPABASE_URL — your project URL, e.g. https://ektazzpdecrzxkinmbsf.supabase.co
- SERVICE_ROLE_KEY — your Supabase service_role key (secret)
- SENDGRID_API_KEY — (optional) SendGrid API key to send emails; if omitted the OTP will be logged in function logs for testing
- OTP_SECRET — random secret used to HMAC OTPs before storing in DB

Database table
- Run `server/schema.sql` in the Supabase SQL Editor to create the `password_resets` table.

Deploying with the Supabase CLI (recommended)
1. Install the CLI: https://supabase.com/docs/guides/cli
2. Authenticate and select your project: `supabase login` then `supabase link --project-ref <your-project-ref>`
3. Deploy functions:
   supabase functions deploy send-otp --no-verify-jwt
   supabase functions deploy verify-otp --no-verify-jwt
4. In the Supabase dashboard, set the environment variables listed above for each function (SERVICE_ROLE_KEY, OTP_SECRET, SENDGRID_API_KEY).

Local testing
- You can run functions locally with `supabase functions serve` after installing the CLI. Remember the functions need access to your SERVICE_ROLE_KEY to call Supabase admin APIs — set it in your local env for testing.

Security notes
- Never check `SERVICE_ROLE_KEY` into source control. Use Supabase function environment variables or your deployment provider's secret store.
- OTPs are HMAC'd before storage; in production you may also want to add rate limiting and logging/monitoring.
