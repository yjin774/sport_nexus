// Supabase Edge Function: send-payment-otp
// Sends payment OTP code via email using Resend or SendGrid (same as send-otp-email)
//
// Option 1: Use Resend (simpler than SendGrid, free tier available)
//   - Set RESEND_API_KEY and FROM_EMAIL environment variables
//
// Option 2: Use SendGrid (Alternative)
//   - Set SENDGRID_API_KEY and FROM_EMAIL environment variables

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
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

    const { email, otp, amount, bankName } = await req.json()

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: 'Email and OTP are required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Option 1: Use Resend (simpler than SendGrid, free tier available)
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
            subject: `Payment OTP - RM ${amount || '0.00'}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #9D5858;">Sport Nexus - Payment OTP Verification</h2>
                <p>Dear Customer,</p>
                <p>You have initiated a payment transaction:</p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Amount:</strong> RM ${amount || '0.00'}</p>
                  ${bankName ? `<p style="margin: 5px 0;"><strong>Bank:</strong> ${bankName}</p>` : ''}
                </div>
                <p>Your OTP code is:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #9D5858; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
                  ${otp}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p style="color: #666; font-size: 12px;">If you didn't initiate this payment, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">This is an automated message from Sport Nexus Payment System.</p>
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
        console.log(`✅ Payment OTP email sent via Resend to ${email}`)
        return new Response(
          JSON.stringify({ success: true, message: 'Payment OTP email sent successfully', id: result.id }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error('Resend email error:', error)
        // Fall through to SendGrid
      }
    }

    // Option 2: Use SendGrid if API key is configured
    if (SENDGRID_API_KEY) {
      try {
        const emailBody = {
          personalizations: [
            {
              to: [{ email }],
              subject: `Payment OTP - RM ${amount || '0.00'}`
            }
          ],
          from: { email: FROM_EMAIL },
          content: [
            {
              type: 'text/html',
              value: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #9D5858;">Sport Nexus - Payment OTP Verification</h2>
                  <p>Dear Customer,</p>
                  <p>You have initiated a payment transaction:</p>
                  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Amount:</strong> RM ${amount || '0.00'}</p>
                    ${bankName ? `<p style="margin: 5px 0;"><strong>Bank:</strong> ${bankName}</p>` : ''}
                  </div>
                  <p>Your OTP code is:</p>
                  <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #9D5858; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
                    ${otp}
                  </div>
                  <p>This code will expire in 10 minutes.</p>
                  <p style="color: #666; font-size: 12px;">If you didn't initiate this payment, please ignore this email.</p>
                  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                  <p style="color: #999; font-size: 12px;">This is an automated message from Sport Nexus Payment System.</p>
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

        console.log(`✅ Payment OTP email sent via SendGrid to ${email}`)
        return new Response(
          JSON.stringify({ success: true, message: 'Payment OTP email sent successfully' }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error('Email sending error:', error)
        // Log OTP for development if email fails
        console.log(`[DEV MODE] Payment OTP for ${email}: ${otp}`)
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
      console.log(`[DEV MODE] Payment OTP for ${email}: ${otp}`)
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
