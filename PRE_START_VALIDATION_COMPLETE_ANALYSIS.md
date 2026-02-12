# Pre-Start Validation - Complete Analysis

## Requirements Checklist

| # | Requirement | Status | Collection | Implementation |
|---|------------|--------|-----------|----------------|
| 1 | Driver must be logged in (attendance with GPS + timestamp) | ✅ SATISFIED | `attendance` | Fully working |
| 2 | Driver must be at approved location (geo-fenced) | ❌ NOT SATISFIED | N/A | Missing validation |
| 3 | Vehicle assignment must be confirmed | ✅ SATISFIED | `drivers`, `fleetVehicles` | Fully working |
| 4 | Transport task must be in "Not Started" status | ⚠️ PARTIAL | `fleetTasks` | Data exists, validation missing |

**Overall Status: 2/4 FULLY SATISFIED, 1/4 PARTIAL, 1/4 NOT SATISFIED**

---

## Requirement 1: Driver Must Be Logged In (Attendance with GPS + Timestamp)

### ✅ STATUS: SATISFIED

### How It Works

1. **Driver opens mobile app** → DriverAttendanceScreen
2. **Driver clicks "Clock In"** button
3. **System captures GPS location** from device
4. **Pre-check modal appears** (vehicle inspection)
5. **Driver confirms and submits**
6. **API call**: `POST /api/v1/driver/attendance/clock-in`
7. **Backend creates attendance record** with GPS + timestamp
8. **Response confirms** clock-in successful

### Collection: `attendance`

**Entry that appears when driver clocks in:**
```javascript
{
  id: 1234,                          // Unique attendance ID
  employeeId: 50,                    // Driver's employee ID
  projectId: 0,                      // 0 = driver attendance (not project-specific)
  date: ISODate("2024-11-20T00:00:00Z"),  // Start of day (UTC)
  checkIn: ISODate("2024-11-20T06:30:15Z"),  // ✅ Clock-in timestamp
  checkOut: null,                    // Not clocked out yet
  status: "present",                 // Attendance status
  pendingCheckout: true,             // Waiting for clock-out
  lastLatitude: 1.3521,              // ✅ GPS latitude
  lastLongitude: 103.8198,           // ✅ GPS longitude
  regularHours: 0,                   // Will be calculated at clock-out
  overtimeHours: 0,
  absenceReason: "PRESENT",
  createdAt: ISODate("2024-11-20T06:30:15Z"),
  updatedAt: ISODate("2024-11-20T06:30:15Z")
}
```

### Key Fields Stored

| Field | Purpose | Example Value |
|-------|---------|---------------|
| `employeeId` | Identifies the driver | `50` |
| `checkIn` | ✅ Timestamp when logged in | `2024-11-20T06:30:15Z` |
| `lastLatitude` | ✅ GPS latitude at clock-in | `1.3521` |
| `lastLongitude` | ✅ GPS longitude at clock-in | `103.8198` |
| `status` | Attendance status | `"present"` |
| `pendingCheckout` | Still on duty | `true` |

### API Request Example
```javascript
POST /api/v1/driver/attendance/clock-in
{
  "vehicleId": 5,
  "location": {
    "latitude": 1.3521,
    "longitude": 103.8198
  },
  "preCheckCompleted": true,
  "mileageReading": 45000
}
```

### API Response Example
```javascript
{
  "success": true,
  "message": "Clock in successful",
  "data": {
    "checkInTime": "2024-11-20T06:30:15.000Z",
    "session": "CHECKED_IN",
    "vehicleAssigned": {
      "id": 5,
      "plateNumber": "SBA1234X",
      "model": "Van"
    },
    "todayTasks": 2,
    "attendanceId": 1234
  }
}
```

### How to Verify in Database
```javascript
// Check if driver is logged in today
db.attendance.findOne({
  employeeId: 50,
  date: { $gte: ISODate("2024-11-20T00:00:00Z") },
  checkIn: { $ne: null }
})
```

**If returns a document** → Driver is logged in ✅  
**If returns null** → Driver is NOT logged in ❌

---

## Requirement 2: Driver Must Be at Approved Location (Geo-fenced)

### ❌ STATUS: NOT SATISFIED

### Current Implementation

**What's Working:**
- GPS location IS captured during clock-in
- Location IS stored in `attendance.lastLatitude` and `attendance.lastLongitude`

**What's Missing:**
- ❌ No approved location definitions (dormitory/depot/yard coordinates)
- ❌ No geofence radius configuration
- ❌ No distance calculation during clock-in
- ❌ No validation to reject clock-in if outside approved area

### Collection: NONE (Not Implemented)

**Should have approved locations stored somewhere, but currently doesn't exist.**

**Example of what SHOULD be stored (but isn't):**
```javascript
// This collection doesn't exist yet
db.approvedLocations.find()
[
  {
    id: 1,
    companyId: 1,
    name: "Main Depot",
    type: "depot",
    center: {
      latitude: 1.3521,
      longitude: 103.8198
    },
    radius: 100,  // meters
    active: true
  },
  {
    id: 2,
    companyId: 1,
    name: "Worker Dormitory A",
    type: "dormitory",
    center: {
      latitude: 1.3621,
      longitude: 103.8298
    },
    radius: 150,  // meters
    active: true
  }
]
```

### How It SHOULD Work (Not Implemented)

1. Driver clicks "Clock In"
2. System captures GPS: `{ latitude: 1.3525, longitude: 103.8195 }`
3. **System should calculate distance** to each approved location
4. **System should check** if within radius of any approved location
5. **If YES** → Allow clock-in ✅
6. **If NO** → Reject with error: "You must be at an approved location" ❌

### What Needs to Be Added

**File to modify:** `moile/backend/src/modules/driver/driverController.js`  
**Function:** `clockInDriver()`

```javascript
import { validateGeofence } from '../../utils/geofenceUtil.js';

// Define approved locations (should come from database)
const APPROVED_LOCATIONS = [
  {
    name: 'Main Depot',
    center: { latitude: 1.3521, longitude: 103.8198 },
    radius: 100
  },
  {
    name: 'Worker Dormitory A',
    center: { latitude: 1.3621, longitude: 103.8298 },
    radius: 150
  }
];

export const clockInDriver = async (req, res) => {
  const { location } = req.body;
  
  // ✅ ADD THIS VALIDATION
  if (location) {
    const isAtApprovedLocation = APPROVED_LOCATIONS.some(approvedLoc => {
      const validation = validateGeofence(location, {
        center: approvedLoc.center,
        radius: approvedLoc.radius,
        strictMode: true
      });
      return validation.isValid;
    });
    
    if (!isAtApprovedLocation) {
      return res.status(400).json({
        success: false,
        message: 'Clock-in denied: You must be at an approved location (depot/dormitory/yard)',
        error: 'LOCATION_NOT_APPROVED'
      });
    }
  }
  
  // ... rest of existing code
};
```

---

## Requirement 3: Vehicle Assignment Must Be Confirmed

### ✅ STATUS: SATISFIED

### How It Works

1. **Driver record** has `vehicleId` field
2. **Vehicle record** has `assignedDriverId` field
3. **During clock-in**, system validates vehicle exists
4. **During task fetch**, system includes vehicle details
5. **Mobile app displays** vehicle plate number and model

### Collection 1: `drivers`

**Entry that appears:**
```javascript
{
  id: 50,                            // Driver ID
  companyId: 1,
  employeeId: 50,
  employeeName: "John Driver",
  employeeCode: "DRV001",
  licenseNo: "D1234567",
  licenseClass: "Commercial",
  licenseExpiry: ISODate("2025-12-31"),
  vehicleId: 5,                      // ✅ VEHICLE ASSIGNMENT
  status: "ACTIVE",
  createdAt: ISODate("2024-01-15"),
  updatedAt: ISODate("2024-01-15")
}
```

### Collection 2: `fleetVehicles`

**Entry that appears:**
```javascript
{
  id: 5,                             // Vehicle ID (matches drivers.vehicleId)
  companyId: 1,
  vehicleCode: "VEH-005",
  registrationNo: "SBA1234X",        // ✅ Plate number
  vehicleType: "Van",                // ✅ Vehicle model/type
  capacity: 12,
  status: "AVAILABLE",
  fuelType: "Diesel",
  fuelLevel: 75,
  year: 2023,
  insuranceExpiry: ISODate("2025-06-30"),
  assignedDriverId: 50,              // ✅ Confirms driver assignment
  assignedDriverName: "John Driver",
  assignedRoute: {
    routeName: "Dormitory to Site A",
    pickupLocations: ["Worker Dormitory A"],
    dropoffLocation: "Construction Site A"
  },
  createdAt: ISODate("2023-05-10"),
  updatedAt: ISODate("2024-11-15")
}
```

### Key Fields Stored

| Collection | Field | Purpose | Example Value |
|-----------|-------|---------|---------------|
| `drivers` | `vehicleId` | ✅ Links driver to vehicle | `5` |
| `fleetVehicles` | `id` | Vehicle identifier | `5` |
| `fleetVehicles` | `registrationNo` | ✅ Plate number | `"SBA1234X"` |
| `fleetVehicles` | `vehicleType` | ✅ Vehicle model | `"Van"` |
| `fleetVehicles` | `assignedDriverId` | ✅ Confirms assignment | `50` |

### How to Verify in Database
```javascript
// Step 1: Get driver's assigned vehicle
db.drivers.findOne({ id: 50 })
// Returns: { vehicleId: 5, ... }

// Step 2: Get vehicle details
db.fleetVehicles.findOne({ id: 5 })
// Returns: { registrationNo: "SBA1234X", assignedDriverId: 50, ... }

// Step 3: Verify assignment
// drivers.vehicleId (5) === fleetVehicles.id (5) ✅
// fleetVehicles.assignedDriverId (50) === drivers.id (50) ✅
```

### API Response Example
```javascript
// During clock-in
{
  "vehicleAssigned": {
    "id": 5,                    // From fleetVehicles.id
    "plateNumber": "SBA1234X",  // From fleetVehicles.registrationNo
    "model": "Van"              // From fleetVehicles.vehicleType
  }
}

// During task fetch
{
  "taskId": 101,
  "vehicleNumber": "SBA1234X",  // From fleetVehicles.registrationNo
  "status": "PLANNED"
}
```

---

## Requirement 4: Transport Task Must Be in "Not Started" Status

### ⚠️ STATUS: PARTIALLY SATISFIED

### What's Working
- ✅ Task status field exists
- ✅ Status is stored as `"PLANNED"` for not started tasks
- ✅ Mobile app displays correct status
- ✅ Data is retrieved correctly

### What's Missing
- ❌ No validation before allowing route start
- ❌ Driver can start a task that's already `"ONGOING"`
- ❌ No check to ensure task is in `"PLANNED"` status

### Collection: `fleetTasks`

**Entry that appears (BEFORE route starts):**
```javascript
{
  id: 101,                           // Task ID
  companyId: 1,
  projectId: 10,
  driverId: 50,                      // ✅ Assigned to this driver
  vehicleId: 5,                      // ✅ Assigned to this vehicle
  taskDate: ISODate("2024-11-20"),
  plannedPickupTime: ISODate("2024-11-20T07:00:00Z"),
  plannedDropTime: ISODate("2024-11-20T08:00:00Z"),
  pickupLocation: "Worker Dormitory A",
  pickupAddress: "123 Dormitory Road, Singapore",
  dropLocation: "Construction Site A",
  dropAddress: "456 Construction Ave, Singapore",
  expectedPassengers: 8,
  actualStartTime: null,             // ✅ NULL = Not started
  actualEndTime: null,
  routeLog: [],
  status: "PLANNED",                 // ✅ "PLANNED" = "Not Started"
  notes: "",
  createdBy: 1,
  createdAt: ISODate("2024-11-19T10:00:00Z"),
  updatedAt: ISODate("2024-11-19T10:00:00Z")
}
```

**Entry that appears (AFTER route starts):**
```javascript
{
  id: 101,
  companyId: 1,
  projectId: 10,
  driverId: 50,
  vehicleId: 5,
  taskDate: ISODate("2024-11-20"),
  plannedPickupTime: ISODate("2024-11-20T07:00:00Z"),
  plannedDropTime: ISODate("2024-11-20T08:00:00Z"),
  pickupLocation: "Worker Dormitory A",
  pickupAddress: "123 Dormitory Road, Singapore",
  dropLocation: "Construction Site A",
  dropAddress: "456 Construction Ave, Singapore",
  expectedPassengers: 8,
  actualStartTime: ISODate("2024-11-20T06:45:00Z"),  // ✅ NOW SET
  actualEndTime: null,
  routeLog: [
    {
      timestamp: ISODate("2024-11-20T06:45:00Z"),
      location: { latitude: 1.3521, longitude: 103.8198 },
      event: "ROUTE_STARTED"
    }
  ],
  status: "ONGOING",                 // ✅ CHANGED from "PLANNED"
  notes: "Route started from dashboard",
  createdBy: 1,
  createdAt: ISODate("2024-11-19T10:00:00Z"),
  updatedAt: ISODate("2024-11-20T06:45:00Z")  // ✅ UPDATED
}
```

### Key Fields Stored

| Field | Before Start | After Start | Purpose |
|-------|-------------|-------------|---------|
| `status` | `"PLANNED"` | `"ONGOING"` | ✅ Task status |
| `actualStartTime` | `null` | `ISODate(...)` | ✅ Start timestamp |
| `driverId` | `50` | `50` | Driver assignment |
| `vehicleId` | `5` | `5` | Vehicle assignment |
| `updatedAt` | Original time | New time | Last update |

### Status Values

| Backend Status | Frontend Status | Meaning |
|---------------|----------------|---------|
| `PLANNED` | `pending` | ✅ **Not Started** - Can start route |
| `ONGOING` | `en_route_pickup` | Route started, going to pickup |
| `PICKUP_COMPLETE` | `pickup_complete` | Pickup done, going to dropoff |
| `EN_ROUTE_DROPOFF` | `en_route_dropoff` | En route to dropoff |
| `COMPLETED` | `completed` | Trip completed |
| `CANCELLED` | `cancelled` | Trip cancelled |

### How to Verify in Database
```javascript
// Check if task is in "Not Started" status
db.fleetTasks.findOne({
  id: 101,
  driverId: 50,
  status: "PLANNED"  // Must be PLANNED
})
```

**If returns a document** → Task is in "Not Started" status ✅  
**If returns null** → Task is NOT in "Not Started" status ❌

### What Needs to Be Added

**File to modify:** `moile/backend/src/modules/driver/driverController.js`  
**Function:** `updateTaskStatus()`

```javascript
export const updateTaskStatus = async (req, res) => {
  const { status } = req.body;
  
  const task = await FleetTask.findOne({
    id: Number(taskId),
    driverId,
    companyId
  });
  
  // ✅ ADD THIS VALIDATION
  if (status === 'en_route_pickup') {
    if (task.status !== 'PLANNED') {
      return res.status(400).json({
        success: false,
        message: `Cannot start route. Task is currently ${task.status}. Only PLANNED tasks can be started.`,
        error: 'INVALID_STATUS_TRANSITION',
        currentStatus: task.status,
        requiredStatus: 'PLANNED'
      });
    }
  }
  
  // ... rest of existing code
};
```

---

## Complete Data Flow: Pre-Start Validation

### Step-by-Step Process

#### Step 1: Driver Opens App and Clocks In

**API Call:** `POST /api/v1/driver/attendance/clock-in`

**Database Operations:**
1. Query `fleetVehicles` to validate vehicle:
   ```javascript
   db.fleetVehicles.findOne({ id: 5, companyId: 1 })
   ```

2. Check existing attendance:
   ```javascript
   db.attendance.findOne({
     employeeId: 50,
     date: { $gte: startOfDay, $lte: endOfDay }
   })
   ```

3. Create/update attendance record:
   ```javascript
   db.attendance.insertOne({
     id: 1234,
     employeeId: 50,
     projectId: 0,
     date: startOfDay,
     checkIn: new Date(),
     lastLatitude: 1.3521,
     lastLongitude: 103.8198,
     status: "present",
     pendingCheckout: true
   })
   ```

**Result:** ✅ Requirement 1 satisfied (Driver logged in with GPS + timestamp)

---

#### Step 2: Driver Views Today's Tasks

**API Call:** `GET /api/v1/driver/transport-tasks`

**Database Operations:**
1. Query `fleetTasks`:
   ```javascript
   db.fleetTasks.find({
     driverId: 50,
     companyId: 1,
     taskDate: { $gte: startOfDay, $lte: endOfDay }
   })
   ```
   **Returns:** Task 101 with `status: "PLANNED"`

2. Query `fleetVehicles`:
   ```javascript
   db.fleetVehicles.find({ id: { $in: [5] } })
   ```
   **Returns:** Vehicle SBA1234X

3. Query `drivers`:
   ```javascript
   db.drivers.findOne({ id: 50 })
   ```
   **Returns:** Driver with `vehicleId: 5`

**Result:**
- ✅ Requirement 3 satisfied (Vehicle assignment confirmed)
- ✅ Requirement 4 data exists (Task status is "PLANNED")

---

#### Step 3: Driver Clicks "Start Route"

**API Call:** `PUT /api/v1/driver/transport-tasks/101/status`

**Request:**
```javascript
{
  "status": "en_route_pickup",
  "location": { "latitude": 1.3521, "longitude": 103.8198 },
  "notes": "Route started"
}
```

**Database Operations:**
1. Find task:
   ```javascript
   db.fleetTasks.findOne({
     id: 101,
     driverId: 50,
     companyId: 1
   })
   ```
   **Returns:** Task with `status: "PLANNED"`

2. **⚠️ MISSING:** Should validate `status === "PLANNED"` here

3. Update task:
   ```javascript
   db.fleetTasks.updateOne(
     { id: 101 },
     {
       $set: {
         status: "ONGOING",
         actualStartTime: new Date(),
         updatedAt: new Date()
       }
     }
   )
   ```

**Result:** Task status changed from "PLANNED" to "ONGOING"

---

## Summary: Data Sources for Each Requirement

| Requirement | Collection(s) | Key Fields | Status |
|------------|--------------|-----------|--------|
| 1. Driver logged in with GPS | `attendance` | `checkIn`, `lastLatitude`, `lastLongitude` | ✅ Working |
| 2. At approved location | None | N/A | ❌ Not implemented |
| 3. Vehicle assignment | `drivers`, `fleetVehicles` | `vehicleId`, `assignedDriverId` | ✅ Working |
| 4. Task not started | `fleetTasks` | `status`, `actualStartTime` | ⚠️ Data exists, validation missing |

---

## Quick Verification Queries

### Check All Requirements at Once
```javascript
// 1. Check driver logged in
const attendance = await db.attendance.findOne({
  employeeId: 50,
  date: { $gte: new Date().setHours(0,0,0,0) },
  checkIn: { $ne: null }
});
console.log("1. Logged in:", !!attendance);  // Should be true

// 2. Check location (not implemented)
console.log("2. At approved location: NOT IMPLEMENTED");

// 3. Check vehicle assignment
const driver = await db.drivers.findOne({ id: 50 });
const vehicle = await db.fleetVehicles.findOne({ id: driver.vehicleId });
console.log("3. Vehicle assigned:", !!vehicle);  // Should be true

// 4. Check task status
const task = await db.fleetTasks.findOne({
  id: 101,
  driverId: 50,
  status: "PLANNED"
});
console.log("4. Task not started:", !!task);  // Should be true
```

---

## Recommendations

### Priority 1: Add Geofence Validation (Requirement 2)
- Create `approvedLocations` collection or configuration
- Add validation in `clockInDriver()` function
- Use existing `geofenceUtil.js` utilities

### Priority 2: Add Task Status Validation (Requirement 4)
- Add check in `updateTaskStatus()` function
- Ensure task is in `"PLANNED"` status before allowing start
- Return clear error message if validation fails

### Priority 3: Create Pre-Start Validation Endpoint
- New endpoint: `POST /api/v1/driver/transport-tasks/:taskId/validate-start`
- Validates all 4 requirements in one call
- Returns detailed validation results
