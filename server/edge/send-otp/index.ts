// Supabase Edge Function: send-otp
// Generates a 6-digit OTP, stores HMAC in password_resets table, and sends email via SendGrid.
//
// Environment variables required:
// SUPABASE_URL, SERVICE_ROLE_KEY, SENDGRID_API_KEY (optional), OTP_SECRET

// Use explicit deno.land std URL so the Supabase bundler can resolve the module
// Import from the explicit http/server path which is resolvable by the bundler
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || ''
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || ''
const OTP_SECRET = Deno.env.get('OTP_SECRET') || 'replace-me'

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function insertPasswordReset(email: string, otp_hmac: string, expires_at: string) {
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/password_resets`
  const body = [{ email, otp_hmac, expires_at }]
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify(body),
  })
  return res
}

function hmacOtp(email: string, otp: string) {
  const enc = new TextEncoder().encode(`${email}:${otp}`)
  const keyData = new TextEncoder().encode(OTP_SECRET)
  const cryptoKey = crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  // crypto.subtle.importKey returns a Promise; use async/await where called
  return cryptoKey.then(k => crypto.subtle.sign('HMAC', k, enc))
    .then(buf => {
      const bytes = new Uint8Array(buf)
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    })
}

async function sendEmailOtp(email: string, otp: string) {
  if (!SENDGRID_API_KEY) {
    // No mail provider configured — log for testing
    console.log(`OTP for ${email}: ${otp}`)
    return
  }

  const msg = {
    personalizations: [{ to: [{ email }] }],
    from: { email: 'no-reply@yourdomain.example' },
    subject: 'Your Sport Nexus OTP',
    content: [{ type: 'text/plain', value: `Your OTP code is: ${otp} (valid for 10 minutes)` }]
  }

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(msg)
  })
}

serve(async (req) => {
  const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }

  try {
    // handle preflight
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS })
    if (req.method !== 'POST') return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS })
    const body = await req.json().catch(() => ({}))
    const email = (body.email || '').trim()
    if (!email) return new Response(JSON.stringify({ message: 'Missing email' }), { status: 400, headers: CORS_HEADERS })

    const otp = genOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const otp_hmac = await hmacOtp(email, otp)

    // store record
    const r = await insertPasswordReset(email, otp_hmac, expiresAt)
    if (!r.ok) {
      console.error('Failed to insert password_reset', await r.text().catch(() => ''))
      return new Response(JSON.stringify({ message: 'Failed to store OTP' }), { status: 500, headers: CORS_HEADERS })
    }

    // send email (or log)
    await sendEmailOtp(email, otp)

    return new Response(JSON.stringify({ message: 'OTP sent' }), { status: 200, headers: CORS_HEADERS })
  } catch (err) {
    console.error('send-otp error', err)
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500, headers: CORS_HEADERS })
  }
})
