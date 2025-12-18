# Mobile POS Closing Counter Availability

## Overview
The closing counter in the mobile POS should only be available during working hours. This document explains how to implement the closing availability check.

## Edge Function: `check-closing-availability`

### Endpoint
```
GET https://[YOUR_SUPABASE_URL]/functions/v1/check-closing-availability
```

### Authentication
No authentication required (public endpoint).

### Response Format
```json
{
  "available": boolean,
  "message": string,
  "currentTime": string,
  "workingHours": {
    "start": string,
    "end": string
  }
}
```

### Response Examples

**When closing is available (during working hours):**
```json
{
  "available": true,
  "message": "Closing counter is available",
  "currentTime": "14:30:00",
  "workingHours": {
    "start": "09:00:00",
    "end": "18:00:00"
  }
}
```

**When closing is unavailable (after closing time):**
```json
{
  "available": false,
  "message": "Closing counter unavailable yet. Please wait until working hours resume.",
  "currentTime": "19:30:00",
  "workingHours": {
    "start": "09:00:00",
    "end": "18:00:00"
  }
}
```

**When closing is unavailable (before opening time):**
```json
{
  "available": false,
  "message": "Closing counter unavailable yet. Please wait until working hours begin.",
  "currentTime": "08:30:00",
  "workingHours": {
    "start": "09:00:00",
    "end": "18:00:00"
  }
}
```

## Implementation Logic

### Rules
1. **Closing is available** when current time is between `working_hours_start` and `working_hours_end` (inclusive start, exclusive end)
2. **Closing is unavailable** when current time >= `working_hours_end` (until next day's start time)
3. **Closing is unavailable** when current time < `working_hours_start` (until start time)

### Mobile POS Implementation

#### Flutter/Dart Example
```dart
Future<bool> checkClosingAvailability() async {
  try {
    final response = await http.get(
      Uri.parse('https://[YOUR_SUPABASE_URL]/functions/v1/check-closing-availability'),
      headers: {
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['available'] ?? false;
    }
    return false;
  } catch (e) {
    print('Error checking closing availability: $e');
    return false;
  }
}

// Usage in UI
void updateClosingButton() async {
  final isAvailable = await checkClosingAvailability();
  setState(() {
    _closingAvailable = isAvailable;
  });
}
```

#### React Native Example
```javascript
const checkClosingAvailability = async () => {
  try {
    const response = await fetch(
      'https://[YOUR_SUPABASE_URL]/functions/v1/check-closing-availability',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return data.available || false;
  } catch (error) {
    console.error('Error checking closing availability:', error);
    return false;
  }
};

// Usage in component
useEffect(() => {
  const checkAvailability = async () => {
    const available = await checkClosingAvailability();
    setClosingAvailable(available);
  };
  
  checkAvailability();
  // Poll every minute to check availability
  const interval = setInterval(checkAvailability, 60000);
  return () => clearInterval(interval);
}, []);
```

## UI Implementation

### Button State
- **When `available: true`**: Enable the closing counter button
- **When `available: false`**: Disable the closing counter button and show the message

### Display Message
Show the `message` field from the response to inform users why closing is unavailable:
- "Closing counter unavailable yet. Please wait until working hours resume." (after closing time)
- "Closing counter unavailable yet. Please wait until working hours begin." (before opening time)

### Polling
It's recommended to poll this endpoint periodically (e.g., every minute) to update the button state automatically when working hours change.

## Working Hours Configuration

Working hours are configured in the General Settings page (`general-settings.html`):
- **Opening Time**: `working_hours_start` (default: 09:00:00)
- **Closing Time**: `working_hours_end` (default: 18:00:00)

These settings are stored in the `settings` table in Supabase and can be updated by administrators.

## Error Handling

If the Edge Function returns an error or the settings are not found:
- Default to `available: false`
- Show message: "Unable to check closing availability. Please try again later."
- Log the error for debugging

## Testing

### Test Cases
1. **During working hours** (e.g., 14:00): Should return `available: true`
2. **After closing time** (e.g., 19:00): Should return `available: false` with message about waiting
3. **Before opening time** (e.g., 08:00): Should return `available: false` with message about waiting
4. **At exact closing time** (e.g., 18:00): Should return `available: false`
5. **At exact opening time** (e.g., 09:00): Should return `available: true`

## Notes

- All times are in 24-hour format (HH:MM:SS)
- Time comparison is based on hours and minutes only (seconds are ignored)
- The system uses server time (Supabase server timezone) for consistency
- Working hours are checked in real-time, so changes to settings take effect immediately

