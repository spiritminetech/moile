# Complete Fix Guide - Daily Job Target Not Showing

## Current Status ✅

1. ✅ Database updated - All 3 assignments now dated 2026-02-15
2. ✅ Schema has all 9 Daily Job Target fields
3. ✅ UI component ready with comprehensive display
4. ✅ TypeScript types updated
5. ❌ Backend server needs to be running
6. ❌ Mobile app cache needs to be cleared

## What You Need to Do Now

### Step 1: Start Backend Server (CRITICAL)

The backend server must be running for the mobile app to fetch fresh data.

```bash
# Navigate to backend directory
cd backend

# Start the server
npm start
```

**Wait for this message:**
```
✅ Connected to MongoDB
✅ Server running on port 5002
```

**Keep this terminal window open!** The server must stay running.

### Step 2: Verify API Works

Open a NEW terminal window and test the API:

```bash
node backend/test-assignment-7035-api.js
```

**Expected output:**
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
```

If you see "Found 0 tasks", the backend server is not running properly.

### Step 3: Clear Mobile App Cache

The mobile app is showing old cached data from 2026-02-14. You need to force it to fetch fresh data.

#### Option A: Pull to Refresh (Try This First)
1. Open the mobile app
2. Go to "Today's Tasks" screen
3. Pull down from the top to refresh
4. Wait for loading to complete

#### Option B: Restart Mobile App
1. Close the mobile app completely
2. Reopen it
3. Login again as worker@gmail.com / password123

#### Option C: Clear App Data (Most Thorough)
1. Uninstall the app from your device/emulator
2. In ConstructionERPMobile directory:
   ```bash
   npm start
   ```
3. Press 'a' for Android or 'i' for iOS
4. Login again

### Step 4: Verify Daily Job Target Shows

After clearing cache, expand any task card and you should see:

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

## Troubleshooting

### Problem: Backend won't start
**Solution:** Check if port 5002 is already in use
```bash
# Windows
netstat -ano | findstr :5002

# If port is in use, kill the process or change port in .env
```

### Problem: API returns 0 tasks
**Possible causes:**
1. Backend server not running → Start it with `npm start`
2. Wrong date in database → Already fixed (2026-02-15)
3. Wrong employee ID → Should be 2 for worker@gmail.com
4. MongoDB connection issue → Check .env file

### Problem: Mobile app still shows old data
**Solution:** The app is using cached data. Try these in order:
1. Pull to refresh in the app
2. Restart the app completely
3. Clear app data (Settings → Apps → Your App → Clear Data)
4. Uninstall and reinstall the app

### Problem: Daily Job Target section not visible
**Check these:**
1. Is the task card EXPANDED? (Tap to expand)
2. Is the backend server running?
3. Did you restart Metro bundler after code changes?
4. Check Metro bundler console for errors

## What Was Changed

### Database (WorkerTaskAssignment collection)
Added enhanced `dailyTarget` fields to all 3 assignments:
- Assignment 7035: 25 LED Lighting Installations, Tower A – Level 2
- Assignment 7036: 150 Square Meters painting, Main Corridor
- Assignment 7034: 50 Bricks bricklaying, Ground Floor

### Code Files
1. `backend/src/modules/worker/models/WorkerTaskAssignment.js` - Schema
2. `ConstructionERPMobile/src/types/index.ts` - TypeScript types
3. `ConstructionERPMobile/src/components/cards/TaskCard.tsx` - UI component

### Scripts Created
1. `backend/update-assignments-to-feb-15.js` - Update dates to today
2. `backend/fix-daily-target-complete-fields.js` - Populate daily target data
3. `backend/test-assignment-7035-api.js` - Test API response

## Quick Test Checklist

- [ ] Backend server is running (port 5002)
- [ ] API test returns 3 tasks with Daily Job Target data
- [ ] Mobile app cache cleared (pull to refresh or restart)
- [ ] Task card expanded to see full details
- [ ] Daily Job Target section visible with all fields
- [ ] Progress bar showing 0% (green section)

## Expected Result

When you expand a task card, you should see a green section with:
- Target Type
- Expected Output (highlighted in green)
- Area/Level
- Start Time
- Expected Finish
- Progress Today section with:
  - Completed units
  - Progress bar
  - Percentage

The section should only appear in EXPANDED view, not in collapsed/summary view.

## Need Help?

If you're still having issues:
1. Check backend server console for errors
2. Check Metro bundler console for errors
3. Check mobile app logs for network errors
4. Verify you're logged in as worker@gmail.com
5. Verify today's date is 2026-02-15
