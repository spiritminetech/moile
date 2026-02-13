# Fix Worker Names Showing as "Worker 1", "Worker 2"

## Problem
After completing a task, worker names show as "Worker 1", "Worker 2", "Worker 3" instead of real names like "Sarah Williams", "Raj Kumar", "Ravi Smith".

## Root Cause
The FleetTaskPassenger collection has corrupted `workerEmployeeId` values like `10003001`, `10003002`, `10003003` instead of real employee IDs like `104`, `107`, `2`. When the backend tries to look up employees with these IDs, it fails and falls back to generic names.

## Solution
Run the fix script to update the corrupted passenger records with real employee IDs.

## Steps to Fix

### 1. Stop the backend server
Press `Ctrl+C` in the terminal running the backend

### 2. Run the fix script
```bash
cd moile/backend
node fix-corrupted-passenger-ids.js
```

### 3. Verify the fix
The script will show output like:
```
🔍 Finding corrupted passenger records...
📊 Found 3 corrupted passenger records
👥 Found 5 valid employees in database

🔧 Fixing task 10003 with 3 passengers...
   Updating passenger 8339:
      Old workerEmployeeId: 10003001
      New workerEmployeeId: 104 (Sarah Williams)
   Updating passenger 8340:
      Old workerEmployeeId: 10003002
      New workerEmployeeId: 107 (Raj Kumar)
   Updating passenger 8341:
      Old workerEmployeeId: 10003003
      New workerEmployeeId: 2 (Ravi Smith)
   ✅ Fixed 3 passengers for task 10003

🎉 All corrupted passenger records have been fixed!
```

### 4. Restart the backend server
```bash
npm start
```

### 5. Test in the mobile app
1. Open the Driver app
2. Navigate to a completed task
3. Click "Navigate" to view the task details
4. Worker names should now show correctly (Sarah Williams, Raj Kumar, Ravi Smith)
5. Completion banner should show correct counts (e.g., "2 of 3 workers were dropped off")

## What Was Fixed

### Frontend Changes (Already Applied)
- Modified `TransportTasksScreen.tsx` to load worker manifests for completed tasks when they have no data
- Added logging to track dropStatus during worker transformation

### Backend Fix (Run Script Above)
- Updates corrupted `workerEmployeeId` values in FleetTaskPassenger collection
- Assigns real employee IDs so backend can look up correct names

## Expected Results After Fix
- ✅ Worker names display correctly after completion
- ✅ Completion banner shows accurate counts
- ✅ No more "Worker 1", "Worker 2" placeholders
- ✅ DropStatus values are correctly loaded and displayed
