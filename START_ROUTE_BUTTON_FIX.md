# Start Route Button - Issue Analysis and Fix

## Problem Statement

The "Start Route" button in the Driver Dashboard allows the trip to progress through all status transitions (PLANNED → ONGOING → PICKUP_COMPLETE → EN_ROUTE_DROPOFF → COMPLETED) without requiring workers to be selected or checked in first.

When clicking the button 4 times, the trip shows as "COMPLETED" even though no workers were selected or checked in.

---

## Root Cause Analysis

### Current Flow (INCORRECT):
1. Click "Start Route" → Status: PLANNED → ONGOING ✅
2. Click "Start Route" again → Status: ONGOING → PICKUP_COMPLETE ❌ (Should require worker check-ins)
3. Click "Start Route" again → Status: PICKUP_COMPLETE → EN_ROUTE_DROPOFF ❌
4. Click "Start Route" again → Status: EN_ROUTE_DROPOFF → COMPLETED ❌

### Issues Found:

1. **`updateTaskStatus()` function** (Line 2191 in driverController.js)
   - Only validates status transitions for "Start Route" (PLANNED → ONGOING)
   - Does NOT validate other transitions
   - Allows any valid status transition without checking prerequisites

2. **`confirmPickup()` function** (Line 747 in driverController.js)
   - Does NOT validate that workers have been checked in
   - Automatically determines status based on passenger pickup status
   - If no passengers are marked, it still allows status change

3. **Missing Validation**:
   - No check for "at least one worker must be checked in" before pickup completion
   - No check for "all workers must be checked in" before pickup completion
   - No validation that pickup is complete before allowing dropoff

---

## Required Fix

### Fix 1: Prevent Multiple "Start Route" Clicks

**File**: `moile/backend/src/modules/driver/driverController.js`
**Function**: `updateTaskStatus()`
**Location**: Line 2191

The "Start Route" button should ONLY handle the PLANNED → ONGOING transition. It should NOT allow any other status changes.

```javascript
export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, location, notes } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`🔄 Updating task status: ${taskId} from mobile app: ${status}`);

    // Map frontend status to backend status
    const statusMap = {
      'pending': 'PLANNED',
      'en_route_pickup': 'ONGOING',
      'pickup_complete': 'PICKUP_COMPLETE',
      'en_route_dropoff': 'EN_ROUTE_DROPOFF',
      'completed': 'COMPLETED',
      'cancelled': 'CANCELLED'
    };

    const backendStatus = statusMap[status] || status;
    console.log(`📊 Status mapping: ${status} → ${backendStatus}`);

    // ✅ FIX 1: ONLY allow "Start Route" action (PLANNED → ONGOING)
    // All other status changes must go through their specific endpoints
    if (backendStatus !== 'ONGOING' && backendStatus !== 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'This endpoint only handles route start. Use the appropriate endpoint for other actions.',
        error: 'INVALID_ENDPOINT_FOR_STATUS',
        requestedStatus: backendStatus,
        hint: {
          'PICKUP_COMPLETE': 'Use POST /transport-tasks/:taskId/pickup-complete',
          'EN_ROUTE_DROPOFF': 'Automatically set after pickup complete',
          'COMPLETED': 'Use POST /transport-tasks/:taskId/dropoff-complete'
        }
      });
    }

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to this driver'
      });
    }

    // ✅ FIX 2: Validate task is in PLANNED status before allowing route start
    if (backendStatus === 'ONGOING') {
      if (task.status !== 'PLANNED') {
        return res.status(400).json({
          success: false,
          message: `Cannot start route. Task is currently in ${task.status} status.`,
          error: 'INVALID_STATUS_TRANSITION',
          currentStatus: task.status,
          requiredStatus: 'PLANNED',
          taskId: task.id,
          hint: task.status === 'ONGOING' ? 'Route already started. Proceed to check in workers.' : 
                task.status === 'PICKUP_COMPLETE' ? 'Pickup already complete. Proceed to dropoff.' :
                task.status === 'COMPLETED' ? 'Trip already completed.' : 
                'Invalid status for route start.'
        });
      }

      // ✅ FIX 3: Validate driver has clocked in today before starting route
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const attendance = await Attendance.findOne({
        employeeId: driverId,
        date: { $gte: today, $lte: endOfDay },
        checkIn: { $ne: null },
        pendingCheckout: true
      });

      if (!attendance) {
        return res.status(403).json({
          success: false,
          message: 'Route start denied: You must clock in before starting a route',
          error: 'ATTENDANCE_REQUIRED',
          details: {
            message: 'Please clock in first before starting your route. Go to Attendance screen to clock in.'
          }
        });
      }

      console.log(`✅ Driver attendance verified: Clocked in at ${attendance.checkIn}`);

      // ✅ FIX 4: Validate driver is at approved location before starting route
      if (location && isValidCoordinates(location.latitude, location.longitude)) {
        const approvedLocations = await ApprovedLocation.find({
          companyId,
          active: true,
          allowedForRouteStart: true
        }).lean();

        if (approvedLocations.length > 0) {
          let isAtApprovedLocation = false;
          let nearestLocation = null;
          let nearestDistance = Infinity;

          for (const approvedLoc of approvedLocations) {
            const validation = validateGeofence(location, {
              center: approvedLoc.center,
              radius: approvedLoc.radius,
              strictMode: true,
              allowedVariance: 50
            });

            if (validation.distance < nearestDistance) {
              nearestDistance = validation.distance;
              nearestLocation = approvedLoc.name;
            }

            if (validation.isValid) {
              isAtApprovedLocation = true;
              console.log(`✅ Route start approved from location: ${approvedLoc.name} (${validation.distance}m away)`);
              break;
            }
          }

          if (!isAtApprovedLocation) {
            return res.status(403).json({
              success: false,
              message: `Route start denied: You must be at an approved location to start the route`,
              error: 'ROUTE_START_LOCATION_NOT_APPROVED',
              details: {
                nearestLocation,
                distance: Math.round(nearestDistance),
                message: `You are ${Math.round(nearestDistance)}m from ${nearestLocation}. Please move closer to start the route.`
              }
            });
          }
        }
      }

      // Set actualStartTime when starting route
      task.actualStartTime = new Date();
      task.status = 'ONGOING';
      
      if (location) {
        task.currentLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp || new Date()
        };
      }
      
      await task.save();

      return res.status(200).json({
        success: true,
        message: 'Route started successfully',
        data: {
          taskId: task.id,
          status: task.status,
          actualStartTime: task.actualStartTime,
          updatedAt: task.updatedAt
        }
      });
    }

    // Handle CANCELLED status
    if (backendStatus === 'CANCELLED') {
      task.status = 'CANCELLED';
      task.updatedAt = new Date();
      await task.save();

      return res.status(200).json({
        success: true,
        message: 'Task cancelled successfully',
        data: {
          taskId: task.id,
          status: task.status,
          updatedAt: task.updatedAt
        }
      });
    }

  } catch (err) {
    console.error("❌ Update task status error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during task status update.",
      error: err.message,
    });
  }
};
```

---

### Fix 2: Validate Worker Check-ins Before Pickup Completion

**File**: `moile/backend/src/modules/driver/driverController.js`
**Function**: `confirmPickup()`
**Location**: Line 747

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

    // ✅ FIX 1: Validate task is in ONGOING status
    if (task.status !== 'ONGOING') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete pickup. Task is currently in ${task.status} status.`,
        error: 'INVALID_STATUS_FOR_PICKUP',
        currentStatus: task.status,
        requiredStatus: 'ONGOING',
        hint: task.status === 'PLANNED' ? 'Please start the route first.' :
              task.status === 'PICKUP_COMPLETE' ? 'Pickup already completed.' :
              task.status === 'COMPLETED' ? 'Trip already completed.' :
              'Invalid status for pickup completion.'
      });
    }

    // ✅ FIX 2: Get all passengers and validate at least one is checked in
    const allPassengers = await FleetTaskPassenger.find({ 
      fleetTaskId: Number(taskId) 
    }).lean();

    if (allPassengers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No workers assigned to this task.",
        error: 'NO_WORKERS_ASSIGNED'
      });
    }

    const checkedInPassengers = allPassengers.filter(p => 
      p.pickupStatus === 'confirmed'
    );

    // ✅ FIX 3: Require at least one worker to be checked in
    if (checkedInPassengers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot complete pickup: No workers have been checked in yet.",
        error: 'NO_WORKERS_CHECKED_IN',
        details: {
          totalWorkers: allPassengers.length,
          checkedInWorkers: 0,
          message: 'Please check in at least one worker before completing pickup.'
        }
      });
    }

    // ✅ FIX 4: Warn if not all workers are checked in
    if (checkedInPassengers.length < allPassengers.length) {
      console.log(`⚠️ Warning: Only ${checkedInPassengers.length} of ${allPassengers.length} workers checked in`);
      // Allow completion but log warning
    }

    // Handle new format (locationId + workerCount) from transport tasks screen
    if (locationId !== undefined && workerCount !== undefined) {
      console.log(`📌 Using new format: locationId=${locationId}, workerCount=${workerCount}`);
      console.log(`📌 Completing pickup with ${workerCount} workers at location ${locationId}`);
      
      // Validate workerCount matches checked-in count
      if (workerCount !== checkedInPassengers.length) {
        console.log(`⚠️ Warning: Reported workerCount (${workerCount}) doesn't match checked-in count (${checkedInPassengers.length})`);
      }
    } 
    // Handle old format (confirmed/missed arrays)
    else {
      console.log(`📌 Using old format: confirmed=${confirmed.length}, missed=${missed.length}`);
      
      if (confirmed.length > 0) {
        await FleetTaskPassenger.updateMany(
          { 
            fleetTaskId: Number(taskId), 
            id: { $in: confirmed.map(id => Number(id)) } 
          },
          {
            $set: {
              pickupStatus: "confirmed",
              pickupConfirmedAt: new Date(),
            },
          }
        );
      }

      if (missed.length > 0) {
        await FleetTaskPassenger.updateMany(
          { 
            fleetTaskId: Number(taskId), 
            id: { $in: missed.map(id => Number(id)) } 
          },
          {
            $set: {
              pickupStatus: "missed",
              pickupConfirmedAt: new Date(),
            },
          }
        );
      }
    }

    const currentTime = new Date();
    
    // Determine the new status - always set to PICKUP_COMPLETE
    // (EN_ROUTE_DROPOFF is set automatically when driver starts driving)
    const newStatus = 'PICKUP_COMPLETE';
    
    await FleetTask.updateOne(
      { id: Number(taskId) },
      {
        $set: {
          status: newStatus,
          actualStartTime: task.actualStartTime || currentTime,
          updatedAt: currentTime
        }
      }
    );

    const [updatedTask, updatedPassengers, project, vehicle] = await Promise.all([
      FleetTask.findOne({ id: Number(taskId) }).lean(),
      FleetTaskPassenger.find({ fleetTaskId: Number(taskId) }).lean(),
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
        name: p.name,
        pickupPoint: p.pickupPoint,
        pickupStatus: p.pickupStatus || 'pending',
        dropStatus: p.dropStatus || 'pending'
      })),
      summary: {
        totalWorkers: allPassengers.length,
        checkedInWorkers: checkedInPassengers.length,
        missedWorkers: allPassengers.length - checkedInPassengers.length
      }
    };

    console.log(`✅ Pickup confirmed for task ${taskId}`);
    console.log(`✅ Task status updated to: ${updatedTask.status}`);
    console.log(`✅ Workers checked in: ${checkedInPassengers.length}/${allPassengers.length}`);
    
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

### Fix 3: Validate Pickup Complete Before Dropoff

**File**: `moile/backend/src/modules/driver/driverController.js`
**Function**: `confirmDrop()`

Add validation at the beginning of the function:

```javascript
export const confirmDrop = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { confirmed = [], missed = [], workerCount } = req.body;
    
    let workerIds = req.body.workerIds;
    if (typeof workerIds === 'string') {
      try {
        workerIds = JSON.parse(workerIds);
      } catch (e) {
        console.log('⚠️ Failed to parse workerIds:', e);
        workerIds = undefined;
      }
    }
    
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Confirm drop for task: ${taskId}, driver: ${driverId}`);
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

    // ✅ FIX 1: Validate task is in correct status for dropoff
    const validDropoffStatuses = ['PICKUP_COMPLETE', 'EN_ROUTE_DROPOFF'];
    if (!validDropoffStatuses.includes(task.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot complete dropoff. Task is currently in ${task.status} status.`,
        error: 'INVALID_STATUS_FOR_DROPOFF',
        currentStatus: task.status,
        requiredStatus: validDropoffStatuses,
        hint: task.status === 'PLANNED' ? 'Please start the route first.' :
              task.status === 'ONGOING' ? 'Please complete pickup first.' :
              task.status === 'COMPLETED' ? 'Trip already completed.' :
              'Invalid status for dropoff completion.'
      });
    }

    // ✅ FIX 2: Validate at least one worker was picked up
    const allPassengers = await FleetTaskPassenger.find({ 
      fleetTaskId: Number(taskId)
    }).lean();
    
    const pickedUpPassengers = allPassengers.filter(p => p.pickupStatus === "confirmed");
    
    if (pickedUpPassengers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot complete dropoff: No workers were picked up.",
        error: 'NO_WORKERS_PICKED_UP',
        details: {
          totalWorkers: allPassengers.length,
          pickedUpWorkers: 0,
          message: 'You must pick up at least one worker before completing dropoff.'
        }
      });
    }

    // Continue with rest of confirmDrop logic...
    // (existing code continues here)
```

---

## Summary of Changes

### 1. `updateTaskStatus()` - Line 2191
- ✅ Only allows PLANNED → ONGOING transition (Start Route)
- ✅ Rejects all other status changes with helpful error messages
- ✅ Directs users to correct endpoints for other actions

### 2. `confirmPickup()` - Line 747
- ✅ Validates task is in ONGOING status
- ✅ Requires at least one worker to be checked in
- ✅ Returns error if no workers checked in
- ✅ Warns if not all workers checked in (but allows completion)

### 3. `confirmDrop()` - Location TBD
- ✅ Validates task is in PICKUP_COMPLETE or EN_ROUTE_DROPOFF status
- ✅ Requires at least one worker to have been picked up
- ✅ Returns error if no workers were picked up

---

## Correct Flow After Fix

1. **Start Route** (PLANNED → ONGOING)
   - Validates: Driver clocked in, at approved location, task in PLANNED status
   - Action: Changes status to ONGOING, records start time

2. **View Workers** 
   - Shows list of assigned workers

3. **Check In Workers** (one by one)
   - Updates individual worker pickupStatus to 'confirmed'

4. **Complete Pickup** (ONGOING → PICKUP_COMPLETE)
   - Validates: At least one worker checked in
   - Action: Changes status to PICKUP_COMPLETE

5. **Drive to Site**
   - Status remains PICKUP_COMPLETE or changes to EN_ROUTE_DROPOFF

6. **Complete Dropoff** (PICKUP_COMPLETE/EN_ROUTE_DROPOFF → COMPLETED)
   - Validates: At least one worker was picked up
   - Action: Changes status to COMPLETED, records end time

---

## Testing Checklist

- [ ] Click "Start Route" without clocking in → Should show error
- [ ] Click "Start Route" when not at depot → Should show error
- [ ] Click "Start Route" when already ONGOING → Should show error
- [ ] Click "Start Route" multiple times → Should only work once
- [ ] Try "Complete Pickup" without checking in workers → Should show error
- [ ] Try "Complete Pickup" with at least 1 worker checked in → Should work
- [ ] Try "Complete Dropoff" without completing pickup → Should show error
- [ ] Try "Complete Dropoff" without picking up workers → Should show error
- [ ] Complete full flow correctly → Should work end-to-end

---

## Implementation Priority

1. **HIGH**: Fix `updateTaskStatus()` to only handle Start Route
2. **HIGH**: Fix `confirmPickup()` to require worker check-ins
3. **MEDIUM**: Fix `confirmDrop()` to validate pickup completion
4. **LOW**: Add UI warnings when not all workers checked in
