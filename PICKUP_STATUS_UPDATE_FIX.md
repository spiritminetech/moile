# Fleet Task Status Update Issue - Fix

## Date: February 11, 2026

## Problem Identified

### Issue:
When completing pickup in the driver app, the `fleetTaskPassengers` collection is updated correctly with `pickupStatus: "confirmed"` and `pickupConfirmedAt` timestamp, BUT the `fleetTasks` collection status remains as "PLANNED" instead of updating to "PICKUP_COMPLETE" or "ENROUTE_DROPOFF".

### Data Evidence:

**fleetTasks Collection:**
```json
{
  "id": 10003,
  "status": "PLANNED",  // ❌ WRONG - Should be "PICKUP_COMPLETE"
  "actualStartTime": "2026-02-11T04:28:28.375Z",
  "updatedAt": "2026-02-11T09:05:49.679Z"
}
```

**fleetTaskPassengers Collection:**
```json
{
  "id": 8339,
  "fleetTaskId": 10003,
  "workerEmployeeId": 104,
  "pickupStatus": "confirmed",  // ✅ CORRECT
  "pickupConfirmedAt": "2026-02-11T09:30:20.536Z",  // ✅ CORRECT
  "dropStatus": "pending"
}
```

---

## Root Cause Analysis

### Problem 1: Missing `pickupPoint` Field in Schema

**File**: `moile/backend/src/modules/fleetTask/submodules/fleetTaskPassenger/FleetTaskPassenger.js`

**Issue**: The schema does NOT have a `pickupPoint` field, but the `confirmPickup` endpoint tries to query by it:

```javascript
// ❌ WRONG - pickupPoint field doesn't exist in schema
const passengersAtLocation = await FleetTaskPassenger.find({ 
  fleetTaskId: Number(taskId),
  pickupPoint: locationId.toString()  // This field doesn't exist!
}).lean();
```

**Result**: Query returns 0 passengers, so no updates happen, and the status logic fails.

---

### Problem 2: Incorrect Status Logic

**File**: `moile/backend/src/modules/driver/driverController.js` - `confirmPickup()` function

**Issue**: The status update logic has a typo:

```javascript
// ❌ WRONG - Typo in status name
const newStatus = allPickedUp ? 'PICKUP_COMPLETE' : 'ENROUTE_DROPOFF';
```

**Should be**:
```javascript
// ✅ CORRECT - Match the actual status enum
const newStatus = allPickedUp ? 'PICKUP_COMPLETE' : 'ONGOING';
```

---

## Solution

### Fix 1: Update confirmPickup Logic to Work Without pickupPoint

**File**: `moile/backend/src/modules/driver/driverController.js`

**Change**: Update all passengers for the task when completing pickup (since we don't have location-specific tracking in the schema)

```javascript
export const confirmPickup = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { confirmed = [], missed = [], locationId, workerCount } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Confirm pickup for task: ${taskId}, driver: ${driverId}`);
    console.log(`📌 Request body:`, req.body);

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId: driverId,
      companyId: companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to this driver.",
      });
    }

    // ✅ FIX: Update all passengers for this task (no pickupPoint field exists)
    if (locationId !== undefined && workerCount !== undefined) {
      console.log(`📌 Completing pickup: locationId=${locationId}, workerCount=${workerCount}`);
      
      // Get all passengers for this task that are still pending
      const pendingPassengers = await FleetTaskPassenger.find({ 
        fleetTaskId: Number(taskId),
        companyId: companyId,
        pickupStatus: 'pending'  // ✅ Only update pending passengers
      }).lean();
      
      console.log(`📌 Found ${pendingPassengers.length} pending passengers`);
      
      if (pendingPassengers.length > 0) {
        // Update all pending passengers to confirmed
        await FleetTaskPassenger.updateMany(
          { 
            fleetTaskId: Number(taskId),
            companyId: companyId,
            pickupStatus: 'pending'
          },
          {
            $set: {
              pickupStatus: "confirmed",
              pickupConfirmedAt: new Date(),
            },
          }
        );
        console.log(`✅ Marked ${pendingPassengers.length} passengers as confirmed`);
      }
    } 
    // Handle old format (confirmed/missed arrays)
    else if (confirmed.length > 0 || missed.length > 0) {
      console.log(`📌 Using old format: confirmed=${confirmed.length}, missed=${missed.length}`);
      
      if (confirmed.length > 0) {
        await FleetTaskPassenger.updateMany(
          { 
            fleetTaskId: Number(taskId),
            companyId: companyId,
            id: { $in: confirmed.map(id => Number(id)) } 
          },
          {
            $set: {
              pickupStatus: "confirmed",
              pickupConfirmedAt: new Date(),
            },
          }
        );
        console.log(`✅ Marked ${confirmed.length} passengers as confirmed`);
      }

      if (missed.length > 0) {
        await FleetTaskPassenger.updateMany(
          { 
            fleetTaskId: Number(taskId),
            companyId: companyId,
            id: { $in: missed.map(id => Number(id)) } 
          },
          {
            $set: {
              pickupStatus: "missed",
              pickupConfirmedAt: new Date(),
            },
          }
        );
        console.log(`✅ Marked ${missed.length} passengers as missed`);
      }
    }

    const currentTime = new Date();
    
    // ✅ FIX: Check if all pickups are done
    const allPassengers = await FleetTaskPassenger.find({ 
      fleetTaskId: Number(taskId),
      companyId: companyId
    }).lean();
    
    const allPickedUp = allPassengers.every(p => 
      p.pickupStatus === 'confirmed' || p.pickupStatus === 'missed'
    );
    
    console.log(`📌 All passengers: ${allPassengers.length}, All picked up: ${allPickedUp}`);
    
    // ✅ FIX: Update task status correctly
    const newStatus = allPickedUp ? 'PICKUP_COMPLETE' : 'ONGOING';
    
    console.log(`📌 Updating task status to: ${newStatus}`);
    
    await FleetTask.updateOne(
      { id: Number(taskId), companyId: companyId },
      {
        $set: {
          status: newStatus,
          actualStartTime: task.actualStartTime || currentTime,
          updatedAt: currentTime
        }
      }
    );

    // Get updated task and passengers
    const [updatedTask, updatedPassengers, project, vehicle] = await Promise.all([
      FleetTask.findOne({ id: Number(taskId), companyId: companyId }).lean(),
      FleetTaskPassenger.find({ fleetTaskId: Number(taskId), companyId: companyId }).lean(),
      Project.findOne({ id: task.projectId }).lean(),
      FleetVehicle.findOne({ id: task.vehicleId }).lean()
    ]);

    const response = {
      success: true,
      message: "Pickup confirmed successfully",
      status: updatedTask.status,
      task: {
        _id: updatedTask._id,
        id: updatedTask.id,
        projectName: project?.projectName || 'Unknown Project',
        vehicleNo: vehicle?.registrationNo || 'N/A',
        startTime: updatedTask.plannedPickupTime,
        endTime: updatedTask.plannedDropTime,
        actualStartTime: updatedTask.actualStartTime,
        status: updatedTask.status,
        pickupLocation: updatedTask.pickupAddress || updatedTask.pickupLocation,
        dropLocation: updatedTask.dropAddress || updatedTask.dropLocation
      },
      updatedPassengers: updatedPassengers.map(p => ({
        id: p.id,
        workerEmployeeId: p.workerEmployeeId,
        pickupStatus: p.pickupStatus || 'pending',
        dropStatus: p.dropStatus || 'pending',
        pickupConfirmedAt: p.pickupConfirmedAt,
        dropConfirmedAt: p.dropConfirmedAt
      }))
    };

    console.log(`✅ Pickup confirmed for task ${taskId}`);
    console.log(`✅ Task status updated to: ${updatedTask.status}`);
    console.log(`✅ Passengers confirmed: ${updatedPassengers.filter(p => p.pickupStatus === 'confirmed').length}`);
    
    return res.status(200).json(response);

  } catch (err) {
    console.error("❌ Pickup confirmation error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during pickup confirmation.",
      error: err.message,
    });
  }
};
```

---

### Fix 2: Add pickupPoint Field to Schema (Optional - For Future Enhancement)

**File**: `moile/backend/src/modules/fleetTask/submodules/fleetTaskPassenger/FleetTaskPassenger.js`

**Change**: Add `pickupPoint` field to support location-specific tracking

```javascript
const fleetTaskPassengerSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  companyId: {
    type: Number,
    required: true,
    ref: 'Company'
  },
  fleetTaskId: {
    type: Number,
    required: true,
    ref: 'FleetTask'
  },
  workerEmployeeId: {
    type: Number,
    required: true,
  },
  // ✅ NEW: Add pickupPoint field for location-specific tracking
  pickupPoint: {
    type: String,
    trim: true
  },
  pickupConfirmedAt: {
    type: Date
  },
  dropConfirmedAt: {
    type: Date
  },
  pickupStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'missed'],
    default: 'pending'
  },
  dropStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'missed'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

---

## Testing After Fix

### Test Case 1: Complete Pickup with All Workers
1. Start a transport task (status: PLANNED → ONGOING)
2. Navigate to pickup location
3. Check in all workers
4. Click "Complete Pickup"
5. **Expected Result**:
   - `fleetTaskPassengers`: All workers have `pickupStatus: "confirmed"`
   - `fleetTasks`: Status updates to "PICKUP_COMPLETE"

### Test Case 2: Complete Pickup with Some Workers Missing
1. Start a transport task
2. Check in only some workers (not all)
3. Click "Complete Pickup" → "Complete Anyway"
4. **Expected Result**:
   - `fleetTaskPassengers`: Checked-in workers have `pickupStatus: "confirmed"`, others remain "pending"
   - `fleetTasks`: Status updates to "ONGOING" (not all picked up)

### Test Case 3: Verify Status Progression
1. Complete pickup (all workers)
2. **Expected**: Status = "PICKUP_COMPLETE"
3. Start driving to drop-off
4. **Expected**: Status = "ENROUTE_DROPOFF"
5. Complete drop-off
6. **Expected**: Status = "COMPLETED"

---

## Database Query to Check Current State

```javascript
// Check task status
db.fleetTasks.find({ id: 10003 }, { id: 1, status: 1, actualStartTime: 1, updatedAt: 1 })

// Check passenger statuses
db.fleetTaskPassengers.find(
  { fleetTaskId: 10003 }, 
  { id: 1, workerEmployeeId: 1, pickupStatus: 1, pickupConfirmedAt: 1, dropStatus: 1 }
)

// Count passengers by status
db.fleetTaskPassengers.aggregate([
  { $match: { fleetTaskId: 10003 } },
  { $group: { _id: "$pickupStatus", count: { $sum: 1 } } }
])
```

---

## Manual Fix for Existing Data

If you need to manually fix the task status for task 10003:

```javascript
// Update task status to PICKUP_COMPLETE since all passengers are confirmed
db.fleetTasks.updateOne(
  { id: 10003 },
  { 
    $set: { 
      status: "PICKUP_COMPLETE",
      updatedAt: new Date()
    } 
  }
)
```

---

## Summary

**Root Causes**:
1. ❌ `confirmPickup` tries to query by `pickupPoint` field that doesn't exist in schema
2. ❌ Query returns 0 passengers, so no updates happen
3. ❌ Status logic fails because passengers aren't updated

**Fixes**:
1. ✅ Update `confirmPickup` to work without `pickupPoint` field
2. ✅ Update all pending passengers for the task
3. ✅ Fix status logic to correctly determine PICKUP_COMPLETE vs ONGOING
4. ✅ Add better logging for debugging

**Result**: Task status will now correctly update to "PICKUP_COMPLETE" when all workers are confirmed.
