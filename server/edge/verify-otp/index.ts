// Supabase Edge Function: verify-otp
// Validates OTP, updates user's password via Supabase Admin API, and marks OTP used.
//
// Environment variables required:
// SUPABASE_URL, SERVICE_ROLE_KEY, OTP_SECRET

// Use explicit deno.land std URL so the Supabase bundler can resolve the module
// Import from the explicit http/server path which is resolvable by the bundler
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || ''
const OTP_SECRET = Deno.env.get('OTP_SECRET') || 'replace-me'

function hmacOtp(email: string, otp: string) {
  const enc = new TextEncoder().encode(`${email}:${otp}`)
  const keyData = new TextEncoder().encode(OTP_SECRET)
  const cryptoKey = crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return cryptoKey.then(k => crypto.subtle.sign('HMAC', k, enc))
    .then(buf => {
      const bytes = new Uint8Array(buf)
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    })
}

async function getLatestReset(email: string) {
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/password_resets?email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=1`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    }
  })
  if (!res.ok) return null
  const data = await res.json()
  return (data && data.length) ? data[0] : null
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
    // lightweight invocation log (avoid logging passwords)
    try {
      console.log('[verify-otp] invoked', { method: req.method, url: req.url, time: new Date().toISOString() })
      console.log('[verify-otp] request body', { email: body && body.email ? body.email : null })
    } catch (e) {
      // ignore logging errors
    }
    const email = (body.email || '').trim()
    const otp = (body.otp || '').trim()
    const newPassword = body.newPassword
    if (!email || !otp || !newPassword) return new Response(JSON.stringify({ message: 'Missing parameters' }), { status: 400, headers: CORS_HEADERS })

    const record = await getLatestReset(email)
    if (!record) return new Response(JSON.stringify({ message: 'No OTP requested' }), { status: 400, headers: CORS_HEADERS })
    if (record.used) return new Response(JSON.stringify({ message: 'OTP already used' }), { status: 400, headers: CORS_HEADERS })
    if (new Date(record.expires_at) < new Date()) return new Response(JSON.stringify({ message: 'OTP expired' }), { status: 400, headers: CORS_HEADERS })

    const expected = await hmacOtp(email, otp)
    if (expected !== record.otp_hmac) return new Response(JSON.stringify({ message: 'Invalid OTP' }), { status: 400, headers: CORS_HEADERS })

    // lookup user via admin API
    // Use PostgREST-style filter (email=eq.<email>) which the Supabase admin endpoint expects
    const listUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/admin/users?email=eq.${encodeURIComponent(email)}`
    const listRes = await fetch(listUrl, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      }
    })
    // log status for debugging
    if (!listRes.ok) {
      const text = await listRes.text().catch(() => '')
      console.error('lookup user failed', { status: listRes.status, body: text })
      return new Response(JSON.stringify({ message: 'Failed to lookup user' }), { status: 500, headers: CORS_HEADERS })
    }
      // The admin endpoint sometimes returns an array or an object { users: [...] }
      const usersRes = await listRes.json().catch(() => null)
      const users = Array.isArray(usersRes) ? usersRes : (usersRes && Array.isArray(usersRes.users) ? usersRes.users : null)
      if (!users || !users.length) {
        console.error('[verify-otp] lookup user returned empty', { url: listUrl, response: usersRes })
        return new Response(JSON.stringify({ message: 'User not found' }), { status: 404, headers: CORS_HEADERS })
      }
      const user = users[0]

    // update password via admin API
    const updateUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/admin/users/${user.id}`
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ password: newPassword })
    })
    if (!updateRes.ok) {
      console.error('update user failed', await updateRes.text().catch(() => ''))
      return new Response(JSON.stringify({ message: 'Failed to update password' }), { status: 500, headers: CORS_HEADERS })
    }

    // mark OTP used
    const markUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/password_resets?id=eq.${record.id}`
    await fetch(markUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ used: true })
    })

    return new Response(JSON.stringify({ message: 'Password updated' }), { status: 200, headers: CORS_HEADERS })
  } catch (err) {
    console.error('verify-otp error', err)
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500, headers: CORS_HEADERS })
  }
})
