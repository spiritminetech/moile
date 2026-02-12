# Route Start Data Flow - Collection Entries

## Overview
This document shows exactly which MongoDB collection entries appear when the route start requirements are working.

---

## Requirement 3: Vehicle Assignment Must Be Confirmed

### Collections Involved

#### 1. **`drivers` Collection**
**Purpose**: Stores driver profile and vehicle assignment

**Entry Example**:
```javascript
{
  id: 50,                          // Driver ID
  companyId: 1,
  employeeId: 50,
  employeeName: "John Driver",
  employeeCode: "DRV001",
  jobTitle: "Transport Driver",
  licenseNo: "D1234567",
  licenseClass: "Commercial",
  licenseExpiry: ISODate("2025-12-31"),
  vehicleId: 5,                    // ✅ VEHICLE ASSIGNMENT
  status: "ACTIVE",
  createdAt: ISODate("2024-01-15"),
  updatedAt: ISODate("2024-01-15")
}
```

**Key Field**: `vehicleId: 5` - This confirms the driver is assigned to vehicle ID 5

---

#### 2. **`fleetVehicles` Collection**
**Purpose**: Stores vehicle details

**Entry Example**:
```javascript
{
  id: 5,                           // Vehicle ID (matches driver.vehicleId)
  companyId: 1,
  vehicleCode: "VEH-005",
  registrationNo: "SBA1234X",      // ✅ PLATE NUMBER
  vehicleType: "Van",              // ✅ VEHICLE MODEL/TYPE
  capacity: 12,
  status: "AVAILABLE",
  fuelType: "Diesel",
  fuelLevel: 75,
  year: 2023,
  insuranceExpiry: ISODate("2025-06-30"),
  lastServiceDate: ISODate("2024-11-01"),
  odometer: 45000,
  assignedDriverId: 50,            // ✅ CONFIRMS DRIVER ASSIGNMENT
  assignedDriverName: "John Driver",
  assignedRoute: {
    routeName: "Dormitory to Site A",
    routeCode: "RT-001",
    pickupLocations: ["Worker Dormitory A", "Worker Dormitory B"],
    dropoffLocation: "Construction Site A",
    estimatedDistance: 15.5,
    estimatedDuration: 45
  },
  createdAt: ISODate("2023-05-10"),
  updatedAt: ISODate("2024-11-15")
}
```

**Key Fields**:
- `id: 5` - Vehicle identifier
- `registrationNo: "SBA1234X"` - Plate number shown to driver
- `vehicleType: "Van"` - Vehicle model/type
- `assignedDriverId: 50` - Confirms this vehicle is assigned to driver ID 50

---

### How It Appears in API Response

When driver calls `GET /api/v1/driver/transport-tasks`, the response includes:

```javascript
{
  success: true,
  data: [
    {
      taskId: 101,
      route: "Worker Dormitory A → Construction Site A",
      status: "PLANNED",
      vehicleNumber: "SBA1234X",    // ✅ FROM fleetVehicles.registrationNo
      totalWorkers: 8,
      checkedInWorkers: 0,
      // ... other fields
    }
  ]
}
```

During clock-in (`POST /api/v1/driver/attendance/clock-in`), response includes:

```javascript
{
  success: true,
  data: {
    checkInTime: "2024-11-20T06:30:00.000Z",
    session: "CHECKED_IN",
    vehicleAssigned: {
      id: 5,                        // ✅ FROM fleetVehicles.id
      plateNumber: "SBA1234X",      // ✅ FROM fleetVehicles.registrationNo
      model: "Van"                  // ✅ FROM fleetVehicles.vehicleType
    },
    todayTasks: 2,
    attendanceId: 1234
  }
}
```

---

## Requirement 4: Transport Task Must Be in "Not Started" Status

### Collection Involved

#### **`fleetTasks` Collection**
**Purpose**: Stores transport task details and status

**Entry Example (Before Route Start)**:
```javascript
{
  id: 101,                         // Task ID
  companyId: 1,
  projectId: 10,
  driverId: 50,                    // ✅ ASSIGNED TO DRIVER
  vehicleId: 5,                    // ✅ ASSIGNED VEHICLE
  taskDate: ISODate("2024-11-20"),
  plannedPickupTime: ISODate("2024-11-20T07:00:00.000Z"),
  plannedDropTime: ISODate("2024-11-20T08:00:00.000Z"),
  pickupLocation: "Worker Dormitory A",
  pickupAddress: "123 Dormitory Road, Singapore",
  dropLocation: "Construction Site A",
  dropAddress: "456 Construction Ave, Singapore",
  expectedPassengers: 8,
  actualStartTime: null,           // ✅ NULL = Not started yet
  actualEndTime: null,
  routeLog: [],
  status: "PLANNED",               // ✅ "PLANNED" = "Not Started"
  notes: "",
  createdBy: 1,
  createdAt: ISODate("2024-11-19T10:00:00.000Z"),
  updatedAt: ISODate("2024-11-19T10:00:00.000Z")
}
```

**Key Fields**:
- `status: "PLANNED"` - This is the "Not Started" status
- `actualStartTime: null` - Confirms route hasn't started
- `driverId: 50` - Confirms task is assigned to this driver
- `vehicleId: 5` - Confirms vehicle assignment for this task

---

**Entry Example (After Route Start)**:
```javascript
{
  id: 101,
  companyId: 1,
  projectId: 10,
  driverId: 50,
  vehicleId: 5,
  taskDate: ISODate("2024-11-20"),
  plannedPickupTime: ISODate("2024-11-20T07:00:00.000Z"),
  plannedDropTime: ISODate("2024-11-20T08:00:00.000Z"),
  pickupLocation: "Worker Dormitory A",
  pickupAddress: "123 Dormitory Road, Singapore",
  dropLocation: "Construction Site A",
  dropAddress: "456 Construction Ave, Singapore",
  expectedPassengers: 8,
  actualStartTime: ISODate("2024-11-20T06:45:00.000Z"),  // ✅ NOW SET
  actualEndTime: null,
  routeLog: [
    {
      timestamp: ISODate("2024-11-20T06:45:00.000Z"),
      location: { latitude: 1.3521, longitude: 103.8198 },
      event: "ROUTE_STARTED"
    }
  ],
  status: "ONGOING",               // ✅ CHANGED FROM "PLANNED" TO "ONGOING"
  notes: "Route started from dashboard",
  createdBy: 1,
  createdAt: ISODate("2024-11-19T10:00:00.000Z"),
  updatedAt: ISODate("2024-11-20T06:45:00.000Z")  // ✅ UPDATED
}
```

**Changed Fields**:
- `status: "ONGOING"` - Changed from "PLANNED"
- `actualStartTime: ISODate(...)` - Now populated with start time
- `updatedAt: ISODate(...)` - Updated timestamp

---

### Status Enum Values

The `fleetTasks.status` field has these possible values:

| Backend Status | Frontend Status | Meaning |
|---------------|----------------|---------|
| `PLANNED` | `pending` | ✅ **Not Started** - Ready to begin |
| `ONGOING` | `en_route_pickup` | En route to pickup location |
| `PICKUP_COMPLETE` | `pickup_complete` | Pickup completed, heading to dropoff |
| `EN_ROUTE_DROPOFF` | `en_route_dropoff` | En route to dropoff location |
| `COMPLETED` | `completed` | Trip completed |
| `CANCELLED` | `cancelled` | Trip cancelled |

**For route start validation**: Task must be in `PLANNED` status.

---

### How It Appears in API Response

When driver calls `GET /api/v1/driver/transport-tasks`:

```javascript
{
  success: true,
  data: [
    {
      taskId: 101,
      route: "Worker Dormitory A → Construction Site A",
      status: "PLANNED",           // ✅ FROM fleetTasks.status
      totalWorkers: 8,
      checkedInWorkers: 0,
      startTime: "07:00 AM",       // ✅ FROM fleetTasks.plannedPickupTime
      endTime: "08:00 AM",         // ✅ FROM fleetTasks.plannedDropTime
      vehicleNumber: "SBA1234X",
      pickupLocation: "Worker Dormitory A",
      dropLocation: "Construction Site A"
    }
  ]
}
```

When driver starts route (`PUT /api/v1/driver/transport-tasks/101/status`):

**Request**:
```javascript
{
  status: "en_route_pickup",       // Frontend status
  location: {
    latitude: 1.3521,
    longitude: 103.8198
  },
  notes: "Route started from dashboard"
}
```

**Response**:
```javascript
{
  success: true,
  message: "Task status updated successfully",
  data: {
    taskId: 101,
    status: "ONGOING",             // ✅ Backend status (mapped from "en_route_pickup")
    updatedAt: "2024-11-20T06:45:00.000Z"
  }
}
```

---

## Complete Data Flow Example

### Scenario: Driver starts route for Task 101

#### Step 1: Driver Views Tasks
**API Call**: `GET /api/v1/driver/transport-tasks`

**Database Queries**:
1. Query `fleetTasks` collection:
   ```javascript
   db.fleetTasks.find({
     driverId: 50,
     companyId: 1,
     taskDate: { $gte: startOfDay, $lte: endOfDay }
   })
   ```
   **Returns**: Task 101 with `status: "PLANNED"`

2. Query `fleetVehicles` collection:
   ```javascript
   db.fleetVehicles.find({
     id: { $in: [5] }  // vehicleId from task
   })
   ```
   **Returns**: Vehicle details (SBA1234X, Van)

3. Query `fleetTaskPassengers` collection:
   ```javascript
   db.fleetTaskPassengers.aggregate([
     { $match: { fleetTaskId: { $in: [101] } } },
     { $group: { _id: "$fleetTaskId", count: { $sum: 1 } } }
   ])
   ```
   **Returns**: Total workers count (8)

**Response to Mobile App**:
```javascript
{
  taskId: 101,
  status: "PLANNED",              // ✅ Task is in "Not Started" status
  vehicleNumber: "SBA1234X",      // ✅ Vehicle assignment confirmed
  totalWorkers: 8
}
```

---

#### Step 2: Driver Clicks "Start Route"
**API Call**: `PUT /api/v1/driver/transport-tasks/101/status`

**Request Body**:
```javascript
{
  status: "en_route_pickup",
  location: { latitude: 1.3521, longitude: 103.8198 },
  notes: "Route started"
}
```

**Database Operations**:
1. Find task in `fleetTasks`:
   ```javascript
   db.fleetTasks.findOne({
     id: 101,
     driverId: 50,
     companyId: 1
   })
   ```
   **Returns**: Task with `status: "PLANNED"`

2. **⚠️ MISSING VALIDATION**: Should check if `status === "PLANNED"` before allowing update

3. Update task in `fleetTasks`:
   ```javascript
   db.fleetTasks.updateOne(
     { id: 101 },
     {
       $set: {
         status: "ONGOING",        // Changed from "PLANNED"
         actualStartTime: new Date(),
         updatedAt: new Date()
       }
     }
   )
   ```

**Response to Mobile App**:
```javascript
{
  success: true,
  message: "Task status updated successfully",
  data: {
    taskId: 101,
    status: "ONGOING",
    updatedAt: "2024-11-20T06:45:00.000Z"
  }
}
```

---

## Summary: Which Collections Store What

| Requirement | Collection | Key Fields | Purpose |
|------------|-----------|-----------|---------|
| Vehicle Assignment | `drivers` | `vehicleId` | Links driver to vehicle |
| Vehicle Assignment | `fleetVehicles` | `id`, `registrationNo`, `vehicleType`, `assignedDriverId` | Stores vehicle details and confirms assignment |
| Task Status | `fleetTasks` | `status`, `actualStartTime`, `driverId`, `vehicleId` | Stores task status and assignment |

---

## Current Implementation Status

✅ **Working**:
- Vehicle assignment data is stored in `drivers.vehicleId` and `fleetVehicles.assignedDriverId`
- Task status is stored in `fleetTasks.status` with value `"PLANNED"` for not started
- Data is correctly retrieved and displayed in mobile app

⚠️ **Missing Validation**:
- No check to ensure `fleetTasks.status === "PLANNED"` before allowing route start
- Driver can start a task that's already `"ONGOING"` or in any other status

**Recommendation**: Add validation in `updateTaskStatus()` function to check current status before allowing transition to `"ONGOING"`.
