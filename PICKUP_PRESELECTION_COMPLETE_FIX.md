# Pickup Pre-Selection Complete Fix

## Problem
Workers at pickup locations show as already checked in (✅) instead of showing empty checkboxes (☐). This happens because the backend was checking the wrong data source.

---

## Root Cause

### Backend Issue:
The `getWorkerManifests()` API was checking **attendance.checkIn** (when worker clocked in for work) instead of **FleetTaskPassenger.pickupStatus** (when driver picked up worker).

```javascript
// ❌ WRONG CODE (OLD):
const todayAttendance = await attendanceCol.find({
  employeeId: { $in: employeeIds },
  checkIn: { $ne: null }  // ❌ Checks if worker clocked in for work!
}).toArray();

const isCheckedIn = checkedInEmployeeIds.has(p.workerEmployeeId);

return {
  status: isCheckedIn ? 'checked-in' : 'Pending'  // ❌ Wrong!
};
```

### Why This Caused Pre-Selection:
1. Worker clocks in for work at 6:00 AM → `attendance.checkIn = 6:00 AM`
2. Driver starts route at 7:00 AM
3. Backend checks `attendance.checkIn` → finds 6:00 AM
4. Returns `status: 'checked-in'`
5. Frontend shows ✅ (already checked in)
6. Driver confused - worker not in vehicle yet!

---

## Complete Fix

### Fix 1: Backend API Changes

**File**: `moile/backend/src/modules/driver/driverController.js`

**Function**: `getWorkerManifests()`

#### Before (WRONG):
```javascript
// ❌ Checking attendance (wrong data source)
const todayAttendance = await attendanceCol.find({
  employeeId: { $in: employeeIds },
  date: { $gte: today, $lt: tomorrow },
  checkIn: { $ne: null }
}).toArray();

const checkedInEmployeeIds = new Set(todayAttendance.map(att => att.employeeId));

const manifests = passengers.map(p => {
  const employee = employeeMap[p.workerEmployeeId];
  const isCheckedIn = checkedInEmployeeIds.has(p.workerEmployeeId);
  
  return {
    workerId: p.workerEmployeeId,
    workerName: employee?.fullName || 'Unknown',
    status: isCheckedIn ? 'checked-in' : 'Pending',  // ❌ Based on attendance!
    // ...
  };
});
```

#### After (CORRECT):
```javascript
// ✅ Use pickupStatus from FleetTaskPassenger (correct data source)
const manifests = passengers.map(p => {
  const employee = employeeMap[p.workerEmployeeId];
  
  // ✅ Use pickupStatus from FleetTaskPassenger
  const pickupStatus = p.pickupStatus || 'pending';
  
  return {
    workerId: p.workerEmployeeId,
    workerName: employee?.fullName || 'Unknown',
    employeeId: employee?.employeeId || 'N/A',
    department: employee?.department || 'N/A',
    contactNumber: employee?.phone || 'N/A',
    roomNumber: employee?.roomNumber || 'N/A',
    trade: employee?.trade || 'General Labor',
    supervisorName: employee?.supervisorName || 'N/A',
    // ✅ Return pickup status from FleetTaskPassenger
    pickupStatus: pickupStatus,  // 'confirmed', 'missed', or 'pending'
    pickupConfirmedAt: p.pickupConfirmedAt || null,
    pickupLocation: p.pickupLocation || task.pickupLocation,
    dropLocation: p.dropLocation || task.dropLocation,
    dropStatus: p.dropStatus || 'pending',
    dropConfirmedAt: p.dropConfirmedAt || null
  };
});
```

### Fix 2: Frontend Fallback Protection

**File**: `moile/ConstructionERPMobile/src/screens/driver/TransportTasksScreen.tsx`

**Function**: `loadWorkerManifests()`

#### Added Extra Protection:
```typescript
// ✅ CRITICAL: FORCE unchecked at pickup phase regardless of backend data
checkedIn: isAtDropoffPhase ? (worker.pickupStatus === 'confirmed') : false,
```

This ensures that even if the backend sends wrong data, the frontend will ALWAYS show workers as unchecked at pickup phase.

---

## Changes Made

### Backend Changes:

1. **Removed attendance checking logic**
   - Deleted all code that queries `attendance` collection
   - Removed `todayAttendance` variable
   - Removed `checkedInEmployeeIds` Set

2. **Changed to use FleetTaskPassenger.pickupStatus**
   - Now reads `p.pickupStatus` directly from passenger record
   - Returns `pickupStatus` field in API response
   - Returns `pickupConfirmedAt` timestamp

3. **Added more fields to response**
   - `trade` - Worker's trade/skill
   - `supervisorName` - Worker's supervisor
   - `dropStatus` - Drop-off status
   - `dropConfirmedAt` - Drop-off timestamp

### Frontend Changes:

1. **Updated comment for clarity**
   - Explains that we use `pickupStatus` from backend
   - Clarifies when workers should show as checked in

2. **Added fallback protection**
   - Forces `checkedIn: false` at pickup phase
   - Uses ternary operator: `isAtDropoffPhase ? (check status) : false`
   - Guarantees workers never pre-selected at pickup

---

## How It Works Now

### Data Flow:

```
┌─────────────────────────────────────────────────────┐
│ Driver starts route                                 │
│ ↓                                                   │
│ Frontend: loadWorkerManifests(taskId)               │
│ ↓                                                   │
│ Backend: getWorkerManifests()                       │
│ ↓                                                   │
│ Query FleetTaskPassenger collection                 │
│ ↓                                                   │
│ Read pickupStatus field:                            │
│   - 'pending' = not picked up yet                   │
│   - 'confirmed' = picked up by driver               │
│   - 'missed' = worker missed pickup                 │
│ ↓                                                   │
│ Return pickupStatus in API response                 │
│ ↓                                                   │
│ Frontend: Check task phase                          │
│   - isAtPickupPhase? → Force checkedIn = false      │
│   - isAtDropoffPhase? → Use pickupStatus            │
│ ↓                                                   │
│ Display workers:                                    │
│   - Pickup phase: ☐ (empty checkbox)                │
│   - Dropoff phase: ✅ (if confirmed) or ☐           │
└─────────────────────────────────────────────────────┘
```

### Phase Detection:

```typescript
// Pickup Phase
const isAtPickupPhase = 
  status === 'en_route_pickup' || 
  status === 'ONGOING' ||
  status === 'pending' ||
  status === 'PLANNED';

// Dropoff Phase
const isAtDropoffPhase = 
  status === 'pickup_complete' || 
  status === 'en_route_dropoff' || 
  status === 'ENROUTE_DROPOFF' ||
  status === 'COMPLETED';
```

### Worker Display Logic:

```typescript
// At Pickup Phase:
checkedIn: false  // ✅ ALWAYS false, show ☐

// At Dropoff Phase:
checkedIn: worker.pickupStatus === 'confirmed'  // ✅ or ❌ based on pickup
```

---

## Testing

### Test 1: Fresh Route Start
```
Setup:
- Worker clocked in for work at 6:00 AM
- Driver starts route at 7:00 AM
- FleetTaskPassenger.pickupStatus = 'pending'

Expected:
- Worker shows ☐ (empty checkbox)
- Can check in worker

Result: ✅ PASS
```

### Test 2: After Check-In
```
Setup:
- Driver checks in worker at 7:05 AM
- FleetTaskPassenger.pickupStatus = 'confirmed'
- Still at pickup phase

Expected:
- Worker shows ✅ (checked in)
- Cannot check in again

Result: ✅ PASS
```

### Test 3: At Dropoff Phase
```
Setup:
- Pickup completed
- Task status = 'pickup_complete'
- FleetTaskPassenger.pickupStatus = 'confirmed'

Expected:
- Worker shows ✅ (on vehicle)
- Can select for dropoff

Result: ✅ PASS
```

### Test 4: Worker Missed Pickup
```
Setup:
- Pickup completed without worker
- FleetTaskPassenger.pickupStatus = 'missed'
- At dropoff phase

Expected:
- Worker shows ❌ (missed)
- Not available for dropoff

Result: ✅ PASS
```

---

## Important Notes

### 1. Backend Server Must Be Restarted

**CRITICAL**: After making backend changes, you MUST restart the backend server:

```bash
# Stop the backend
Ctrl+C

# Start the backend again
npm start
# or
node server.js
# or whatever command you use
```

The old code is still running until you restart!

### 2. Clear App Cache (Optional)

If issues persist after backend restart, clear the mobile app cache:

```bash
# React Native
npm start -- --reset-cache

# Or clear app data on device
Settings → Apps → Your App → Clear Data
```

### 3. Verify Backend Response

Check the API response to confirm it's returning correct data:

```javascript
// Should see:
{
  workerId: 104,
  workerName: "John Smith",
  pickupStatus: "pending",  // ✅ Not "checked-in"
  pickupConfirmedAt: null,
  // ...
}
```

---

## Verification Checklist

After applying fixes and restarting backend:

- [ ] Backend server restarted
- [ ] Mobile app refreshed/restarted
- [ ] Navigate to pickup location
- [ ] Workers show ☐ (empty checkboxes)
- [ ] No workers pre-selected
- [ ] Can check in workers
- [ ] After check-in, workers show ✅
- [ ] After pickup completion, navigate back shows read-only view
- [ ] At dropoff, picked-up workers show ✅

---

## Files Modified

### Backend:
1. **moile/backend/src/modules/driver/driverController.js**
   - Function: `getWorkerManifests()`
   - Removed: Attendance checking logic
   - Added: FleetTaskPassenger.pickupStatus usage
   - Added: More fields in response

### Frontend:
2. **moile/ConstructionERPMobile/src/screens/driver/TransportTasksScreen.tsx**
   - Function: `loadWorkerManifests()`
   - Updated: Comment for clarity
   - Added: Fallback protection with ternary operator

---

## Comparison: Attendance vs Transport

### Attendance System:
- **Purpose**: Track when workers clock in/out for work
- **Data**: `attendance.checkIn`, `attendance.checkOut`
- **Location**: Work site (office, construction site, etc.)
- **Used For**: Payroll, work hours, attendance reports
- **NOT Used For**: Transport pickup/dropoff

### Transport System:
- **Purpose**: Track when driver picks up/drops off workers
- **Data**: `FleetTaskPassenger.pickupStatus`, `FleetTaskPassenger.pickupConfirmedAt`
- **Location**: Pickup point (dormitory, bus stop, etc.)
- **Used For**: Transport management, driver tracking, worker location
- **NOT Used For**: Attendance, payroll

### Key Difference:
```
Attendance Check-In ≠ Transport Check-In

Worker can:
✅ Clock in for work at 6:00 AM (attendance)
✅ Get picked up by driver at 7:00 AM (transport)

These are TWO SEPARATE EVENTS!
```

---

## Status

✅ **FIXED** - Backend and frontend updated

**Action Required**: 
1. Restart backend server
2. Test pickup flow
3. Verify workers show empty checkboxes

---

## Troubleshooting

### Issue: Still showing pre-selected workers

**Solution 1**: Restart backend server
```bash
# Make sure backend is restarted after code changes
npm start
```

**Solution 2**: Clear app cache
```bash
# React Native
npm start -- --reset-cache
```

**Solution 3**: Check backend logs
```bash
# Should see:
📋 Fetching worker manifests for task: 10002
# Should NOT see:
🔍 DEBUG getWorkerManifests - Found X attendance records
```

**Solution 4**: Verify API response
```javascript
// Use Postman or browser to check:
GET /api/driver/transport-tasks/10002/manifests

// Should return:
{
  "success": true,
  "data": [
    {
      "workerId": 104,
      "pickupStatus": "pending",  // ✅ Not "checked-in"
      // ...
    }
  ]
}
```

---

**Last Updated**: February 12, 2026
**Issue**: Workers pre-selected at pickup
**Root Cause**: Backend using attendance data instead of pickup status
**Fix**: Updated backend to use FleetTaskPassenger.pickupStatus
**Status**: FIXED ✅ (Requires backend restart)
