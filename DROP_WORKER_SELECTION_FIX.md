# Drop Worker Selection Fix

## Problem
Currently, the driver app has worker checkbox selection at PICKUP locations, but NOT at DROP locations.

When completing drop-off, the app sends `workerCount` with ALL picked-up workers, even if the driver only wants to drop some of them.

## Current Flow

### Pickup (✅ Works Correctly)
1. Driver arrives at pickup location
2. Driver sees list of workers with CHECKBOXES
3. Driver selects workers (e.g., 3 workers)
4. App calls `checkInWorker` for each selected worker
5. Workers get `pickupStatus: "confirmed"`
6. Driver clicks "Complete Pickup"

### Drop (❌ Missing Feature)
1. Driver arrives at drop location  
2. Driver clicks "Select" button
3. **NO CHECKBOXES SHOWN** - just shows worker count
4. Driver clicks "Complete Drop"
5. App sends `workerCount` with ALL picked-up workers
6. Backend updates ALL workers to `dropStatus: "confirmed"`

## Required Fix

### Frontend Changes (Mobile App)

**File**: `moile/ConstructionERPMobile/src/screens/driver/TransportTasksScreen.tsx`

**Line 479-481**: Currently counts ALL checked-in workers
```typescript
const totalWorkers = selectedTask.pickupLocations.reduce(
  (sum, loc) => sum + (loc.workerManifest?.filter(w => w.checkedIn).length || 0),
  0
);
```

**Needs to be changed to**:
1. Show worker selection UI at drop location (similar to pickup)
2. Track which workers are selected for drop
3. Call `checkOutWorker` for each selected worker
4. Send `workerIds` array in the drop-off request

### Backend Changes (Already Implemented ✅)

**File**: `moile/backend/src/modules/driver/driverController.js`

The backend now supports:
```javascript
{
  workerCount: 2,
  workerIds: [104, 107]  // Specific workers to drop
}
```

## Implementation Steps

### Step 1: Add Drop Worker Selection State
```typescript
const [selectedDropWorkers, setSelectedDropWorkers] = useState<number[]>([]);
```

### Step 2: Create Drop Worker Selection UI
Similar to pickup, show checkboxes for workers at drop location:
```typescript
// When at drop location (locationId === -1)
// Show list of picked-up workers with checkboxes
// Allow driver to select which workers to drop
```

### Step 3: Update handleCompleteDropoff
```typescript
const handleCompleteDropoff = useCallback(async (locationId: number) => {
  // Get selected workers for drop
  const selectedWorkers = selectedDropWorkers;
  
  // Call checkOutWorker for each selected worker
  for (const workerId of selectedWorkers) {
    await driverApiService.checkOutWorker(locationId, workerId, location);
  }
  
  // Then complete drop-off
  const response = await driverApiService.confirmDropoffComplete(
    selectedTask.taskId,
    location,
    selectedWorkers.length,  // Only selected workers
    `Dropoff completed with ${selectedWorkers.length} workers`
  );
}, [selectedDropWorkers, ...]);
```

### Step 4: Alternative Approach (Simpler)
Send `workerIds` in the drop-off request:
```typescript
const response = await driverApiService.confirmDropoffComplete(
  selectedTask.taskId,
  location,
  selectedWorkers.length,
  `Dropoff completed`,
  selectedWorkers  // Add workerIds parameter
);
```

Then update the API service to include `workerIds` in the request body.

## Testing Scenario

**Test Case**: Pick 3, Drop 2
1. Driver picks up workers 104, 107, 2 at pickup location
2. All 3 get `pickupStatus: "confirmed"`
3. Driver arrives at drop location
4. Driver selects ONLY workers 104 and 107 (checkboxes)
5. Driver clicks "Complete Drop"
6. Backend receives `workerIds: [104, 107]`
7. Only workers 104 and 107 get `dropStatus: "confirmed"`
8. Worker 2 remains `dropStatus: "pending"` ✅

## Priority
**HIGH** - This is a critical feature for accurate worker tracking and compliance.
