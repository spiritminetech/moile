# Drop Status Update Fix

## Date: February 11, 2026

## Problem

After completing drop-off, the `dropStatus` in `fleetTaskPassengers` collection was still showing "pending" instead of "confirmed".

---

## Root Causes

### Issue 1: confirmDrop Updates ALL Passengers
The `confirmDrop` endpoint was updating ALL passengers' `dropStatus` to "confirmed", including workers who were never picked up.

**Wrong Behavior**:
```javascript
// Updates ALL passengers, even those not picked up
await FleetTaskPassenger.updateMany(
  { fleetTaskId: Number(taskId) },  // ❌ Updates everyone
  { $set: { dropStatus: "confirmed" } }
);
```

### Issue 2: checkOutWorker Uses Wrong Field Names
The `checkOutWorker` endpoint was using incorrect field names:
- Used `employeeId` instead of `workerEmployeeId`
- Used `status` instead of `dropStatus`

**Wrong Code**:
```javascript
await FleetTaskPassenger.updateOne(
  { employeeId: Number(workerId) },  // ❌ Wrong field name
  { $set: { status: 'checked-out' } }  // ❌ Wrong field name
);
```

---

## Solutions Applied

### Fix 1: confirmDrop - Only Update Picked-Up Workers

**File**: `moile/backend/src/modules/driver/driverController.js`

**Change**: Only update workers who were actually picked up (`pickupStatus: "confirmed"`)

**BEFORE**:
```javascript
// ❌ Updates ALL passengers
const allPassengers = await FleetTaskPassenger.find({ 
  fleetTaskId: Number(taskId)
}).lean();

await FleetTaskPassenger.updateMany(
  { fleetTaskId: Number(taskId) },
  { $set: { dropStatus: "confirmed", dropConfirmedAt: new Date() } }
);
```

**AFTER**:
```javascript
// ✅ Only updates workers who were picked up
const pickedUpPassengers = await FleetTaskPassenger.find({ 
  fleetTaskId: Number(taskId),
  pickupStatus: "confirmed"  // ✅ Only picked-up workers
}).lean();

await FleetTaskPassenger.updateMany(
  { 
    fleetTaskId: Number(taskId),
    pickupStatus: "confirmed"  // ✅ Only picked-up workers
  },
  { $set: { dropStatus: "confirmed", dropConfirmedAt: new Date() } }
);
```

**Result**: Only workers who were picked up get marked as dropped off

---

### Fix 2: checkOutWorker - Use Correct Field Names

**File**: `moile/backend/src/modules/driver/driverController.js`

**Change**: Use correct schema field names

**BEFORE**:
```javascript
await FleetTaskPassenger.updateOne(
  { employeeId: Number(workerId) },  // ❌ Wrong field
  {
    $set: {
      status: 'checked-out',  // ❌ Wrong field
      checkOutTime: new Date(),
      checkOutLocation: { ... }
    }
  }
);
```

**AFTER**:
```javascript
// Find active task first
const activeTask = await FleetTask.findOne({
  driverId,
  companyId,
  status: { $in: ['PICKUP_COMPLETE', 'ENROUTE_DROPOFF', 'COMPLETED'] }
}).sort({ id: -1 });

// Update with correct field names
const updateResult = await FleetTaskPassenger.updateOne(
  { 
    workerEmployeeId: Number(workerId),  // ✅ Correct field
    fleetTaskId: activeTask.id
  },
  {
    $set: {
      dropStatus: 'confirmed',  // ✅ Correct field
      dropConfirmedAt: new Date()
    }
  }
);
```

**Result**: Individual worker check-out now works correctly

---

## Expected Behavior After Fix

### Scenario: 3 Workers, 2 Picked Up, 1 Absent

**After Pickup**:
```json
// Worker 104 - Picked up
{
  "workerEmployeeId": 104,
  "pickupStatus": "confirmed",
  "dropStatus": "pending",
  "pickupConfirmedAt": "2026-02-11T10:02:29.713Z"
}

// Worker 107 - Picked up
{
  "workerEmployeeId": 107,
  "pickupStatus": "confirmed",
  "dropStatus": "pending",
  "pickupConfirmedAt": "2026-02-11T10:02:35.259Z"
}

// Worker 2 - Absent (not picked up)
{
  "workerEmployeeId": 2,
  "pickupStatus": "pending",  // ✅ Still pending
  "dropStatus": "pending",
  "pickupConfirmedAt": null
}
```

**After Drop-off (Complete Drop)**:
```json
// Worker 104 - Dropped off
{
  "workerEmployeeId": 104,
  "pickupStatus": "confirmed",
  "dropStatus": "confirmed",  // ✅ Updated
  "pickupConfirmedAt": "2026-02-11T10:02:29.713Z",
  "dropConfirmedAt": "2026-02-11T10:30:00.000Z"  // ✅ New timestamp
}

// Worker 107 - Dropped off
{
  "workerEmployeeId": 107,
  "pickupStatus": "confirmed",
  "dropStatus": "confirmed",  // ✅ Updated
  "pickupConfirmedAt": "2026-02-11T10:02:35.259Z",
  "dropConfirmedAt": "2026-02-11T10:30:00.000Z"  // ✅ New timestamp
}

// Worker 2 - Was never picked up
{
  "workerEmployeeId": 2,
  "pickupStatus": "pending",  // ✅ Still pending
  "dropStatus": "pending",    // ✅ Still pending (correct!)
  "pickupConfirmedAt": null,
  "dropConfirmedAt": null
}
```

---

## Complete Worker Lifecycle

### Phase 1: Before Pickup
```
pickupStatus: "pending"
dropStatus: "pending"
```

### Phase 2: Worker Checked In at Pickup
```
pickupStatus: "confirmed"  ← Updated by checkInWorker
dropStatus: "pending"
```

### Phase 3: Worker Dropped Off
```
pickupStatus: "confirmed"
dropStatus: "confirmed"  ← Updated by confirmDrop or checkOutWorker
```

### Phase 4: Worker Was Absent (Never Picked Up)
```
pickupStatus: "pending"  ← Never updated
dropStatus: "pending"    ← Never updated
```

---

## Testing Checklist

### Test 1: Complete Drop-off (All Workers)
1. ✅ Pick up 2 workers (Worker 104, Worker 107)
2. ✅ Leave 1 worker absent (Worker 2)
3. ✅ Complete drop-off
4. ✅ Check database:
   - Worker 104: `dropStatus: "confirmed"` ✅
   - Worker 107: `dropStatus: "confirmed"` ✅
   - Worker 2: `dropStatus: "pending"` ✅ (correct, was never picked up)

### Test 2: Individual Worker Check-out
1. ✅ Pick up workers
2. ✅ At drop-off, check out Worker 104 individually
3. ✅ Check database:
   - Worker 104: `dropStatus: "confirmed"` ✅
   - Worker 107: `dropStatus: "pending"` ✅ (not checked out yet)

### Test 3: Verify Task Status
1. ✅ Complete drop-off
2. ✅ Check `fleetTasks` collection:
   - `status: "COMPLETED"` ✅
   - `actualEndTime` has timestamp ✅

---

## Database Queries for Verification

### Query 1: Check Drop Status for Task
```javascript
db.fleetTaskPassengers.find({ 
  fleetTaskId: 10003 
});
```

**Expected Result**:
- Picked-up workers: `dropStatus: "confirmed"`
- Absent workers: `dropStatus: "pending"`

### Query 2: Check Workers Picked Up But Not Dropped Off
```javascript
db.fleetTaskPassengers.find({
  pickupStatus: "confirmed",
  dropStatus: "pending"
});
```

This shows workers who are on the vehicle but haven't been dropped off yet.

### Query 3: Check Workers Never Picked Up
```javascript
db.fleetTaskPassengers.find({
  pickupStatus: "pending",
  dropStatus: "pending"
});
```

This shows workers who were absent/no-show.

---

## Summary

### What Was Fixed:

1. ✅ `confirmDrop` now only updates workers who were picked up
2. ✅ `checkOutWorker` now uses correct field names (`workerEmployeeId`, `dropStatus`)
3. ✅ Workers who were never picked up stay with `dropStatus: "pending"`
4. ✅ Accurate tracking of who was dropped off vs who was never on the vehicle

### Key Points:

- Only workers with `pickupStatus: "confirmed"` get `dropStatus: "confirmed"`
- Workers who were absent (never picked up) stay with both statuses as "pending"
- Accurate audit trail of pickup and drop-off events
- Individual worker check-out now works correctly

---

## Deployment

1. ✅ Restart backend server to apply changes
2. ✅ Test complete drop-off flow
3. ✅ Verify database shows correct drop status
4. ✅ Verify only picked-up workers are marked as dropped off

The system now correctly tracks the complete worker journey from pickup to drop-off!
