# Location Permission & Production Mode Guide

## Current Status

Your app is now configured to work in **PRODUCTION MODE** with real GPS location.

## What Changed

The previous development mode bypasses have been **REMOVED**. The app will now:

1. ✅ Request location permission from the user
2. ✅ Use real GPS coordinates from your device
3. ✅ Validate geofence using actual location
4. ✅ Require you to be physically at the project site

## How to Test

### Step 1: Grant Location Permission

When you open the app, you will see a popup:
```
"Construction ERP Mobile would like to access your location"
```

**Action Required:** Tap "Allow" or "Allow While Using App"

### Step 2: Enable Location Services

If you see "Please enable location service" popup:

**On Android:**
1. Go to Settings → Location
2. Turn ON "Use location"
3. Return to the app

**On iOS:**
1. Go to Settings → Privacy → Location Services
2. Turn ON "Location Services"
3. Find "Construction ERP Mobile" and set to "While Using App"
4. Return to the app

### Step 3: Test Geofence Validation

The app will now check if you are within the project geofence:

- **Project Location:** 12.9716°N, 77.5946°E (Bangalore)
- **Geofence Radius:** 100 meters + 20 meters tolerance
- **Total Range:** 120 meters from project center

**Start Task Button States:**
- 🟢 **Green "Start Task"** = Inside geofence, ready to start
- 🔴 **Red "Outside Geo-Fence"** = Too far from project site
- ⚪ **Gray "Dependencies Required"** = Previous tasks not completed
- ⚪ **Gray "Offline"** = No internet connection

## Important Notes

### Geofence Configuration

The current project (ID: 1003) is configured with:
```javascript
Location: 12.9716, 77.5946 (Bangalore)
Radius: 100m
Tolerance: 20m
```

**If you are testing from a different location:**

You need to update the project geofence to match your actual testing location. Run this backend script:

```bash
cd backend
node update-project-location.js
```

Or manually update in the database:
```javascript
db.projects.updateOne(
  { projectId: 1003 },
  { 
    $set: { 
      "geofence.latitude": YOUR_LATITUDE,
      "geofence.longitude": YOUR_LONGITUDE,
      "geofence.radius": 100,
      "geofence.allowedVariance": 20
    }
  }
)
```

### GPS Accuracy

The app requires GPS accuracy of **10 meters or better**. If you see accuracy warnings:

1. Move to an open area (away from buildings)
2. Wait 30-60 seconds for GPS to stabilize
3. Ensure you have clear view of the sky

### Development vs Production Mode

**Development Mode (`__DEV__ = true`):**
- Uses fallback location if GPS fails
- Bypasses geofence validation
- More permissive error handling

**Production Mode (`__DEV__ = false`):**
- Requires real GPS location
- Enforces geofence validation
- Strict error handling

**Current Mode:** The app detects this automatically based on how you run it:
- `npm start` = Development mode
- `expo build` or EAS build = Production mode

## Troubleshooting

### "Location permission denied"

**Solution:** Go to device settings and manually grant location permission to the app.

### "Location services are disabled"

**Solution:** Enable location services in device settings (see Step 2 above).

### Button still shows "Outside Geo-Fence"

**Possible causes:**
1. You are actually outside the 120m range
2. GPS accuracy is poor (>10m)
3. Project geofence coordinates don't match your location

**Solution:** 
- Check your distance from project site
- Wait for better GPS signal
- Update project geofence coordinates if testing from different location

### GPS accuracy is poor

**Solution:**
- Move outdoors to open area
- Wait for GPS to acquire more satellites
- Avoid testing near tall buildings or indoors

## Testing Checklist

- [ ] Location permission granted
- [ ] Location services enabled on device
- [ ] GPS accuracy < 10 meters
- [ ] Within 120 meters of project location (12.9716, 77.5946)
- [ ] Backend server running
- [ ] Checked in for attendance
- [ ] No other tasks in progress
- [ ] All dependency tasks completed

## Next Steps

1. **Rebuild the app** to ensure all changes are applied:
   ```bash
   cd ConstructionERPMobile
   npm start -- --clear
   ```

2. **Grant location permission** when prompted

3. **Test the Start Task button** - it should be green if you're at the project site

4. **If testing from a different location**, update the project geofence coordinates first

## Backend Scripts Reference

**Check current geofence configuration:**
```bash
cd backend
node check-geofence-status.js
```

**Update project location:**
```bash
cd backend
node update-project-location.js
```

**Check attendance status:**
```bash
cd backend
node check-todays-attendance.js
```

**Check task assignments:**
```bash
cd backend
node check-all-assignments-today.js
```

## Support

If you continue to have issues:

1. Check the console logs for detailed error messages
2. Verify backend server is running and accessible
3. Ensure you have checked in for attendance
4. Confirm project geofence coordinates match your testing location
5. Try restarting the app after granting permissions
