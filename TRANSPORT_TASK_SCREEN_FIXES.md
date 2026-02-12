# Transport Task Screen - Issues and Fixes

## Date: February 11, 2026

## Issues Identified

### Issue 1: Navigate Button Redirects to Navigation Tab ✅ WORKING
**Status**: This is working correctly
- When clicking "Navigate" button in Tasks tab, it correctly redirects to Navigation tab
- Code: `handleTaskSelection()` sets `activeView='navigation'`

### Issue 2: Select Button in Pickup Location Redirects to Workers Tab BUT No Checkbox Selection
**Status**: ❌ BROKEN - Workers tab shows checked-in workers but no way to check them in

**Problem**:
- When clicking "Select" button on a pickup location in Navigation tab, it redirects to Workers tab
- Workers tab shows the WorkerCheckInForm component
- WorkerCheckInForm DOES have checkbox functionality, but it's not visible because:
  1. Workers are already showing as "checked in" even though pickup hasn't started
  2. The checkbox is only shown for workers who are NOT checked in
  3. Once a worker is checked in, the checkbox disappears

**Root Cause**:
```typescript
// In TransportTasksScreen.tsx - loadWorkerManifests()
const workers = response.data.map((worker: any) => ({
  workerId: worker.workerId,
  name: worker.workerName,
  phone: worker.contactNumber || '',
  checkedIn: worker.status === 'checked-in',  // ❌ PROBLEM: Shows as checked-in from backend
  checkInTime: worker.status === 'checked-in' ? new Date().toISOString() : undefined,
}));
```

The backend is returning workers with status 'checked-in' even before the driver starts the pickup process.

### Issue 3: Workers Show as Checked In When Pickup Just Started
**Status**: ❌ BROKEN - Data inconsistency

**Problem**:
- Workers are showing as "checked in" even when the task status is still "pending" or "en_route_pickup"
- This happens because the backend `fleetTaskPassengers` collection has `pickupStatus: 'confirmed'` for workers who haven't actually been picked up yet

**Expected Behavior**:
- Workers should show `pickupStatus: 'pending'` until the driver actually checks them in at the pickup location
- Only after driver clicks "Check In" button should the status change to 'confirmed'

### Issue 4: Complete Pickup Button Only Shows in Navigation Screen
**Status**: ⚠️ PARTIALLY CORRECT - But confusing UX

**Problem**:
- The "Complete Pickup" button is NOT visible in the Navigation screen
- It's only available in the Workers tab (WorkerCheckInForm component)
- This is confusing because:
  1. Driver selects location in Navigation tab
  2. Gets redirected to Workers tab
  3. Must check in workers in Workers tab
  4. Complete pickup button is at the bottom of Workers tab (not visible in Navigation tab)

**Current Flow**:
```
Tasks Tab → Click "Navigate" → Navigation Tab → Click "Select" on location → Workers Tab → Check in workers → Complete Pickup
```

**Issue**: Driver cannot see "Complete Pickup" button in Navigation tab, only in Workers tab

### Issue 5: No Checkbox Selection in Workers Tab
**Status**: ❌ BROKEN - Checkbox exists but not visible

**Problem**:
- WorkerCheckInForm DOES have checkbox functionality (see line 147-151)
- But checkboxes are only shown for workers who are NOT checked in
- Since workers are already showing as checked in (Issue 3), no checkboxes are visible

**Code**:
```typescript
// WorkerCheckInForm.tsx - Line 147
<TouchableOpacity
  style={styles.workerInfo}
  onPress={() => !worker.checkedIn && toggleWorkerSelection(worker.workerId)}
  disabled={worker.checkedIn}  // ❌ Disabled if already checked in
>
```

---

## Solutions

### Solution 1: Fix Worker Status Initialization
**File**: `moile/ConstructionERPMobile/src/screens/driver/TransportTasksScreen.tsx`

**Change**: Update `loadWorkerManifests()` to NOT mark workers as checked in by default

```typescript
// BEFORE (Line 130-137)
const workers = response.data.map((worker: any) => ({
  workerId: worker.workerId,
  name: worker.workerName,
  phone: worker.contactNumber || '',
  checkedIn: worker.status === 'checked-in',  // ❌ WRONG
  checkInTime: worker.status === 'checked-in' ? new Date().toISOString() : undefined,
}));

// AFTER (FIXED)
const workers = response.data.map((worker: any) => ({
  workerId: worker.workerId,
  name: worker.workerName,
  phone: worker.contactNumber || '',
  // ✅ Only mark as checked in if pickupStatus is 'confirmed' AND task is in pickup phase
  checkedIn: worker.pickupStatus === 'confirmed' && 
             (prevTask.status === 'pickup_complete' || prevTask.status === 'en_route_dropoff' || prevTask.status === 'completed'),
  checkInTime: worker.pickupConfirmedAt || undefined,
  trade: worker.trade || 'General Labor',
  supervisorName: worker.supervisorName || 'N/A',
}));
```

### Solution 2: Add Complete Pickup Button to Navigation Screen
**File**: `moile/ConstructionERPMobile/src/components/driver/RouteNavigationComponent.tsx`

**Change**: Add "Complete Pickup" button for each pickup location in Navigation tab

```typescript
// Add after "Select" button in locationActions (Line 200)
<View style={styles.locationActions}>
  <ConstructionButton
    title="🧭 Navigate"
    onPress={() => openExternalNavigation({...})}
    variant="primary"
    size="small"
    style={styles.actionButton}
  />
  <ConstructionButton
    title={selectedLocation === location.locationId ? "✅ Selected" : "📍 Select"}
    onPress={() => handleNavigationStart(location.locationId)}
    variant={selectedLocation === location.locationId ? "success" : "outline"}
    size="small"
    style={styles.actionButton}
  />
  
  {/* ✅ NEW: Add Complete Pickup button */}
  {selectedLocation === location.locationId && onCompletePickup && (
    <ConstructionButton
      title="✅ Complete Pickup"
      onPress={() => onCompletePickup(location.locationId)}
      variant="success"
      size="small"
      style={styles.actionButton}
    />
  )}
</View>
```

### Solution 3: Fix Backend Worker Status Query
**File**: `moile/backend/src/modules/driver/driverController.js`

**Change**: Update `getWorkerManifests()` to return correct pickup status

```javascript
// In getWorkerManifests() endpoint
export const getWorkerManifests = async (req, res) => {
  try {
    const { taskId } = req.params;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId: driverId,
      companyId: companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    // Get all passengers for this task
    const passengers = await FleetTaskPassenger.find({
      fleetTaskId: Number(taskId),
      companyId: companyId
    }).lean();

    // Get employee details
    const employeeIds = passengers.map(p => p.workerEmployeeId);
    const employees = await Employee.find({
      id: { $in: employeeIds },
      companyId: companyId
    }).lean();

    // Map passengers to worker manifest format
    const workerManifests = passengers.map(passenger => {
      const employee = employees.find(e => e.id === passenger.workerEmployeeId);
      
      return {
        workerId: passenger.workerEmployeeId,
        workerName: employee?.fullName || 'Unknown Worker',
        contactNumber: employee?.phone || '',
        trade: employee?.specializations?.[0] || 'General Labor',
        supervisorName: 'N/A', // TODO: Get from employee supervisor relationship
        // ✅ FIX: Return actual pickup status from database
        pickupStatus: passenger.pickupStatus || 'pending',
        pickupConfirmedAt: passenger.pickupConfirmedAt,
        dropStatus: passenger.dropStatus || 'pending',
        dropConfirmedAt: passenger.dropConfirmedAt,
        notes: passenger.notes || ''
      };
    });

    res.json({
      success: true,
      data: workerManifests,
      message: 'Worker manifests retrieved successfully'
    });

  } catch (err) {
    console.error("❌ Error getting worker manifests:", err);
    res.status(500).json({
      success: false,
      message: "Server error while getting worker manifests",
      error: err.message
    });
  }
};
```

### Solution 4: Enhance WorkerCheckInForm to Show Checkboxes Always
**File**: `moile/ConstructionERPMobile/src/components/driver/WorkerCheckInForm.tsx`

**Change**: Show checkboxes for all workers, not just unchecked ones

```typescript
// BEFORE (Line 147-151)
<TouchableOpacity
  style={styles.workerInfo}
  onPress={() => !worker.checkedIn && toggleWorkerSelection(worker.workerId)}
  disabled={worker.checkedIn}  // ❌ Disabled if checked in
>

// AFTER (FIXED)
<TouchableOpacity
  style={styles.workerInfo}
  onPress={() => toggleWorkerSelection(worker.workerId)}
  disabled={false}  // ✅ Always enabled
>
  <View style={styles.workerDetails}>
    {/* ✅ Show checkbox for all workers */}
    <Text style={styles.workerName}>
      {worker.checkedIn ? '✅' : selectedWorkers.has(worker.workerId) ? '☑️' : '☐'} {worker.name}
    </Text>
    {/* ... rest of worker details ... */}
  </View>
</TouchableOpacity>
```

### Solution 5: Add Visual Indicator for Pickup Phase
**File**: `moile/ConstructionERPMobile/src/components/driver/RouteNavigationComponent.tsx`

**Change**: Add visual indicator showing which pickup locations are completed

```typescript
// Add completion badge to location card
<ConstructionCard
  key={location.locationId}
  variant={
    location.actualPickupTime ? 'success' :  // ✅ Completed
    selectedLocation === location.locationId ? 'primary' :  // Selected
    'outlined'  // Not started
  }
  style={styles.locationCard}
>
  {/* Add completion badge */}
  {location.actualPickupTime && (
    <View style={styles.completedBadgeSmall}>
      <Text style={styles.completedBadgeText}>✅ Completed</Text>
    </View>
  )}
  
  {/* ... rest of location card ... */}
</ConstructionCard>
```

---

## Implementation Priority

1. **HIGH PRIORITY**: Fix Solution 1 (Worker Status Initialization) - This fixes the root cause
2. **HIGH PRIORITY**: Fix Solution 3 (Backend Worker Status Query) - Ensures correct data from backend
3. **MEDIUM PRIORITY**: Fix Solution 2 (Complete Pickup Button in Navigation) - Improves UX
4. **MEDIUM PRIORITY**: Fix Solution 4 (Show Checkboxes Always) - Better visibility
5. **LOW PRIORITY**: Fix Solution 5 (Visual Indicators) - Nice to have

---

## Testing Checklist

After implementing fixes, test the following flow:

1. ✅ Open Transport Tasks screen
2. ✅ Click "Navigate" button in Tasks tab → Should redirect to Navigation tab
3. ✅ Click "Select" button on a pickup location → Should redirect to Workers tab
4. ✅ Verify workers show as "NOT checked in" (☐ checkbox visible)
5. ✅ Select multiple workers using checkboxes
6. ✅ Click "Check In" button for individual worker
7. ✅ Verify worker status changes to "✅ Checked In"
8. ✅ Click "Complete Pickup" button (should be visible in Workers tab)
9. ✅ Verify pickup completion confirmation
10. ✅ Return to Navigation tab and verify location shows as completed
11. ✅ Verify "Complete Pickup" button is also visible in Navigation tab (after Solution 2)

---

## Summary

The main issues are:
1. Workers are incorrectly showing as "checked in" before pickup starts
2. Checkboxes are hidden because workers appear already checked in
3. Complete Pickup button is only in Workers tab, not Navigation tab
4. Backend is returning incorrect worker status

The fixes ensure:
1. Workers start with "pending" status
2. Checkboxes are always visible for selection
3. Complete Pickup button is available in both Navigation and Workers tabs
4. Backend returns correct pickup status based on actual check-in events
