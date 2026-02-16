# Production Mode Debug Guide - Location & Button Issue

## How to Run in Production Mode with Debug Logs

The app now has comprehensive logging that works in **both development and production modes**. The logs will help you identify:
- Your current location (latitude, longitude, accuracy)
- Why the "Start Task" button shows "Outside Geo-Fence"
- Location permission status
- Geofence configuration

## Step 1: Build and Run in Production Mode

### For Android:
```bash
cd ConstructionERPMobile

# Build production APK
npx expo build:android --type apk

# OR run production mode locally
npx expo start --no-dev --minify
```

### For iOS:
```bash
cd ConstructionERPMobile

# Run in production mode
npx expo start --no-dev --minify
```

## Step 2: View Console Logs

### Option A: Using React Native Debugger
1. Open the app
2. Shake device or press Cmd+D (iOS) / Cmd+M (Android)
3. Select "Debug"
4. Open Chrome DevTools at `chrome://inspect`

### Option B: Using Terminal (Recommended for Production)
```bash
# For Android
adb logcat | grep -E "PRODUCTION MODE|Location|Geofence|Button"

# For iOS
xcrun simctl spawn booted log stream --predicate 'eventMessage contains "PRODUCTION"'
```

### Option C: Using Expo Go
```bash
# In the terminal where you ran expo start
# Logs will appear automatically
```

## Step 3: What to Look For in Logs

### 1. Location State Debug
```
================================================================================
📍 PRODUCTION MODE - LOCATION STATE DEBUG
================================================================================
Current Location: { latitude: 12.9716, longitude: 77.5946, accuracy: 10 }
  - Has Location: true
  - Latitude: 12.9716
  - Longitude: 77.5946
  - Accuracy: 10
Location Permission: true
Location Enabled: true
Location Error: null
Development Mode (__DEV__): false
================================================================================
```

**What to check:**
- ✅ `Has Location: true` - Location is available
- ❌ `Has Location: false` - **NO LOCATION** - This is your problem!
- Check `Location Permission` and `Location Enabled`
- Note your actual coordinates

### 2. Task Rendering Debug
```
================================================================================
🎯 PRODUCTION MODE - RENDERING TASK ITEM
================================================================================
Task Name: Install LED Lights
Assignment ID: 7035
Task Status: pending
---
CAN START CHECKS:
  1. canStartTask (dependencies): true
  2. isInsideGeofence: false  ⚠️ THIS IS THE ISSUE
  3. Has Current Location: true
  4. Is Development Mode: false
  5. Is Offline: false
---
GEOFENCE DATA:
  - Has Geofence: true
  - Geofence Lat: 12.9716
  - Geofence Lng: 77.5946
  - Geofence Radius: 100
---
BUTTON STATE WILL BE:
  - Enabled: false
  - Reason:
    ❌ Outside geofence
================================================================================
```

**What to check:**
- If `isInsideGeofence: false` - You're outside the geofence
- Compare your location with the geofence coordinates
- Check the geofence radius (default 100m)

### 3. Button State Debug
```
================================================================================
🔘 PRODUCTION MODE - BUTTON STATE IN TASKCARD
================================================================================
Task: Install LED Lights
Props received:
  - canStart (from parent): true
  - isInsideGeofence (from parent): false  ⚠️ THIS IS WHY
  - isOffline (from parent): false
---
Button Logic:
  - canStartTask (final): false
  - Formula: canStart && isInsideGeofence && !isOffline
  - Result: true && false && true = false
---
Button will show: "Outside Geo-Fence" (danger, disabled)
  ⚠️ THIS IS YOUR ISSUE - isInsideGeofence is FALSE
---
Final Button State:
  - Title: Outside Geo-Fence
  - Variant: danger
  - Disabled: true
================================================================================
```

**What to check:**
- This shows exactly why the button is disabled
- `isInsideGeofence: false` means you're outside the geofence

## Common Issues and Solutions

### Issue 1: No Location Available
**Symptoms:**
```
Current Location: null
  ⚠️ NO LOCATION AVAILABLE
Has Location: false
```

**Solutions:**
1. **Grant Location Permission**
   - Go to Settings > Apps > Your App > Permissions
   - Enable Location permission
   - Set to "Allow all the time" or "Allow while using"

2. **Enable Location Services**
   - Go to Settings > Location
   - Turn on Location services

3. **Check LocationContext**
   - The LocationContext should provide a fallback location in dev mode
   - In production, it requires real GPS

### Issue 2: Outside Geofence
**Symptoms:**
```
isInsideGeofence: false
Your Location: 12.9716, 77.5946
Geofence Location: 13.0000, 77.6000
```

**Solutions:**
1. **Move Closer to Site**
   - You need to be within the geofence radius (usually 100m)
   - Use Google Maps to navigate to the exact coordinates

2. **Increase Geofence Radius (Testing Only)**
   - Update the project geofence in database
   - Increase radius to 500m or 1000m for testing

3. **Disable Geofence (Testing Only)**
   - Remove geofence data from the task
   - Or modify `isInsideGeofence` to always return `true`

### Issue 3: Location Permission Denied
**Symptoms:**
```
Location Permission: false
Location Enabled: true
```

**Solutions:**
1. **Request Permission Again**
   - Uninstall and reinstall the app
   - Grant permission when prompted

2. **Check App Settings**
   - Settings > Apps > Your App > Permissions
   - Ensure Location is enabled

## Testing in Production Mode

### Test 1: Check Your Current Location
1. Open the app
2. Navigate to Today's Tasks screen
3. Check console logs for your coordinates
4. Compare with Google Maps

### Test 2: Verify Geofence Configuration
1. Check the logs for geofence data
2. Note the geofence center coordinates
3. Note the geofence radius
4. Calculate your distance from center

### Test 3: Test Button State
1. Check if button shows "Outside Geo-Fence"
2. Look at the logs to see why
3. Verify all three conditions:
   - `canStart` (dependencies)
   - `isInsideGeofence` (location)
   - `!isOffline` (connectivity)

## Quick Fixes for Testing

### Fix 1: Temporarily Disable Geofence Check
In `TodaysTasksScreen.tsx`, modify `isInsideGeofence`:

```typescript
const isInsideGeofence = useCallback((task: TaskAssignment): boolean => {
  // TEMPORARY: Always return true for testing
  console.log('⚠️ GEOFENCE CHECK DISABLED FOR TESTING');
  return true;
  
  // Original code commented out...
}, [currentLocation]);
```

### Fix 2: Use Fallback Location in Production
In `LocationContext.tsx`, provide a fallback even in production:

```typescript
// Force fallback location for testing
const fallbackLocation = {
  latitude: 12.9716,  // Your project site coordinates
  longitude: 77.5946,
  accuracy: 100
};

// Use fallback if no real location
const location = realLocation || fallbackLocation;
```

### Fix 3: Increase Geofence Radius
Run this script to increase radius:

```bash
cd backend
node update-project-geofence-radius.js
```

## Expected Output (Working State)

When everything is working correctly, you should see:

```
📍 PRODUCTION MODE - LOCATION STATE DEBUG
Current Location: { latitude: 12.9716, longitude: 77.5946, accuracy: 10 }
  - Has Location: true ✅
Location Permission: true ✅
Location Enabled: true ✅

🎯 PRODUCTION MODE - RENDERING TASK ITEM
  2. isInsideGeofence: true ✅
  3. Has Current Location: true ✅

🔘 PRODUCTION MODE - BUTTON STATE IN TASKCARD
Button will show: "Start Task" (success, enabled) ✅
  - Disabled: false ✅
```

## Next Steps

1. **Run the app in production mode**
2. **Check the console logs** for the three debug sections
3. **Identify the issue** from the logs
4. **Apply the appropriate fix** from the solutions above
5. **Test again** to verify the fix

## Remove Debug Logs (Production Release)

Before releasing to production, remove or comment out the debug logs:

```typescript
// In TodaysTasksScreen.tsx and TaskCard.tsx
// Comment out or remove all console.log statements with "PRODUCTION MODE"
```

Or use a conditional:
```typescript
const DEBUG_MODE = false; // Set to false for production release

if (DEBUG_MODE) {
  console.log('...');
}
```

## Status
✅ Production mode logging enabled
✅ Location state tracking added
✅ Button state debugging added
✅ Geofence check logging added

The app is now ready to debug in production mode!
