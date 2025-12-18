// Supabase Edge Function: verify-otp
// Validates OTP and updates user's password via Supabase Admin API
//
// Environment variables required:
// - SUPABASE_URL: Your Supabase project URL
// - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (from Dashboard > Settings > API)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_PROJECT_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY') || ''

async function getLatestReset(email: string) {
  // Get the latest UNUSED OTP record for this email
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/password_resets?email=eq.${encodeURIComponent(email)}&used=eq.false&order=created_at.desc&limit=1`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    }
  })
  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    console.error('❌ Failed to fetch OTP record:', { status: res.status, error: errorText })
    return null
  }
  const data = await res.json()
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log('⚠️ No unused OTP records found for email:', email)
    return null
  }
  return data[0]
}

serve(async (req) => {
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

    // Check environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing environment variables:', {
        SUPABASE_URL: !!SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY
      })
      return new Response(
        JSON.stringify({ error: 'Server configuration error. Please check Edge Function environment variables.' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const { email, otp, newPassword } = body

    console.log('📨 Received request:', { email: email ? 'SET' : 'MISSING', otp: otp ? 'SET' : 'MISSING', newPassword: newPassword ? 'SET' : 'MISSING' })

    if (!email || !otp || !newPassword) {
      console.error('❌ Missing required fields:', { email: !!email, otp: !!otp, newPassword: !!newPassword })
      return new Response(
        JSON.stringify({ error: 'Email, OTP, and new password are required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Get latest unused OTP record
    console.log('🔍 Looking up unused OTP record for:', email)
    const record = await getLatestReset(email)
    if (!record) {
      console.error('❌ No unused OTP record found for email:', email)
      return new Response(
        JSON.stringify({ error: 'No valid OTP found. The OTP may have already been used or expired. Please request a new OTP.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }
    console.log('✅ Unused OTP record found:', { id: record.id, expires_at: record.expires_at })

    // Check if OTP is expired
    const now = new Date()
    const expiresAt = new Date(record.expires_at)
    if (expiresAt < now) {
      return new Response(
        JSON.stringify({ error: 'OTP expired' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Verify OTP (plain text comparison since we're storing plain OTP codes)
    console.log('🔐 Verifying OTP:', { provided: otp, stored: record.otp_code, match: record.otp_code === otp })
    if (record.otp_code !== otp) {
      console.error('❌ OTP mismatch')
      return new Response(
        JSON.stringify({ error: 'Invalid OTP code. Please check and try again.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }
    console.log('✅ OTP verified')

    // Lookup user via Admin API
    // Fetch users and filter client-side for exact email match
    // (Admin API query filtering may not work reliably)
    console.log('🔍 Looking up user by email:', email)
    const normalizedEmail = email.toLowerCase().trim()
    
    // Fetch users from Admin API (may return paginated results)
    const listUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/admin/users?per_page=1000`
    const listRes = await fetch(listUrl, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      }
    })

    if (!listRes.ok) {
      const text = await listRes.text().catch(() => '')
      console.error('❌ Lookup user failed:', { status: listRes.status, body: text, url: listUrl })
      return new Response(
        JSON.stringify({ error: `Failed to lookup user: ${text || listRes.statusText}` }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const usersRes = await listRes.json().catch(() => null)
    console.log('📋 User lookup response:', { 
      isArray: Array.isArray(usersRes), 
      hasUsers: usersRes?.users ? Array.isArray(usersRes.users) : false,
      totalUsers: Array.isArray(usersRes) ? usersRes.length : (usersRes?.users ? usersRes.users.length : 0)
    })
    
    const users = Array.isArray(usersRes) ? usersRes : (usersRes && Array.isArray(usersRes.users) ? usersRes.users : null)
    
    if (!users || !users.length) {
      console.error('❌ User lookup returned empty:', { url: listUrl, response: usersRes })
      return new Response(
        JSON.stringify({ error: `User not found in authentication system. Email: ${email}` }),
        { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Find the user with matching email (case-insensitive, exact match)
    const user = users.find((u: any) => {
      if (!u.email) return false
      const userEmail = u.email.toLowerCase().trim()
      return userEmail === normalizedEmail
    })
    
    if (!user) {
      console.error('❌ No user found with matching email:', { 
        requestedEmail: email,
        normalizedEmail: normalizedEmail,
        foundUsers: users.map((u: any) => ({ id: u.id, email: u.email }))
      })
      return new Response(
        JSON.stringify({ error: `User with email ${email} not found. Found ${users.length} user(s) but none matched.` }),
        { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('👤 User found with matching email:', { id: user.id, email: user.email, created_at: user.created_at })

    // Update password via Admin API
    // Supabase Admin API uses PUT method for updating users
    console.log('🔐 Updating password for user:', user.id)
    const updateUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/admin/users/${user.id}`
    
    const updatePayload = {
      password: newPassword
    }
    
    console.log('📤 Sending password update request (PUT):', updateUrl)
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(updatePayload)
    })

    const responseText = await updateRes.text().catch(() => '')
    
    if (!updateRes.ok) {
      console.error('❌ Update password failed:', { 
        status: updateRes.status, 
        statusText: updateRes.statusText,
        body: responseText,
        url: updateUrl,
        userId: user.id
      })
      return new Response(
        JSON.stringify({ error: `Failed to update password. Status: ${updateRes.status}. ${responseText || updateRes.statusText}. Please check Edge Function logs for details.` }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Parse response if it's JSON
    let updateResult = null
    try {
      updateResult = responseText ? JSON.parse(responseText) : null
    } catch (e) {
      // Response might not be JSON, that's okay - empty response means success
      console.log('⚠️ Password update response is not JSON (this is normal):', responseText.substring(0, 100))
    }
    
    console.log('✅ Password update API call successful:', { 
      status: updateRes.status,
      userId: user.id,
      email: email,
      hasResult: !!updateResult
    })
    
    // Verify the password was actually updated by attempting authentication
    // This confirms the password change took effect
    console.log('🔍 Verifying password update by testing authentication...')
    try {
      const testAuthUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/token?grant_type=password`
      const testAuthRes = await fetch(testAuthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({
          email: email,
          password: newPassword
        })
      })
      
      if (testAuthRes.ok) {
        console.log('✅ Password verification successful - new password works!')
      } else {
        const authErrorText = await testAuthRes.text().catch(() => '')
        console.warn('⚠️ Password verification failed (might be normal if there\'s a delay):', {
          status: testAuthRes.status,
          error: authErrorText.substring(0, 200)
        })
        // Don't fail the whole operation - password might still be updated but needs a moment
      }
    } catch (authTestError) {
      console.warn('⚠️ Could not test password authentication (this is usually okay):', authTestError.message)
    }

    // Mark OTP as used
    const markUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/password_resets?id=eq.${record.id}`
    await fetch(markUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ used: true })
    })

    console.log(`✅ Password updated successfully for ${email}`)
    return new Response(
      JSON.stringify({ success: true, message: 'Password updated successfully' }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('verify-otp error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})

