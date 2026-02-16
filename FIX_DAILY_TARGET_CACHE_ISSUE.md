# Fix Daily Job Target Not Showing - Cache Issue

## Problem
The mobile app is displaying cached data from 2026-02-14, but the database has been updated with fresh data for 2026-02-15. The Daily Job Target section exists in the code but shows no data because the app is using old cached data.

## Root Cause
1. Assignments in database are dated **2026-02-14**
2. Today's date is **2026-02-15**
3. API filters tasks by date, so returns 0 tasks for today
4. Mobile app falls back to cached data from yesterday (2026-02-14)
5. Yesterday's cached data doesn't have the new Daily Job Target fields

## Solution Steps

### Step 1: Start Backend Server
The backend must be running to update the database.

```bash
# In backend directory
npm start
```

Wait for: `✅ Server running on port 5000`

### Step 2: Update Assignment Dates to Today

Run this script to update all 3 assignments to today (2026-02-15):

```bash
node backend/update-assignments-to-feb-15.js
```

Expected output:
```
✅ Connected to MongoDB
✅ Updated 3 assignments to 2026-02-15
📋 Verification:
  Assignment 7034: date = 2026-02-15
  Assignment 7035: date = 2026-02-15
  Assignment 7036: date = 2026-02-15
✅ Done
```

### Step 3: Verify API Returns Fresh Data

Test the API to confirm it now returns tasks with Daily Job Target data:

```bash
node backend/test-assignment-7035-api.js
```

Expected output:
```
✅ Login successful
✅ Tasks fetched successfully
Found 3 tasks
✅ Assignment 7035 found!

Daily Job Target Data:
  targetType: Quantity Based
  quantity: 25
  unit: LED Lighting Installations
  areaLevel: Tower A – Level 2
  startTime: 08:00 AM
  expectedFinish: 05:00 PM
  progressToday: { completed: 0, total: 25, percentage: 0 }
```

### Step 4: Clear Mobile App Cache

The mobile app needs to fetch fresh data. You have 3 options:

#### Option A: Force Refresh in App (Easiest)
1. Open the mobile app
2. Pull down on the Today's Tasks screen to refresh
3. This should fetch fresh data from the API

#### Option B: Clear AsyncStorage Cache
1. In your mobile app, add a debug button to clear cache
2. Or use React Native Debugger to clear AsyncStorage
3. Restart the app

#### Option C: Reinstall App (Most Thorough)
1. Uninstall the app from your device/emulator
2. Rebuild and reinstall:
   ```bash
   # In ConstructionERPMobile directory
   npm start
   # Then press 'a' for Android or 'i' for iOS
   ```

### Step 5: Verify Daily Job Target Displays

After clearing cache, you should see in the expanded task card:

```
🎯 DAILY JOB TARGET
--------------------------------------------------
Target Type:        Quantity Based
Expected Output:    25 LED Lighting Installations
Area/Level:         Tower A – Level 2
Start Time:         08:00 AM
Expected Finish:    05:00 PM

Progress Today:
Completed: 0 / 25 Units
Progress: 0%
```

## What Was Implemented

### 1. Database Schema (WorkerTaskAssignment)
Enhanced `dailyTarget` object with 9 fields:
- `targetType` - Type of target (Quantity/Time/Area Based)
- `quantity` - Target amount
- `unit` - Unit of measurement
- `targetCompletion` - Target percentage
- `areaLevel` - Work area/level
- `startTime` - Expected start time
- `expectedFinish` - Expected finish time
- `progressToday.completed` - Units completed
- `progressToday.total` - Total units
- `progressToday.percentage` - Progress percentage

### 2. TypeScript Types (index.ts)
Updated `TaskAssignment` interface with enhanced `dailyTarget` fields

### 3. UI Component (TaskCard.tsx)
Added comprehensive Daily Job Target section:
- Only shows in expanded view (not collapsed)
- Green background with left border
- Formatted display with labels and values
- Progress bar with color coding
- All 9 fields displayed in user-friendly format

### 4. Sample Data
Created complete daily target data for all 3 assignments:
- Assignment 7035: 25 LED Lighting Installations
- Assignment 7036: 150 Square Meters painting
- Assignment 7034: 50 Bricks bricklaying

## Troubleshooting

### If API Still Returns 0 Tasks
- Check backend server is running: `http://localhost:5000/health`
- Verify MongoDB is running
- Check assignment dates in database
- Verify employee ID is 2 for worker@gmail.com

### If Mobile App Still Shows Old Data
- Check network connection between app and backend
- Look for error messages in Metro bundler console
- Check if API base URL is correct in app config
- Try clearing app data completely (uninstall/reinstall)

### If Daily Job Target Section Not Visible
- Make sure task card is EXPANDED (tap to expand)
- Check that task has `dailyTarget` data in API response
- Verify backend was restarted after schema changes
- Check Metro bundler was restarted after code changes

## Files Modified

1. `backend/src/modules/worker/models/WorkerTaskAssignment.js` - Schema
2. `ConstructionERPMobile/src/types/index.ts` - TypeScript types
3. `ConstructionERPMobile/src/components/cards/TaskCard.tsx` - UI
4. `backend/fix-daily-target-complete-fields.js` - Data population
5. `backend/update-assignments-to-feb-15.js` - Date update script

## Next Steps

Once you see the Daily Job Target displaying correctly:
1. Test with different task types
2. Update progress values to see progress bar change
3. Test with different target types (Time Based, Area Based)
4. Verify all fields display correctly on different screen sizes
