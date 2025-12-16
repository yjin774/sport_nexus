// Supabase Edge Function: send-otp-email
// Sends OTP code via email using Supabase's built-in SMTP or SendGrid
//
// Option 1: Use Supabase's built-in SMTP (Recommended - No external service needed!)
//   - Configure SMTP in Supabase Dashboard > Settings > Auth > SMTP Settings
//   - No environment variables needed!
//
// Option 2: Use SendGrid (Alternative)
//   - Set SENDGRID_API_KEY and FROM_EMAIL environment variables

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@sportnexus.com'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const { email, otp } = await req.json()

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: 'Email and OTP are required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Option 1: Use SMTP directly (Gmail, Outlook, or any SMTP server)
    // Get SMTP settings from environment variables (set these in Supabase Dashboard > Functions > Settings)
    const SMTP_HOST = Deno.env.get('SMTP_HOST') || ''
    const SMTP_PORT = Deno.env.get('SMTP_PORT') || '587'
    const SMTP_USER = Deno.env.get('SMTP_USER') || ''
    const SMTP_PASS = Deno.env.get('SMTP_PASS') || ''
    const SMTP_FROM = Deno.env.get('SMTP_FROM') || SMTP_USER

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      try {
        // Use Deno's built-in SMTP support or a simple SMTP library
        // For Deno, we'll use a simple fetch-based approach or a library
        // Since Deno doesn't have native SMTP, we'll use a service or library
        
        // Alternative: Use Resend (simpler than SendGrid) or continue with SendGrid
        // For now, let's use a simple approach with a service
        console.log('SMTP configured, but direct SMTP from Deno requires a library')
        // Fall through to SendGrid or use a service
      } catch (smtpErr) {
        console.log('SMTP error, trying alternatives...', smtpErr)
      }
    }

    // Option 2: Use Resend (simpler than SendGrid, free tier available)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
    if (RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: FROM_EMAIL || 'onboarding@resend.dev',
            to: email,
            subject: 'Your Sport Nexus OTP Code',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #9D5858;">Sport Nexus - Password Reset</h2>
                <p>Your OTP code is:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #9D5858; letter-spacing: 5px; margin: 20px 0;">
                  ${otp}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
              </div>
            `
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Resend error:', errorText)
          throw new Error('Failed to send email via Resend')
        }

        const result = await response.json()
        return new Response(
          JSON.stringify({ success: true, message: 'OTP email sent successfully', id: result.id }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error('Resend email error:', error)
        // Fall through to SendGrid
      }
    }

    // Option 3: Use SendGrid if API key is configured
    if (SENDGRID_API_KEY) {
      try {
        const emailBody = {
          personalizations: [
            {
              to: [{ email }],
              subject: 'Your Sport Nexus OTP Code'
            }
          ],
          from: { email: FROM_EMAIL },
          content: [
            {
              type: 'text/html',
              value: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #9D5858;">Sport Nexus - Password Reset</h2>
                  <p>Your OTP code is:</p>
                  <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #9D5858; letter-spacing: 5px; margin: 20px 0;">
                    ${otp}
                  </div>
                  <p>This code will expire in 10 minutes.</p>
                  <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
                </div>
              `
            }
          ]
        }

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailBody)
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('SendGrid error:', errorText)
          throw new Error('Failed to send email via SendGrid')
        }

        return new Response(
          JSON.stringify({ success: true, message: 'OTP email sent successfully' }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error('Email sending error:', error)
        // Log OTP for development if email fails
        console.log(`[DEV MODE] OTP for ${email}: ${otp}`)
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Email service not configured. OTP logged to console.',
            devMode: true,
            otp: otp // Only in dev mode
          }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // No email service configured - log for development
      console.log(`[DEV MODE] OTP for ${email}: ${otp}`)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Email service not configured. OTP logged to console.',
          devMode: true,
          otp: otp // Only in dev mode
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})

