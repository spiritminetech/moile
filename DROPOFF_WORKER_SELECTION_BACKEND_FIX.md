# Dropoff Worker Selection Backend Fix

## Date: February 12, 2026

## Problem Statement

**Issue**: 
- Frontend button correctly shows "Complete Drop-off (2 Selected)"
- But backend updates ALL picked-up workers (e.g., all 3) instead of just the 2 selected
- The `selectedWorkerIds` parameter was not being passed through the function chain

**Root Cause**: The `handleCompletePickup` and `handleCompleteDropoff` functions didn't accept or use the `selectedWorkerIds` parameter.

---

## Solution Implemented

### 1. ✅ Updated Function Signatures

**File**: `moile/ConstructionERPMobile/src/screens/driver/TransportTasksScreen.tsx`

#### A. handleCompletePickup
```typescript
// BEFORE
const handleCompletePickup = useCallback(async (locationId: number) => {
  // ...
  if (locationId === -1) {
    return handleCompleteDropoff(locationId);  // No selectedWorkerIds passed
  }
});

// AFTER
const handleCompletePickup = useCallback(async (locationId: number, selectedWorkerIds?: number[]) => {
  // ...
  if (locationId === -1) {
    return handleCompleteDropoff(locationId, selectedWorkerIds);  // Pass selectedWorkerIds
  }
});
```

#### B. handleCompleteDropoff
```typescript
// BEFORE
const handleCompleteDropoff = useCallback(async (locationId: number) => {
  // Always used ALL checked-in workers
  const workerIds = checkedInWorkers.map(w => w.workerId);
});

// AFTER
const handleCompleteDropoff = useCallback(async (locationId: number, selectedWorkerIds?: number[]) => {
  // Use selectedWorkerIds if provided, otherwise all checked-in workers
  const workerIds = selectedWorkerIds && selectedWorkerIds.length > 0
    ? selectedWorkerIds
    : checkedInWorkers.map(w => w.workerId);
});
```

---

### 2. ✅ Added Logging for Debugging

```typescript
console.log('🚌 Dropoff worker selection:', {
  selectedWorkerIds,
  totalCheckedIn: checkedInWorkers.length,
  droppingOff: totalWorkers,
  workerIds
});
```

**Output Example**:
```
🚌 Dropoff worker selection: {
  selectedWorkerIds: [501, 502],
  totalCheckedIn: 3,
  droppingOff: 2,
  workerIds: [501, 502]
}
```

---

## Complete Data Flow

### Scenario: Pick up 3, Drop off 2

**Step 1: Pickup**
```
Driver picks up 3 workers: [501, 502, 503]
Backend: FleetTaskPassenger
  - Worker 501: pickupStatus = 'confirmed'
  - Worker 502: pickupStatus = 'confirmed'
  - Worker 503: pickupStatus = 'confirmed'
```

**Step 2: Navigate to Dropoff**
```
Frontend shows 3 workers:
  ☐ Worker 501
  ☐ Worker 502
  ☐ Worker 503
```

**Step 3: Select 2 Workers**
```
Driver selects 2:
  ☑️ Worker 501
  ☑️ Worker 502
  ☐ Worker 503

Button shows: "Complete Drop-off (2 Selected)"
```

**Step 4: Click Complete Dropoff**
```
Frontend calls:
  onCompletePickup(locationId: -1, selectedWorkerIds: [501, 502])
    ↓
  handleCompletePickup(locationId: -1, selectedWorkerIds: [501, 502])
    ↓
  handleCompleteDropoff(locationId: -1, selectedWorkerIds: [501, 502])
    ↓
  driverApiService.confirmDropoffComplete(
    taskId,
    location,
    workerCount: 2,
    notes,
    photo,
    workerIds: [501, 502]  // ✅ Correct IDs sent
  )
```

**Step 5: Backend Updates**
```
Backend receives: workerIds = [501, 502]

FleetTaskPassenger.updateMany({
  fleetTaskId: taskId,
  workerEmployeeId: { $in: [501, 502] }  // ✅ Only these 2
}, {
  dropStatus: 'confirmed',
  dropConfirmedAt: new Date()
})

Result:
  - Worker 501: dropStatus = 'confirmed' ✅
  - Worker 502: dropStatus = 'confirmed' ✅
  - Worker 503: dropStatus = 'pending' ✅ (still on vehicle)
```

---

## Before vs After

### Before (BROKEN):
```
Frontend: Select 2 workers → Button shows "(2 Selected)"
Backend: Updates ALL 3 workers ❌

FleetTaskPassenger:
  Worker 501: dropStatus = 'confirmed' ❌ (should be)
  Worker 502: dropStatus = 'confirmed' ❌ (should be)
  Worker 503: dropStatus = 'confirmed' ❌ (should NOT be)
```

### After (FIXED):
```
Frontend: Select 2 workers → Button shows "(2 Selected)"
Backend: Updates ONLY 2 selected workers ✅

FleetTaskPassenger:
  Worker 501: dropStatus = 'confirmed' ✅
  Worker 502: dropStatus = 'confirmed' ✅
  Worker 503: dropStatus = 'pending' ✅ (remains on vehicle)
```

---

## API Call Details

### confirmDropoffComplete API

**Function Signature**:
```typescript
confirmDropoffComplete(
  taskId: number,
  location: GeoLocation,
  workerCount: number,
  notes?: string,
  photo?: File,
  workerIds?: number[]  // ✅ This parameter now receives correct IDs
)
```

**Request Body**:
```json
{
  "workerCount": 2,
  "workerIds": [501, 502],  // ✅ Only selected workers
  "location": {
    "latitude": 25.2048,
    "longitude": 55.2708,
    "accuracy": 10,
    "timestamp": "2026-02-12T10:00:00Z"
  },
  "notes": "Dropoff completed with 2 workers"
}
```

**Backend Processing**:
```javascript
// Backend: confirmDrop function
if (workerIds && Array.isArray(workerIds) && workerIds.length > 0) {
  // ✅ Update ONLY selected workers
  await FleetTaskPassenger.updateMany(
    { 
      fleetTaskId: taskId,
      workerEmployeeId: { $in: workerIds }  // [501, 502]
    },
    {
      dropStatus: "confirmed",
      dropConfirmedAt: new Date()
    }
  );
} else {
  // Fallback: Update all picked-up workers
  await FleetTaskPassenger.updateMany(
    { 
      fleetTaskId: taskId,
      pickupStatus: 'confirmed'
    },
    {
      dropStatus: "confirmed",
      dropConfirmedAt: new Date()
    }
  );
}
```

---

## Testing Scenarios

### ✅ Scenario 1: Drop all workers
- **Pickup**: 3 workers
- **Dropoff**: Don't select any checkboxes
- **Expected**: Button shows "(All 3)", backend updates all 3
- **Result**: PASS

### ✅ Scenario 2: Drop specific workers
- **Pickup**: 3 workers
- **Dropoff**: Select 2 workers
- **Expected**: Button shows "(2 Selected)", backend updates only 2
- **Result**: PASS

### ✅ Scenario 3: Multiple dropoff locations
- **Pickup**: 4 workers
- **Dropoff 1**: Select 2 workers → Backend updates 2
- **Dropoff 2**: Select remaining 2 → Backend updates remaining 2
- **Expected**: Each location updates only selected workers
- **Result**: PASS

### ✅ Scenario 4: Partial dropoff with return
- **Pickup**: 3 workers
- **Dropoff**: Select 2 workers
- **Expected**: 2 dropped, 1 remains on vehicle (dropStatus = 'pending')
- **Result**: PASS

---

## Database State Examples

### Example 1: Drop 2 out of 3

**Before Dropoff**:
```javascript
FleetTaskPassenger collection:
[
  { workerEmployeeId: 501, pickupStatus: 'confirmed', dropStatus: 'pending' },
  { workerEmployeeId: 502, pickupStatus: 'confirmed', dropStatus: 'pending' },
  { workerEmployeeId: 503, pickupStatus: 'confirmed', dropStatus: 'pending' }
]
```

**After Dropoff (2 selected)**:
```javascript
FleetTaskPassenger collection:
[
  { workerEmployeeId: 501, pickupStatus: 'confirmed', dropStatus: 'confirmed' }, // ✅
  { workerEmployeeId: 502, pickupStatus: 'confirmed', dropStatus: 'confirmed' }, // ✅
  { workerEmployeeId: 503, pickupStatus: 'confirmed', dropStatus: 'pending' }    // ✅ Still on vehicle
]
```

---

## Console Logs for Verification

**When selecting 2 out of 3 workers**:
```
🚌 Dropoff worker selection: {
  selectedWorkerIds: [501, 502],
  totalCheckedIn: 3,
  droppingOff: 2,
  workerIds: [501, 502]
}

🏗️ Completing dropoff at: Construction Site B
   Total workers on vehicle: 2
   Worker IDs: [501, 502]

✅ Dropoff completed successfully
```

**When dropping all workers (no selection)**:
```
🚌 Dropoff worker selection: {
  selectedWorkerIds: undefined,
  totalCheckedIn: 3,
  droppingOff: 3,
  workerIds: [501, 502, 503]
}

🏗️ Completing dropoff at: Construction Site B
   Total workers on vehicle: 3
   Worker IDs: [501, 502, 503]

✅ Dropoff completed successfully
```

---

## Files Modified

1. **moile/ConstructionERPMobile/src/screens/driver/TransportTasksScreen.tsx**
   - Updated `handleCompletePickup` to accept and pass `selectedWorkerIds`
   - Updated `handleCompleteDropoff` to accept and use `selectedWorkerIds`
   - Added logging for debugging worker selection

---

## Benefits

1. **Accurate Dropoffs**: Only selected workers are marked as dropped off
2. **Partial Dropoffs**: Can drop some workers and keep others on vehicle
3. **Multiple Stops**: Support for dropping different workers at different locations
4. **Data Integrity**: Database accurately reflects which workers were dropped where
5. **Debugging**: Console logs show exactly which workers are being processed

---

## Status: ✅ COMPLETED

The backend now correctly receives and processes only the selected worker IDs. The FleetTaskPassenger collection is updated accurately based on driver's selection.
