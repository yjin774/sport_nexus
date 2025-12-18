// Supabase Edge Function: check-closing-availability
// Checks if closing counter is available based on working hours
//
// Returns:
// - available: boolean - whether closing is available
// - message: string - status message
// - currentTime: string - current system time
// - workingHours: object - start and end times

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_PROJECT_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY') || ''

// Convert time string (HH:MM:SS) to minutes for comparison
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const parts = timeStr.split(':')
  if (parts.length < 2) return 0
  const hours = parseInt(parts[0], 10) || 0
  const minutes = parseInt(parts[1], 10) || 0
  return hours * 60 + minutes
}

// Get current time in minutes
function getCurrentTimeMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    // Get settings from Supabase
    const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/settings?singleton=eq.true&select=working_hours_start,working_hours_end`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      console.error('Error fetching settings:', errorText)
      return new Response(
        JSON.stringify({
          available: false,
          message: 'Unable to retrieve working hours. Closing unavailable.',
          error: 'Settings not found',
        }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      )
    }

    const settings = await res.json()
    
    if (!settings || settings.length === 0 || !settings[0]) {
      return new Response(
        JSON.stringify({
          available: false,
          message: 'Working hours not configured. Closing unavailable.',
          error: 'Settings not found',
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      )
    }

    const workingHoursStart = settings[0].working_hours_start || '09:00:00'
    const workingHoursEnd = settings[0].working_hours_end || '18:00:00'

    // Get current time
    const currentTimeMinutes = getCurrentTimeMinutes()
    const startMinutes = timeToMinutes(workingHoursStart)
    const endMinutes = timeToMinutes(workingHoursEnd)

    // Format current time for response
    const now = new Date()
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    // Check if closing is available
    // Closing is available only during working hours (between start and end time)
    let available = false
    let message = ''

    if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes) {
      // Within working hours - closing is available
      available = true
      message = 'Closing counter is available'
    } else if (currentTimeMinutes >= endMinutes) {
      // Past closing time - closing unavailable until next day's start time
      available = false
      message = 'Closing counter unavailable yet. Please wait until working hours resume.'
    } else {
      // Before opening time - closing unavailable until start time
      available = false
      message = 'Closing counter unavailable yet. Please wait until working hours begin.'
    }

    return new Response(
      JSON.stringify({
        available,
        message,
        currentTime: currentTimeStr,
        workingHours: {
          start: workingHoursStart,
          end: workingHoursEnd,
        },
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in check-closing-availability:', error)
    return new Response(
      JSON.stringify({
        available: false,
        message: 'Error checking closing availability',
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    )
  }
})

