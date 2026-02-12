# Route Start - Collections Reference Guide

## Overview
This document explains which MongoDB collections are involved in each pre-start validation requirement and what data gets updated.

---

## Pre-Start Validation Requirements

### 1. Driver Must Be Logged In (Attendance with GPS + Timestamp)

#### Collections Involved

**Collection:** `attendance`

**Purpose:** Stores driver clock-in/clock-out records with GPS location

**Schema:**
```javascript
{
  id: Number,
  employeeId: Number,           // Driver's employis updated when route starts
4. All other collections are **read-only** during route start validation
5. Driver location is validated against **`approvedLocations`**, NOT project locations
ate (Write Operation)

```javascript
// Only fleetTasks collection is updated
await FleetTask.updateOne(
  { id: 101 },
  {
    $set: {
      status: "ONGOING",              // Changed from PLANNED
      actualStartTime: new Date(),    // Set start time
      updatedAt: new Date()           // Update timestamp
    }
  }
);
```

---

## Key Points

1. **`approvedLocations`** is for DRIVER locations (depot/dormitory/yard)
2. **`projects`** is for WORKER locations (project sites)
3. Only **`fleetTasks`** collection  employeeId: 50,
  date: { $gte: today, $lte: endOfDay },
  checkIn: { $ne: null },
  pendingCheckout: true
});
// ✅ Found → Driver clocked in

// 2. Check approved locations
const approvedLocations = await ApprovedLocation.find({
  companyId: 1,
  active: true,
  allowedForRouteStart: true
});
// ✅ Found → Validate driver GPS against each location

// 3. Check task
const task = await FleetTask.findOne({
  id: 101,
  driverId: 50,
  companyId: 1
});
// ✅ Found → Verify status is PLANNED
```

### Step 2: Updeofence (depot/dormitory/yard) | ❌ No (only queried) |
| 2. Project location | `projects` | Worker attendance (NOT for drivers) | ❌ No (not used for drivers) |
| 3. Vehicle assignment | `drivers`, `fleetVehicles` | Confirm vehicle assigned | ❌ No (only queried) |
| 4. Task status | `fleetTasks` | Verify PLANNED status | ✅ **YES** (status → ONGOING) |

---

## Data Flow on Route Start

### Step 1: Validation (Read-Only Queries)

```javascript
// 1. Check attendance
const attendance = await Attendance.findOne({
                 // ✅ CHANGED from PLANNED
  notes: "Route started from dashboard",
  createdBy: 1,
  createdAt: ISODate("2024-11-19T10:00:00Z"),
  updatedAt: ISODate("2024-11-20T06:45:00Z")  // ✅ UPDATED
}
```

---

## Summary Table

| Requirement | Collection(s) | Purpose | Updated on Route Start? |
|------------|--------------|---------|------------------------|
| 1. Driver logged in | `attendance` | Verify clock-in with GPS | ❌ No (only queried) |
| 2. Approved location | `approvedLocations` | Validate g  plannedDropTime: ISODate("2024-11-20T08:00:00Z"),
  pickupLocation: "Worker Dormitory A",
  pickupAddress: "123 Dormitory Road",
  dropLocation: "Construction Site A",
  dropAddress: "456 Construction Ave",
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
  status: "ONGOING",      ualStartTime: null,                  // ✅ Not started yet
  actualEndTime: null,
  routeLog: [],
  status: "PLANNED",                      // ✅ Not started status
  notes: "",
  createdBy: 1,
  createdAt: ISODate("2024-11-19T10:00:00Z"),
  updatedAt: ISODate("2024-11-19T10:00:00Z")
}
```

**Example Document (After Route Start):**
```javascript
{
  id: 101,
  companyId: 1,
  projectId: 10,
  driverId: 50,
  vehicleId: 5,
  taskDate: ISODate("2024-11-20"),
  plannedPickupTime: ISODate("2024-11-20T07:00:00Z"),
avascript
{
  id: 101,
  companyId: 1,
  projectId: 10,
  driverId: 50,                           // ✅ Assigned to driver
  vehicleId: 5,                           // ✅ Assigned vehicle
  taskDate: ISODate("2024-11-20"),
  plannedPickupTime: ISODate("2024-11-20T07:00:00Z"),
  plannedDropTime: ISODate("2024-11-20T08:00:00Z"),
  pickupLocation: "Worker Dormitory A",
  pickupAddress: "123 Dormitory Road",
  dropLocation: "Construction Site A",
  dropAddress: "456 Construction Ave",
  expectedPassengers: 8,
  act**Status Values:**
- `PLANNED` - Not started (shows "Start Route" button)
- `ONGOING` - Route started (en route to pickup)
- `PICKUP_COMPLETE` - Pickup completed
- `EN_ROUTE_DROPOFF` - En route to dropoff
- `COMPLETED` - Trip completed
- `CANCELLED` - Trip cancelled

**When Updated:**
- **Route Start:** Status changes from `PLANNED` to `ONGOING`, `actualStartTime` set, `updatedAt` updated
- **Status Updates:** Status progresses through workflow, `updatedAt` updated

**Example Document (Before Route Start):**
```jle
  taskDate: Date,
  plannedPickupTime: Date,
  plannedDropTime: Date,
  pickupLocation: String,
  pickupAddress: String,
  dropLocation: String,
  dropAddress: String,
  expectedPassengers: Number,
  actualStartTime: Date,        // ✅ Set when route starts
  actualEndTime: Date,
  routeLog: Array,
  status: String,               // ✅ 'PLANNED', 'ONGOING', 'PICKUP_COMPLETE', etc.
  notes: String,
  createdBy: Number,
  createdAt: Date,
  updatedAt: Date               // ✅ Updated when status changes
}
```

des `vehicleId`, system validates it exists in `fleetVehicles`
- During route start: Task already has `vehicleId` assigned, no additional check needed

---

### 4. Transport Task Must Be in "Not Started" Status

#### Collections Involved

**Collection:** `fleetTasks`

**Purpose:** Stores transport task details and status

**Schema:**
```javascript
{
  id: Number,
  companyId: Number,
  projectId: Number,
  driverId: Number,             // ✅ Assigned driver
  vehicleId: Number,            // ✅ Assigned vehic-11-01"),
  odometer: 45000,
  assignedDriverId: 50,               // ✅ Assigned to driver ID 50
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

**Validation:**
- During clock-in: Driver provi- **Admin assigns driver:** `assignedDriverId` and `assignedDriverName` updated
- **NOT updated during route start** - Only queried for validation

**Example Document:**
```javascript
{
  id: 5,
  companyId: 1,
  vehicleCode: "VEH-005",
  registrationNo: "SBA1234X",         // ✅ Plate number
  vehicleType: "Van",                 // ✅ Vehicle type
  capacity: 12,
  status: "AVAILABLE",
  fuelType: "Diesel",
  fuelLevel: 75,
  year: 2023,
  insuranceExpiry: ISODate("2025-06-30"),
  lastServiceDate: ISODate("2024   // 'AVAILABLE', 'IN_SERVICE', 'MAINTENANCE'
  fuelType: String,
  fuelLevel: Number,
  year: Number,
  insuranceExpiry: Date,
  lastServiceDate: Date,
  odometer: Number,
  assignedDriverId: Number,     // ✅ Assigned driver ID
  assignedDriverName: String,
  assignedRoute: {
    routeName: String,
    routeCode: String,
    pickupLocations: [String],
    dropoffLocation: String,
    estimatedDistance: Number,
    estimatedDuration: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

**When Updated:**
le ID 5
  status: "ACTIVE",
  createdAt: ISODate("2024-01-15"),
  updatedAt: ISODate("2024-01-15")
}
```

---

**Collection 2:** `fleetVehicles`

**Purpose:** Stores vehicle details and driver assignment

**Schema:**
```javascript
{
  id: Number,
  companyId: Number,
  vehicleCode: String,
  registrationNo: String,       // ✅ Plate number (e.g., "SBA1234X")
  vehicleType: String,          // ✅ Vehicle model/type (e.g., "Van")
  capacity: Number,             // Passenger capacity
  status: String,            ENDED'
  createdAt: Date,
  updatedAt: Date
}
```

**When Updated:**
- **Admin assigns vehicle:** `vehicleId` field updated
- **NOT updated during route start** - Only queried for validation

**Example Document:**
```javascript
{
  id: 50,
  companyId: 1,
  employeeId: 50,
  employeeName: "John Driver",
  employeeCode: "DRV001",
  jobTitle: "Transport Driver",
  licenseNo: "D1234567",
  licenseClass: "Commercial",
  licenseExpiry: ISODate("2025-12-31"),
  vehicleId: 5,                   // ✅ Assigned to vehicsignment Must Be Confirmed

#### Collections Involved

**Collection 1:** `drivers`

**Purpose:** Stores driver profile and vehicle assignment

**Schema:**
```javascript
{
  id: Number,
  companyId: Number,
  employeeId: Number,           // Links to employee record
  employeeName: String,
  employeeCode: String,
  jobTitle: String,
  licenseNo: String,
  licenseClass: String,
  licenseExpiry: Date,
  vehicleId: Number,            // ✅ Assigned vehicle ID
  status: String,               // 'ACTIVE', 'INACTIVE', 'SUSP// ✅ Project site coordinates
      longitude: 103.9198
    },
    radius: 100,                  // ✅ 100 meters radius
    strictMode: true,
    allowedVariance: 10
  },
  
  status: "Ongoing",
  startDate: ISODate("2024-01-01"),
  endDate: ISODate("2024-12-31"),
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-01T00:00:00Z")
}
```

**Note:** Drivers do NOT use project locations for route start validation. They use `approvedLocations` (depot/dormitory/yard).

---

### 3. Vehicle As  createdAt: Date,
  updatedAt: Date
}
```

**Usage:**
- **Workers:** Must be at project location to clock-in/start tasks
- **Drivers:** Use `approvedLocations` (depot/dormitory/yard), NOT project locations

**Example Document:**
```javascript
{
  id: 10,
  companyId: 1,
  projectName: "Construction Site A",
  address: "456 Construction Ave",
  
  // Legacy format
  latitude: 1.4521,
  longitude: 103.9198,
  geofenceRadius: 100,
  
  // Enhanced format
  geofence: {
    center: {
      latitude: 1.4521,           / Project site longitude
  geofenceRadius: Number,       // Radius in meters
  
  // Enhanced geofence (newer format)
  geofence: {
    center: {
      latitude: Number,         // ✅ Project site center
      longitude: Number
    },
    radius: Number,             // ✅ Geofence radius (default: 100m)
    strictMode: Boolean,        // Strict validation (default: true)
    allowedVariance: Number     // Additional allowed distance (default: 10m)
  },
  
  status: String,
  startDate: Date,
  endDate: Date,
og(`✅ Driver at ${approvedLoc.name} (${distance}m away)`);
    // Allow route start
  }
}
```

---

#### Alternative: Project Location (For Worker Attendance)

**Collection:** `projects`

**Purpose:** Stores project site locations with geofence (used for WORKER attendance, NOT driver route start)

**Schema:**
```javascript
{
  id: Number,
  companyId: Number,
  projectName: String,
  address: String,
  
  // Legacy fields
  latitude: Number,             // Project site latitude
  longitude: Number,            /:00Z")
}
```

**Geofence Validation Logic:**
```javascript
// Driver's current location
const driverLocation = {
  latitude: 1.3525,
  longitude: 103.8200
};

// Check distance to each approved location
for (const approvedLoc of approvedLocations) {
  const distance = calculateDistance(
    driverLocation.latitude,
    driverLocation.longitude,
    approvedLoc.center.latitude,
    approvedLoc.center.longitude
  );
  
  // If within radius, allow route start
  if (distance <= approvedLoc.radius) {
    console.lId: 1,
  name: "Equipment Yard",
  type: "yard",                           // ✅ Yard type
  address: "789 Storage Road",
  center: {
    latitude: 1.3721,                     // ✅ Yard coordinates
    longitude: 103.8398
  },
  radius: 200,                            // ✅ 200 meters radius
  active: true,
  allowedForClockIn: true,
  allowedForRouteStart: true,             // ✅ Can start route here
  notes: "Equipment storage yard",
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-01T00:00                   // ✅ Dormitory type
  address: "456 Dormitory Lane",
  center: {
    latitude: 1.3621,                     // ✅ Dormitory coordinates
    longitude: 103.8298
  },
  radius: 150,                            // ✅ 150 meters radius
  active: true,
  allowedForClockIn: true,
  allowedForRouteStart: true,             // ✅ Can start route here
  notes: "Worker accommodation",
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-01T00:00:00Z")
}

// Yard
{
  id: 3,
  companyrial Road",
  center: {
    latitude: 1.3521,                     // ✅ Depot coordinates
    longitude: 103.8198
  },
  radius: 100,                            // ✅ 100 meters radius
  active: true,
  allowedForClockIn: true,
  allowedForRouteStart: true,             // ✅ Can start route here
  notes: "Main vehicle depot",
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-01T00:00:00Z")
}

// Dormitory
{
  id: 2,
  companyId: 1,
  name: "Worker Dormitory A",
  type: "dormitory",   reates approved location:** New document inserted
- **Admin updates location:** Document updated
- **NOT updated during route start** - Only queried for validation

**Validation Query (Route Start):**
```javascript
db.approvedLocations.find({
  companyId: 1,
  active: true,
  allowedForRouteStart: true    // Must allow route start
})
```

**Example Documents:**
```javascript
// Depot
{
  id: 1,
  companyId: 1,
  name: "Main Depot",
  type: "depot",                          // ✅ Depot type
  address: "123 Industng,
  center: {
    latitude: Number,           // ✅ Center point latitude
    longitude: Number           // ✅ Center point longitude
  },
  radius: Number,               // ✅ Geofence radius in meters (default: 100)
  active: Boolean,              // Must be true
  allowedForClockIn: Boolean,   // ✅ Allow clock-in at this location
  allowedForRouteStart: Boolean,// ✅ Allow route start at this location
  notes: String,
  createdBy: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**When Updated:**
- **Admin c11-20T06:30:00Z")
}
```

---

### 2. Driver Must Be at Approved Location (Dormitory/Depot/Yard - Geo-fenced)

#### Collections Involved

**Collection:** `approvedLocations`

**Purpose:** Stores approved locations where drivers can clock-in and start routes (dormitory, depot, yard)

**Schema:**
```javascript
{
  id: Number,
  companyId: Number,
  name: String,                 // "Main Depot", "Worker Dormitory A"
  type: String,                 // ✅ 'depot', 'dormitory', 'yard', 'office', 'other'
  address: Stri```

**Example Document:**
```javascript
{
  id: 1234,
  employeeId: 50,
  projectId: 0,
  date: ISODate("2024-11-20T00:00:00Z"),
  checkIn: ISODate("2024-11-20T06:30:00Z"),    // ✅ Driver clocked in
  checkOut: null,
  pendingCheckout: true,                        // ✅ Still checked in
  lastLatitude: 1.3521,                         // ✅ GPS at clock-in
  lastLongitude: 103.8198,
  status: "present",
  regularHours: 0,
  overtimeHours: 0,
  createdAt: ISODate("2024-11-20T06:30:00Z"),
  updatedAt: ISODate("2024-s: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**When Updated:**
- **Clock-In:** Creates/updates record with `checkIn`, `lastLatitude`, `lastLongitude`, `pendingCheckout: true`
- **Clock-Out:** Updates `checkOut`, sets `pendingCheckout: false`

**Validation Query (Route Start):**
```javascript
db.attendance.findOne({
  employeeId: 50,
  date: { $gte: startOfDay, $lte: endOfDay },
  checkIn: { $ne: null },       // Must have clock-in time
  pendingCheckout: true         // Must be currently checked in
})
ee ID
  projectId: Number,            // 0 for driver attendance
  date: Date,                   // Start of day (UTC)
  checkIn: Date,                // ✅ Clock-in timestamp
  checkOut: Date,               // Clock-out timestamp
  pendingCheckout: Boolean,     // ✅ true when clocked in
  lastLatitude: Number,         // ✅ GPS latitude at clock-in
  lastLongitude: Number,        // ✅ GPS longitude at clock-in
  status: String,               // 'present', 'late', 'absent'
  regularHours: Number,
  overtimeHour