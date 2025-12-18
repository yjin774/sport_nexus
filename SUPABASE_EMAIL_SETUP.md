# Supabase Email Setup Guide for Payment OTP

## Overview
This guide will help you set up email sending for payment OTPs using Supabase Edge Functions with Resend (recommended) or SendGrid.

## Option 1: Resend (Recommended - Free Tier Available)

Resend is easier to set up and has a generous free tier (3,000 emails/month).

### Step 1: Sign Up for Resend
1. Go to https://resend.com/
2. Click "Sign Up" (free tier available)
3. Create an account
4. Verify your email

### Step 2: Get Your API Key
1. After logging in, go to **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "Sport Nexus Payment OTP")
4. Copy the API key (starts with `re_...`)

### Step 3: Add Domain (Optional but Recommended)
1. Go to **Domains**
2. Click **Add Domain**
3. Follow the DNS setup instructions
4. Once verified, you can use `noreply@yourdomain.com` as the sender

**Note:** For testing, you can use Resend's default domain without verification.

### Step 4: Deploy Supabase Edge Function
1. Make sure you have Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref giksmtowehwmgqyymevp
   ```

4. Deploy the function:
   ```bash
   supabase functions deploy send-payment-otp
   ```

### Step 5: Set Environment Variables
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Edge Functions** → **send-payment-otp**
4. Click **Settings** → **Environment Variables**
5. Add these variables:
   - `RESEND_API_KEY`: Your Resend API key (e.g., `re_xxxxxxxxxxxxx`)
   - `FROM_EMAIL`: Your sender email (e.g., `noreply@yourdomain.com` or `onboarding@resend.dev` for testing)

### Step 6: Test It!
1. Refresh your browser
2. Try making a payment
3. Check your email inbox for the OTP!

---

## Option 2: SendGrid (Alternative)

If you prefer SendGrid:

### Step 1: Sign Up for SendGrid
1. Go to https://sendgrid.com/
2. Sign up for a free account (100 emails/day)
3. Verify your email

### Step 2: Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Give it a name and select "Full Access" or "Mail Send" permissions
4. Copy the API key

### Step 3: Deploy and Configure
1. Deploy the edge function (same as Step 4 above)
2. Set environment variables in Supabase:
   - `SENDGRID_API_KEY`: Your SendGrid API key
   - `FROM_EMAIL`: Your verified sender email

---

## Troubleshooting

### Email Not Sending?
1. **Check Edge Function Logs:**
   - Go to Supabase Dashboard → Edge Functions → send-payment-otp
   - Click **Logs** to see any errors

2. **Verify Environment Variables:**
   - Make sure `RESEND_API_KEY` or `SENDGRID_API_KEY` is set correctly
   - Check that `FROM_EMAIL` is a valid email address

3. **Check API Key:**
   - Make sure your API key is active and has the correct permissions
   - For Resend, the key should start with `re_`
   - For SendGrid, it should be a long string

4. **Domain Verification (Resend):**
   - If using a custom domain, make sure DNS records are set up correctly
   - For testing, use `onboarding@resend.dev` as the sender

### Edge Function Not Deployed?
If you see CORS errors or "function not found":
1. Make sure you've deployed the function: `supabase functions deploy send-payment-otp`
2. Check that the function name matches exactly: `send-payment-otp`
3. Verify you're using the correct Supabase project URL

### Testing Without Email Service
If email service is not configured, the OTP will be:
- Logged in the edge function logs
- Shown in the browser console
- Displayed in the UI (yellow box) for testing

---

## Current Status

The system is now configured to use **only Supabase Edge Functions** for sending emails. No external services like EmailJS are needed.

Once you:
1. Set up Resend (or SendGrid)
2. Deploy the edge function
3. Configure environment variables

Emails will be sent automatically to users' Gmail addresses!

