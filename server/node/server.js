/**
 * Example Node/Express server implementing /send-otp and /verify-otp.
 *
 * IMPORTANT: This is a scaffold/example. Replace placeholders, secure your keys,
 * and run behind HTTPS. Do not commit SERVICE_ROLE_KEY to source control.
 *
 * Environment variables expected:
 * - SUPABASE_URL
 * - SERVICE_ROLE_KEY
 * - SENDGRID_API_KEY
 * - OTP_SECRET
 */

require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');

const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const OTP_SECRET = process.env.OTP_SECRET || 'replace-me';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_URL and SERVICE_ROLE_KEY should be set as environment variables.');
}

if (SENDGRID_API_KEY) sgMail.setApiKey(SENDGRID_API_KEY);

function hmacOtp(email, otp) {
  return crypto.createHmac('sha256', OTP_SECRET).update(`${email}:${otp}`).digest('hex');
}

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper to insert password_reset record via Supabase REST API (PostgREST)
async function insertPasswordReset(email, otp_hmac, expires_at) {
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/password_resets`;
  const body = [{ email, otp_hmac, expires_at }];
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify(body),
  });
  return res;
}

// Helper to query latest valid password_reset
async function getLatestReset(email) {
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/password_resets?email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=1`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (data && data.length) ? data[0] : null;
}

// send-otp: generate OTP, store HMAC in DB, and send email (SendGrid example)
app.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Missing email' });

    const otp = genOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    const otp_hmac = hmacOtp(email, otp);

    // Insert into password_resets table
    await insertPasswordReset(email, otp_hmac, expiresAt);

    // Send email with OTP using SendGrid (if configured)
    if (SENDGRID_API_KEY) {
      const msg = {
        to: email,
        from: 'no-reply@yourdomain.example',
        subject: 'Your OTP code',
        text: `Your OTP code is: ${otp} (valid for 10 minutes)`,
        html: `<p>Your OTP code is: <strong>${otp}</strong> (valid for 10 minutes)</p>`,
      };
      await sgMail.send(msg);
    } else {
      // For local testing without mail, log OTP to console.
      console.log(`OTP for ${email}: ${otp}`);
    }

    return res.json({ message: 'OTP sent' });
  } catch (err) {
    console.error('send-otp error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// verify-otp: validate OTP and update Supabase auth password using admin API
app.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ message: 'Missing parameters' });

    // Get latest password_reset record for this email
    const record = await getLatestReset(email);
    if (!record) return res.status(400).json({ message: 'No OTP requested for this email' });

    if (record.used) return res.status(400).json({ message: 'OTP already used' });

    const now = new Date();
    if (new Date(record.expires_at) < now) return res.status(400).json({ message: 'OTP expired' });

    const expected = hmacOtp(email, otp);
    if (expected !== record.otp_hmac) return res.status(400).json({ message: 'Invalid OTP' });

    // Find the user in Supabase Auth via admin endpoint
    // GET /auth/v1/admin/users?email=<email>
    const listUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
    const listRes = await fetch(listUrl, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      }
    });
    if (!listRes.ok) return res.status(500).json({ message: 'Failed to lookup user' });
    const users = await listRes.json();
    if (!users || !users.length) return res.status(404).json({ message: 'User not found' });
    const user = users[0];

    // Update user password via admin API
    const updateUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/admin/users/${user.id}`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ password: newPassword })
    });

    if (!updateRes.ok) {
      const txt = await updateRes.text().catch(() => '');
      console.error('update user failed', updateRes.status, txt);
      return res.status(500).json({ message: 'Failed to update password' });
    }

    // Mark OTP as used (update password_resets record). Use PostgREST to update.
    const markUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/password_resets?id=eq.${record.id}`;
    await fetch(markUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ used: true })
    });

    return res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('verify-otp error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
