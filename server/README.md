Server scaffolding (placeholder)
=================================

This folder contains example server code and SQL schema to implement a real OTP-based "forgot password" flow using a Supabase service role key and an email provider (SendGrid shown as example).

Important: Do NOT put the Supabase service_role key in client-side code or commit it to source control. Keep it in environment variables / secrets when deploying.

What is provided
- `node/` - example Node/Express server showing two endpoints: `/send-otp` and `/verify-otp` (illustrative). Replace placeholders and deploy to your hosting provider.
- `schema.sql` - SQL to create a `password_resets` table to store OTPs (single-use, expiring records).

Environment variables required (example names):
- SUPABASE_URL - e.g. https://<project>.supabase.co
- SERVICE_ROLE_KEY - Supabase service_role (admin) key (keep secret)
- SENDGRID_API_KEY - (or SMTP credentials) used to send OTP emails
- OTP_SECRET - random secret used to HMAC OTPs (recommended)

Deploy options
- Supabase Edge Functions (recommended): create two functions `send-otp` and `verify-otp` and set the above env vars in the Supabase UI.
- Vercel / Heroku / Render: create a small Node server using the `node/server.js` example and set environment variables.

Security notes
- Hash OTPs before storing (example uses HMAC with `OTP_SECRET`).
- Use HTTPS and set CORS properly to restrict origins.
- Rate-limit the `/send-otp` endpoint to avoid abuse.

Follow the comments inside `node/server.js` for implementation details and adapt to your mail provider.
