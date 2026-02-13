# Emergency Reroute Button - Simplified & Practical

## What Was It Before?

The "Emergency Reroute" button showed a placeholder message:
```
"Dispatch has been notified. You will receive updated route instructions shortly."
```

But it didn't actually do anything - no dispatch notification, no rerouting, just a fake message.

## What Is It Now?

A practical emergency assistance button that gives drivers real options:

### When Driver Clicks "🚨 Emergency Reroute":

Shows alert with emergency situations:
```
🚨 Emergency Reroute

Are you unable to follow the planned route due to:

• Road closure
• Accident blocking road
• Flooding or weather
• Emergency situation

Contact dispatch immediately for assistance.
```

### Three Action Options:

1. **📞 Call Dispatch**
   - Opens phone dialer
   - Calls dispatch directly
   - Immediate human assistance

2. **📝 Report Issue**
   - Opens delay/breakdown reporting
   - Documents the incident
   - Saves GPS location
   - Notifies dispatch via system

3. **Cancel**
   - Returns to navigation screen

## Purpose & Use Cases

### When To Use:

✅ **Road Closure**
- Construction blocking route
- Police barricade
- Road maintenance

✅ **Accident**
- Traffic accident blocking road
- Emergency vehicles blocking route
- Major traffic jam

✅ **Weather Emergency**
- Flooding on route
- Snow/ice making road impassable
- Severe storm conditions

✅ **Safety Concern**
- Unsafe road conditions
- Vehicle breakdown blocking route
- Emergency situation

### When NOT To Use:

❌ Minor traffic delays (use Report Delay instead)
❌ Wrong turn (just navigate back)
❌ Running late (use Report Delay)
❌ Vehicle issues (use Report Breakdown)

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Driver encounters emergency situation                   │
│    (road closure, accident, flooding, etc.)                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Driver clicks "🚨 Emergency Reroute" button             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Alert shows emergency situations and options            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Driver chooses action:                                   │
│                                                             │
│    Option A: 📞 Call Dispatch                              │
│    ├─ Opens phone dialer                                   │
│    ├─ Calls dispatch number                                │
│    └─ Speaks with dispatcher for instructions              │
│                                                             │
│    Option B: 📝 Report Issue                               │
│    ├─ Opens delay/breakdown form                           │
│    ├─ Selects issue type                                   │
│    ├─ Captures GPS location                                │
│    └─ Submits to dispatch system                           │
│                                                             │
│    Option C: Cancel                                         │
│    └─ Returns to navigation screen                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Dispatch provides assistance:                           │
│    • New route instructions                                 │
│    • Alternative pickup locations                           │
│    • Backup vehicle if needed                               │
│    • Emergency support                                      │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### Code:
```typescript
const handleEmergencyReroute = useCallback(async () => {
  if (!selectedTask) {
    Alert.alert('Error', 'Please select a transport task first');
    return;
  }

  Alert.alert(
    '🚨 Emergency Reroute',
    'Are you unable to follow the planned route due to:\n\n' +
    '• Road closure\n' +
    '• Accident blocking road\n' +
    '• Flooding or weather\n' +
    '• Emergency situation\n\n' +
    'Contact dispatch immediately for assistance.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: '📞 Call Dispatch',
        onPress: () => {
          const dispatchPhone = 'tel:+1234567890'; // Replace with actual number
          Linking.openURL(dispatchPhone).catch(() => {
            Alert.alert('Error', 'Unable to open phone dialer');
          });
        },
      },
      {
        text: '📝 Report Issue',
        onPress: () => {
          handleReportIssue(); // Uses existing delay/breakdown reporting
        },
      },
    ]
  );
}, [selectedTask, handleReportIssue]);
```

### Configuration:

**Update Dispatch Phone Number:**
```typescript
// In TransportTasksScreen.tsx, line ~395
const dispatchPhone = 'tel:+1234567890'; // ← Change this to your dispatch number
```

**Examples:**
- US: `tel:+12125551234`
- India: `tel:+919876543210`
- UK: `tel:+442071234567`

## Benefits

### Before (Fake Implementation):
❌ Showed fake "dispatch notified" message
❌ No actual functionality
❌ Confused drivers
❌ No real help in emergencies
❌ Required backend implementation

### After (Practical Implementation):
✅ Real phone call to dispatch
✅ Immediate human assistance
✅ Uses existing report system
✅ No backend work needed
✅ Actually helps drivers in emergencies
✅ Simple and reliable

## Comparison with Other Buttons

### Report Delay/Breakdown:
- **Purpose**: Document delays and breakdowns
- **Action**: Saves incident to database
- **Use**: Traffic delays, vehicle issues
- **Response**: Dispatch notified via system

### Emergency Reroute:
- **Purpose**: Get immediate help for route blockage
- **Action**: Call dispatch or report issue
- **Use**: Road closures, accidents, emergencies
- **Response**: Immediate phone assistance or system notification

### Navigate Button:
- **Purpose**: Open GPS navigation
- **Action**: Opens Google Maps/Waze
- **Use**: Normal route following
- **Response**: Turn-by-turn directions

## Testing Recommendations

1. **Test Call Dispatch**:
   - ✅ Click Emergency Reroute
   - ✅ Click "Call Dispatch"
   - ✅ Verify phone dialer opens
   - ✅ Check correct number displayed
   - ✅ Test on iOS and Android

2. **Test Report Issue**:
   - ✅ Click Emergency Reroute
   - ✅ Click "Report Issue"
   - ✅ Verify delay/breakdown form opens
   - ✅ Submit test report
   - ✅ Check incident saved

3. **Test Cancel**:
   - ✅ Click Emergency Reroute
   - ✅ Click "Cancel"
   - ✅ Verify returns to navigation screen

4. **Test Error Handling**:
   - ✅ Test with no phone app (rare)
   - ✅ Verify error message shows
   - ✅ Test with no task selected

## Configuration Checklist

Before deploying, update:

1. **Dispatch Phone Number**:
   ```typescript
   const dispatchPhone = 'tel:+1234567890'; // ← Update this
   ```

2. **Emergency Contact Info**:
   - Add to company documentation
   - Train drivers on when to use
   - Provide dispatch availability hours

3. **Alternative Contacts**:
   - Consider adding multiple dispatch numbers
   - Add supervisor contact option
   - Add emergency services if needed

## Future Enhancements (Optional)

If you want to add more features later:

1. **Multiple Dispatch Numbers**:
   - Day dispatch
   - Night dispatch
   - Emergency dispatch
   - Supervisor

2. **GPS Location Sharing**:
   - Send current location via SMS
   - Share location link
   - Real-time tracking

3. **Photo Upload**:
   - Take photo of road closure
   - Document accident scene
   - Send to dispatch

4. **Alternative Routes**:
   - Suggest nearby routes
   - Show on map
   - Calculate time difference

## Notes

- Phone dialer opens automatically on both iOS and Android
- Dispatch number can be changed in code (line ~395)
- Uses existing Report Issue functionality for documentation
- No backend changes required
- Works offline (phone call)
- Simple and reliable for emergencies
- Drivers get immediate human assistance when needed
