# Worker Selection Data Flow - Complete Pickup Process

## Date: February 11, 2026

---

## Question: Where is Worker Selection Data Stored?

### Answer: Worker selection is stored in the `fleetTaskPassengers` collection

---

## Data Flow for Worker Selection and Check-In

### Step 1: Worker Selection (Checkbox)
**Location**: Workers Tab in TransportTasksScreen

**Frontend State**:
```typescript
// WorkerCheckInForm.tsx - Line 45
const [selectedWorkers, setSelectedWorkers] = useState<Set<number>>(new Set());
```

**What Happens**:
- Driver clicks checkbox next to worker name
- Worker ID is added to `selectedWorkers` Set (local state only)
- This is TEMPORARY selection, NOT saved to database yet
- Used for bulk check-in functionality

**Storage**: 
- ❌ NOT stored in database at this point
- ✅ Only stored in React component state (memory)

---

### Step 2: Worker Check-In (Confirm Selection)
**Location**: Workers Tab - Click "Check In" button

**API Endpoint**: `POST /driver/transport-tasks/locations/:locationId/checkin`

**Request Body**:
```json
{
  "workerId": 123,
  "latitude": 1.234567,
  "longitude": 103.123456,
  "accuracy": 10,
  "timestamp": "2026-02-11T10:30:00.000Z",
  "notes": "Optional remarks"
}
```

**Backend Processing** (driverController.js - checkInWorker):
```javascript
// Update FleetTaskPassenger record
await FleetTaskPassenger.updateOne(
  { 
    workerEmployeeId: Number(workerId),
    fleetTaskId: activeTask.id
  },
  {
    $set: {
      pickupStatus: 'confirmed',  // ✅ STORED HERE
      pickupConfirmedAt: new Date(timestamp)
    }
  }
);
```

**Database Collection**: `fleetTaskPassengers`

**Fields Updated**:
- `pickupStatus`: Changes from 'pending' → 'confirmed'
- `pickupConfirmedAt`: Timestamp of check-in

**Storage**: 
- ✅ Permanently stored in MongoDB `fleetTaskPassengers` collection
- ✅ Persists across app restarts
- ✅ Synced with backend

---

### Step 3: Complete Pickup (Finalize Location)
**Location**: Workers Tab - Click "Complete Pickup" button

**API Endpoint**: `POST /driver/transport-tasks/:taskId/pickup-complete`

**Request Body**:
```json
{
  "locationId": 100,
  "workerCount": 15,
  "latitude": 1.234567,
  "longitude": 103.123456,
  "accuracy": 10,
  "timestamp": "2026-02-11T10:45:00.000Z",
  "notes": "Pickup completed with 15 workers"
}
```

**Backend Processing** (driverController.js - confirmPickup):
```javascript
// Mark all passengers at location as confirmed
await FleetTaskPassenger.updateMany(
  { 
    fleetTaskId: Number(taskId),
    pickupPoint: locationId.toString()
  },
  {
    $set: {
      pickupStatus: "confirmed",
      pickupConfirmedAt: new Date()
    }
  }
);

// Update task status
await FleetTask.updateOne(
  { id: Number(taskId) },
  {
    $set: {
      status: 'PICKUP_COMPLETE',  // ✅ STORED HERE
      actualStartTime: currentTime
    }
  }
);
```

**Database Collections Updated**:
1. `fleetTaskPassengers` - All workers at location marked as confirmed
2. `fleetTasks` - Task status updated to 'PICKUP_COMPLETE'

**Storage**: 
- ✅ Task status stored in `fleetTasks` collection
- ✅ Worker pickup status stored in `fleetTaskPassengers` collection

---

## Complete Data Storage Summary

### Collection 1: `fleetTaskPassengers`
**Purpose**: Track individual worker pickup/dropoff status

**Key Fields**:
```javascript
{
  id: Number,                    // Unique passenger record ID
  companyId: Number,             // Company reference
  fleetTaskId: Number,           // Transport task reference
  workerEmployeeId: Number,      // Worker reference
  pickupStatus: String,          // 'pending' | 'confirmed' | 'missed'
  pickupConfirmedAt: Date,       // When worker was checked in
  dropStatus: String,            // 'pending' | 'confirmed' | 'missed'
  dropConfirmedAt: Date,         // When worker was dropped off
  notes: String                  // Optional remarks
}
```

**When Updated**:
- Worker check-in: `pickupStatus` → 'confirmed', `pickupConfirmedAt` → timestamp
- Worker marked absent: `pickupStatus` → 'missed'
- Complete pickup: All workers at location → `pickupStatus` → 'confirmed'

---

### Collection 2: `fleetTasks`
**Purpose**: Track overall transport task status

**Key Fields**:
```javascript
{
  id: Number,                    // Task ID
  companyId: Number,             // Company reference
  driverId: Number,              // Driver assigned
  vehicleId: Number,             // Vehicle assigned
  projectId: Number,             // Project/site reference
  status: String,                // Task status (see below)
  expectedPassengers: Number,    // Total workers expected
  plannedPickupTime: Date,       // Scheduled pickup time
  plannedDropTime: Date,         // Scheduled drop time
  actualStartTime: Date,         // When pickup actually started
  actualEndTime: Date,           // When dropoff completed
  pickupLocation: String,        // Pickup location name
  dropLocation: String           // Dropoff location name
}
```

**Status Values**:
- `PLANNED` - Task created, not started
- `ONGOING` - Driver started trip
- `PICKUP_COMPLETE` - All pickups completed ✅ THIS IS KEY
- `ENROUTE_DROPOFF` - En route to dropoff site
- `COMPLETED` - Task fully completed

**When Updated**:
- Complete pickup: `status` → 'PICKUP_COMPLETE', `actualStartTime` → timestamp

---

## UI Flow and Button Visibility

### Current Implementation (BEFORE FIX):

#### Navigation Tab:
- ✅ Shows pickup locations
- ✅ Shows "Navigate" button (GPS)
- ✅ Shows "Select" button (go to Workers tab)
- ❌ Shows "Complete Pickup" button (WRONG - should not be here)
- ✅ Shows status update buttons

#### Workers Tab:
- ✅ Shows worker list with checkboxes
- ✅ Shows "Check In" button for each worker
- ✅ Shows "Complete Pickup" button (CORRECT)

---

## Required Fix: Remove "Complete Pickup" from Navigation Tab

### Reason:
1. **Navigation Tab** = Route planning and status updates ONLY
2. **Workers Tab** = Worker selection and pickup completion
3. Driver must SELECT workers before completing pickup
4. "Complete Pickup" should only appear AFTER worker selection

### Logic:
```
Navigation Tab:
- Purpose: Show route, locations, navigation
- Actions: Navigate (GPS), Select location, Update status
- NO worker selection
- NO "Complete Pickup" button

Workers Tab:
- Purpose: Select and check in workers
- Actions: Select workers (checkbox), Check in, Complete pickup
- Shows "Complete Pickup" button ONLY when:
  ✅ At least one worker is checked in
  ✅ Driver is ready to finalize pickup
```

---

## Status Flow

### Task Status Progression:
```
PLANNED 
  ↓ (Driver clicks "Start Trip")
ONGOING 
  ↓ (Driver arrives at pickup location)
EN_ROUTE_PICKUP
  ↓ (Driver selects location, checks in workers)
PICKUP_COMPLETE  ← "Complete Pickup" button triggers this
  ↓ (Driver starts driving to dropoff)
ENROUTE_DROPOFF
  ↓ (Driver completes dropoff)
COMPLETED
```

### Where Status Updates Happen:

**Navigation Tab**:
- PLANNED → ONGOING (Start Trip button)
- ONGOING → EN_ROUTE_PICKUP (Arrived at Pickup button)
- PICKUP_COMPLETE → ENROUTE_DROPOFF (En Route to Dropoff button)
- ENROUTE_DROPOFF → COMPLETED (Arrived at Dropoff button)

**Workers Tab**:
- EN_ROUTE_PICKUP → PICKUP_COMPLETE (Complete Pickup button) ← ONLY HERE

---

## Summary

### Worker Selection Storage:
1. **Checkbox selection** (temporary): React component state
2. **Worker check-in** (permanent): `fleetTaskPassengers.pickupStatus = 'confirmed'`
3. **Pickup completion** (permanent): `fleetTasks.status = 'PICKUP_COMPLETE'`

### Button Placement:
- **Navigation Tab**: Route planning, GPS navigation, status updates
- **Workers Tab**: Worker selection, check-in, Complete Pickup button

### Key Collections:
- `fleetTaskPassengers` - Individual worker pickup/dropoff status
- `fleetTasks` - Overall task status and timing
- `approvedLocations` - Pickup/dropoff location details
- `employees` - Worker information

---

## Fix Required

Remove "Complete Pickup" button from Navigation Tab because:
1. Navigation tab is for route planning only
2. Worker selection happens in Workers tab
3. "Complete Pickup" should only show after workers are selected
4. Keeps UI clean and logical separation of concerns
