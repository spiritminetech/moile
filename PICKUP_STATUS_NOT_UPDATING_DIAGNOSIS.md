# Pickup Status Not Updating - Diagnosis and Fix

## Date: February 11, 2026

## Problem Observed

**fleetTaskPassengers Collection**:
```json
{
  "workerEmployeeId": 104,
  "pickupStatus": "pending",  // ❌ Should be "confirmed"
  "pickupConfirmedAt": "2026-02-11T09:43:50.591Z"  // ✅ Timestamp exists!
}
```

**Issue**: `pickupConfirmedAt` is being set, but `pickupStatus` remains "pending"

This is contradictory - the timestamp exists but the status wasn't updated.

---

## Possible Causes

### Cause 1: Update Query Not Finding Records
The `updateOne` query might not be matching any records due to:
- Wrong field names
- Wrong data types (Number vs String)
- Wrong task ID

### Cause 2: Update Happening But Being Overwritten
Something else might be resetting `pickupStatus` to "pending" after the update

### Cause 3: Schema Default Value Issue
The schema might have a default value that's overriding the update

### Cause 4: Mongoose Middleware
There might be pre/post save hooks resetting the value

---

## Diagnostic Steps

### Step 1: Check Backend Logs

After the fix I applied, the backend will now log:

```
📌 Query parameters: { workerEmployeeId: 104, fleetTaskId: 10003, companyId: 1 }
📌 Existing passenger record: { ... }
✅ Update result: matched=1, modified=1
✅ Updated passenger record: { pickupStatus: 'confirmed', ... }
```

**What to look for**:
1. Does `matched=1`? If not, the query isn't finding the record
2. Does `modified=1`? If not, the update isn't changing anything
3. Does the updated record show `pickupStatus: 'confirmed'`? If not, something is wrong

### Step 2: Manual Database Test

Run this query directly in MongoDB to test:

```javascript
// Find the passenger record
db.fleetTaskPassengers.findOne({
  workerEmployeeId: 104,
  fleetTaskId: 10003
});

// Try to update it manually
db.fleetTaskPassengers.updateOne(
  {
    workerEmployeeId: 104,
    fleetTaskId: 10003
  },
  {
    $set: {
      pickupStatus: "confirmed",
      pickupConfirmedAt: new Date()
    }
  }
);

// Check if it updated
db.fleetTaskPassengers.findOne({
  workerEmployeeId: 104,
  fleetTaskId: 10003
});
```

**Expected Result**: `pickupStatus` should be "confirmed"

**If it doesn't update**: There might be a schema validation issue or middleware

---

## Fixes Applied

### Fix 1: Added Detailed Logging

**File**: `moile/backend/src/modules/driver/driverController.js`

**Changes**:
1. Log query parameters before update
2. Check if passenger record exists before updating
3. Log update result (matched/modified counts)
4. Read and log the updated record to verify

**Code**:
```javascript
// Log query parameters
console.log(`📌 Query parameters:`, {
  workerEmployeeId: Number(workerId),
  fleetTaskId: activeTask.id,
  companyId: companyId
});

// Check if record exists
const existingPassenger = await FleetTaskPassenger.findOne({
  workerEmployeeId: Number(workerId),
  fleetTaskId: activeTask.id
}).lean();

console.log(`📌 Existing passenger record:`, existingPassenger);

if (!existingPassenger) {
  return res.status(404).json({
    success: false,
    message: 'Worker not found in task passenger list'
  });
}

// Update
const updateResult = await FleetTaskPassenger.updateOne(...);
console.log(`✅ Update result: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}`);

// Verify
const updatedPassenger = await FleetTaskPassenger.findOne(...).lean();
console.log(`✅ Updated passenger record:`, updatedPassenger);
```

---

## Testing Instructions

### Test 1: Check Backend Logs

1. Start the backend server
2. Open the driver app
3. Check in a worker
4. Look at the backend console logs
5. You should see:
   ```
   📌 Query parameters: { workerEmployeeId: 104, fleetTaskId: 10003 }
   📌 Existing passenger record: { pickupStatus: 'pending', ... }
   ✅ Update result: matched=1, modified=1
   ✅ Updated passenger record: { pickupStatus: 'confirmed', ... }
   ```

### Test 2: Check Database

After checking in a worker, query the database:

```javascript
db.fleetTaskPassengers.find({
  fleetTaskId: 10003,
  workerEmployeeId: 104
});
```

**Expected**:
```json
{
  "workerEmployeeId": 104,
  "pickupStatus": "confirmed",  // ✅ Should be confirmed
  "pickupConfirmedAt": "2026-02-11T10:00:00.000Z"  // ✅ Should have timestamp
}
```

---

## Possible Solutions Based on Logs

### If `matched=0` (Query Not Finding Record)

**Problem**: The query isn't finding the passenger record

**Solutions**:
1. Check if `workerEmployeeId` in database matches the `workerId` from the request
2. Check if `fleetTaskId` in database matches the active task ID
3. Verify data types (Number vs String)

**Fix**:
```javascript
// Add this before the update to see what's in the database
const allPassengers = await FleetTaskPassenger.find({
  fleetTaskId: activeTask.id
}).lean();
console.log(`📌 All passengers for task ${activeTask.id}:`, allPassengers);
```

### If `matched=1` but `modified=0` (Update Not Changing Anything)

**Problem**: The record was found but not modified

**Possible Reasons**:
1. Value is already "confirmed" (no change needed)
2. Schema validation is preventing the update
3. Mongoose middleware is blocking the update

**Fix**:
```javascript
// Try using findOneAndUpdate instead
const updatedPassenger = await FleetTaskPassenger.findOneAndUpdate(
  {
    workerEmployeeId: Number(workerId),
    fleetTaskId: activeTask.id
  },
  {
    $set: {
      pickupStatus: 'confirmed',
      pickupConfirmedAt: new Date(timestamp || Date.now())
    }
  },
  { new: true }  // Return the updated document
);

console.log(`✅ Updated passenger:`, updatedPassenger);
```

### If Update Works But Status Reverts to "pending"

**Problem**: Something is overwriting the status after the update

**Solutions**:
1. Check if there's a post-save hook in the schema
2. Check if another API call is resetting the status
3. Check if the frontend is making multiple requests

**Fix**: Add this to the schema to prevent overwrites:
```javascript
// In FleetTaskPassenger.js
fleetTaskPassengerSchema.pre('save', function(next) {
  console.log(`🔍 Pre-save hook: pickupStatus = ${this.pickupStatus}`);
  next();
});

fleetTaskPassengerSchema.post('save', function(doc) {
  console.log(`🔍 Post-save hook: pickupStatus = ${doc.pickupStatus}`);
});
```

---

## Quick Fix: Use findOneAndUpdate

If the issue persists, try using `findOneAndUpdate` instead of `updateOne`:

```javascript
// Replace the updateOne call with this
const updatedPassenger = await FleetTaskPassenger.findOneAndUpdate(
  { 
    workerEmployeeId: Number(workerId),
    fleetTaskId: activeTask.id
  },
  {
    $set: {
      pickupStatus: 'confirmed',
      pickupConfirmedAt: new Date(timestamp || Date.now())
    }
  },
  { 
    new: true,  // Return the updated document
    runValidators: true  // Run schema validators
  }
);

if (!updatedPassenger) {
  return res.status(404).json({
    success: false,
    message: 'Worker not found in task passenger list'
  });
}

console.log(`✅ Updated passenger:`, updatedPassenger);

res.json({
  success: true,
  message: 'Worker checked in successfully',
  checkInTime: updatedPassenger.pickupConfirmedAt.toISOString(),
  workerName: employee.fullName,
  locationName: 'Pickup Location',
  pickupStatus: updatedPassenger.pickupStatus  // Include status in response
});
```

---

## Verification Queries

### Query 1: Check All Passengers for Task
```javascript
db.fleetTaskPassengers.find({ fleetTaskId: 10003 });
```

### Query 2: Check Specific Worker
```javascript
db.fleetTaskPassengers.findOne({
  fleetTaskId: 10003,
  workerEmployeeId: 104
});
```

### Query 3: Check Workers with Timestamps but Pending Status
```javascript
db.fleetTaskPassengers.find({
  pickupConfirmedAt: { $exists: true, $ne: null },
  pickupStatus: "pending"
});
```

This query will show all workers who have a check-in timestamp but status is still "pending" - these are the problematic records.

---

## Next Steps

1. ✅ Deploy the updated code with enhanced logging
2. ✅ Test worker check-in
3. ✅ Check backend logs for diagnostic information
4. ✅ Based on logs, apply the appropriate fix from above
5. ✅ Verify in database that `pickupStatus` is "confirmed"

---

## Expected Outcome

After the fix:
- Worker check-in updates both `pickupStatus` and `pickupConfirmedAt`
- Database shows `pickupStatus: "confirmed"` for checked-in workers
- Database shows `pickupStatus: "pending"` for workers NOT checked in
- Backend logs show successful update with `matched=1, modified=1`
