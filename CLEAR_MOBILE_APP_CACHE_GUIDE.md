# Clear Mobile App Cache - Step-by-Step Guide

## Problem
You can only see "Expected Output: 25 LED Lighting Installations" but NOT the other enhanced fields:
- ❌ Target Type
- ❌ Area/Level
- ❌ Start Time
- ❌ Expected Finish
- ❌ Progress Today

## Root Cause
The mobile app is showing **cached data** from before the backend API was fixed. The backend is now returning all fields correctly, but the mobile app hasn't fetched fresh data yet.

---

## Solution: Clear Cache and Fetch Fresh Data

### Method 1: Pull to Refresh (Easiest)
1. Open the mobile app
2. Go to "Today's Tasks" screen
3. **Pull down from the top** of the task list
4. Wait for the refresh to complete
5. **Expand a task card** by tapping on it
6. Scroll down to see the Daily Job Target section

### Method 2: Force Close and Restart App
1. **Close the app completely** (swipe it away from recent apps)
2. Wait 5 seconds
3. **Reopen the app**
4. Navigate to "Today's Tasks"
5. **Expand a task card** by tapping on it
6. Scroll down to see the Daily Job Target section

### Method 3: Clear App Data (Most Thorough)

#### For Android:
1. Go to Settings → Apps → Construction ERP
2. Tap "Storage"
3. Tap "Clear Data" or "Clear Cache"
4. Reopen the app
5. **Log in again** with worker@gmail.com / password123
6. Navigate to "Today's Tasks"
7. **Expand a task card**

#### For iOS:
1. Delete the app completely
2. Reinstall from App Store or rebuild with Expo
3. **Log in again** with worker@gmail.com / password123
4. Navigate to "Today's Tasks"
5. **Expand a task card**

### Method 4: Rebuild the App (Development Only)
If you're running in development mode:

```bash
# Stop the current app
# Then rebuild and restart

cd ConstructionERPMobile
npx expo start --clear
```

Then press 'a' for Android or 'i' for iOS to rebuild.

---

## How to Verify It's Working

After clearing the cache, you should see ALL these fields when you expand a task card:

```
🎯 DAILY JOB TARGET
--------------------------------------------------
Target Type:        Quantity Based              ← Should appear
Expected Output:    25 LED Lighting Installations ← Already visible
Area/Level:         Tower A – Level 2           ← Should appear
Start Time:         08:00 AM                    ← Should appear
Expected Finish:    05:00 PM                    ← Should appear

Progress Today:                                 ← Should appear
Completed: 0 / 25 LED Lighting Installations
Progress: 0%
[Progress bar]
```

---

## Important Notes

1. **You MUST expand the task card** - The Daily Job Target section only shows in expanded view, not in the collapsed summary
2. **Backend is already fixed** - The API is returning all fields correctly (verified)
3. **Frontend UI is ready** - The TaskCard component has the complete implementation
4. **Only cache is the issue** - The mobile app just needs to fetch fresh data

---

## If Still Not Working After Cache Clear

If you've tried all methods above and still only see "Expected Output", check:

1. **Are you expanding the task card?**
   - Tap on the task card to expand it
   - The Daily Job Target section is ONLY in the expanded view

2. **Check the API response in console:**
   - Look for console logs showing the task data
   - Verify `dailyTarget.targetType`, `dailyTarget.areaLevel`, etc. are present

3. **Verify backend is running:**
   - Backend should be running on port 5002
   - Check if you can access http://localhost:5002/api/health

4. **Check network connectivity:**
   - Make sure the mobile app can reach the backend
   - Check if other data is loading correctly

---

## Quick Test

To quickly verify the backend is returning the correct data:

```bash
cd backend
node test-enhanced-daily-target-api.js
```

This should show:
```
✅ SUCCESS: All enhanced daily target fields are present in API response!
```

If this test passes but the mobile app still doesn't show the fields, the issue is definitely the mobile app cache.
