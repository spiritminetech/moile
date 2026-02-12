# Driver Screen Technical Flow Documentation

## Overview
This document explains the complete technical data flow for the Driver Mobile App screens. For each button/action, you'll see:
- Which API endpoint is called
- What database collections are accessed
- What data is sent and received
- Complete flow from UI → API → Database → Response

---

## Table of Contents
1. [Dashboard Screen](#dashboard-screen)
2. [Transport Tasks Screen](#transport-tasks-screen)
3. [Route Navigation](#route-navigation)
4. [Worker Check-In](#worker-check-in)
5. [Pickup Completion](#pickup-completion)
6. [Dropoff Completion](#dropoff-completion)
7. [Attendance Screen](#attendance-screen)
8. [Vehicle Info Screen](#vehicle-info-screen)
9. [Trip History](#trip-history)
10. [Profile Screen](#profile-screen)

---

## 1. Dashboard Screen

### Screen: `DriverDashboard.tsx`

### Button: "View Tasks" / Load Dashboard
**API Call:**
```
GET /api/driver/dashboard/summary
```

**Request Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body:** None (GET request)

**Backend Controller:** `driverController.getDashboardSummary()`

**Database Collections Accessed:**
1. **FleetTask** - Get today's tasks
   - Query: `{ driverId, companyId, taskDate: { $gte: startOfDay, $lte: endOfDay } }`
   - Fields: `id, status, vehicleId`

2. **FleetTaskPassenger** - Count total passengers
   - Query: `{ fleetTaskId: { $in: taskIds } }`
   - Operation: `countDocuments()`

3. **FleetVehicle** - Get current vehicle
   - Query: `{ id: vehicleId }`
   - Fields: `id, registrationNo, vehicleType, capacity`

4. **Employee** - Get driver info
   - Query: `{ id: driverId }`
   - Fields: `fullName, photoUrl, photo_url`

**Response Data:**
```json
{
  "success": true,
  "message": "Dashboard summary retrieved successfully",
  "summary": {
    "driverId": 123,
    "driverName": "John Driver",
    "driverPhoto": "/uploads/drivers/photo.jpg",
    "totalTrips": 5,
    "completedTrips": 2,
    "ongoingTrips": 1,
    "pendingTrips": 2,
    "totalPassengers": 45,
    "currentVehicle": {
      "id": 10,
      "registrationNo": "ABC-1234",
      "vehicleType": "Bus",
      "capacity": 50
    },
    "date": "2026-02-11T00:00:00.000Z"
  }
}
```

**Data Flow:**
```
UI Button Click
    ↓
API Call: GET /api/driver/dashboard/summary
    ↓
Backend: driverController.getDashboardSummary()
    ↓
Database Queries:
    1. FleetTask.find() → Get today's tasks
    2. FleetTaskPassenger.countDocuments() → Count passengers
    3. FleetVehicle.findOne() → Get vehicle details
    4. Employee.findOne() → Get driver info
    ↓
Response: Dashboard summary object
    ↓
UI Update: Display dashboard cards with stats
```

---

## 2. Transport Tasks Screen

### Screen: `TransportTasksScreen.tsx`

### Button: "Load Today's Tasks"
**API Call:**
```
GET /api/driver/transport-tasks
```

**Request Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Backend Controller:** `driverController.getTodaysTasks()`

**Database Collections Accessed:**
1. **FleetTask** - Get today's transport tasks
   - Query: `{ driverId, companyId, taskDate: { $gte: startOfDay, $lte: endOfDay } }`
   - Fields: All fields

2. **Project** - Get project details
   - Query: `{ id: { $in: projectIds } }`
   - Fields: `id, projectName`

3. **FleetVehicle** - Get vehicle details
   - Query: `{ id: { $in: vehicleIds } }`
   - Fields: `id, registrationNo`

4. **FleetTaskPassenger** - Count passengers per task
   - Aggregation: Group by fleetTaskId, count passengers
   - Also counts checked-in workers via attendance lookup

5. **Employee** - Get driver info
   - Query: `{ id: driverId, companyId }`
   - Fields: `fullName, phone, photoUrl`

**Response Data:**
```json
{
  "success": true,
  "message": "Found 3 tasks for today",
  "data": [
    {
      "taskId": 101,
      "route": "Dormitory A → Construction Site B",
      "pickupLocations": [],
      "dropoffLocation": {
        "name": "Construction Site B",
        "address": "123 Site Road",
        "coordinates": { "latitude": 25.2048, "longitude": 55.2708 },
        "estimatedArrival": "2026-02-11T08:00:00.000Z"
      },
      "status": "PLANNED",
      "totalWorkers": 25,
      "checkedInWorkers": 0,
      "projectName": "Tower Construction",
      "startTime": "07:00 AM",
      "endTime": "08:00 AM",
      "vehicleNumber": "ABC-1234",
      "passengers": 25,
      "pickupLocation": "Dormitory A",
      "dropLocation": "Construction Site B",
      "driverName": "John Driver",
      "driverPhone": "+971501234567",
      "driverPhoto": "/uploads/drivers/photo.jpg",
      "employeeId": 123
    }
  ]
}
```

**Data Flow:**
```
UI: Load Tasks Button
    ↓
API: GET /api/driver/transport-tasks
    ↓
Backend: getTodaysTasks()
    ↓
Database:
    1. FleetTask.find() → Get tasks for today
    2. Project.find() → Get project names
    3. FleetVehicle.find() → Get vehicle details
    4. FleetTaskPassenger.aggregate() → Count passengers
    5. FleetTaskPassenger.aggregate() + Attendance lookup → Count checked-in workers
    6. Employee.findOne() → Get driver info
    ↓
Response: Array of transport tasks
    ↓
UI: Display task list with status, workers, locations
```

---

### Button: "Start Route"
**API Call:**
```
PUT /api/driver/transport-tasks/:taskId/status
```

**Request Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "status": "en_route_pickup",
  "location": {
    "latitude": 25.2048,
    "longitude": 55.2708,
    "accuracy": 10,
    "timestamp": "2026-02-11T07:00:00.000Z"
  },
  "notes": "Starting route to pickup location"
}
```

**Backend Controller:** `driverController.updateTaskStatus()`

**Database Collections Accessed:**
1. **FleetTask** - Update task status
   - Query: `{ id: taskId, driverId, companyId }`
   - Update: `{ status: 'ONGOING', actualStartTime: new Date(), currentLocation, updatedAt }`

2. **Attendance** - Validate driver has clocked in
   - Query: `{ employeeId: driverId, date: today, checkIn: { $ne: null }, pendingCheckout: true }`
   - Purpose: Ensure driver is clocked in before starting route

3. **ApprovedLocation** - Validate driver is at approved location
   - Query: `{ companyId, active: true, allowedForRouteStart: true }`
   - Purpose: Geofence validation for route start

**Response Data:**
```json
{
  "success": true,
  "message": "Task status updated successfully",
  "data": {
    "taskId": 101,
    "status": "ONGOING",
    "actualStartTime": "2026-02-11T07:00:00.000Z",
    "updatedAt": "2026-02-11T07:00:05.000Z"
  }
}
```

**Validation Rules:**
1. Task must be in "PLANNED" status
2. Driver must be clocked in (attendance record exists)
3. Driver must be at approved location (geofence validation)
4. Status transitions: PLANNED → ONGOING → PICKUP_COMPLETE → EN_ROUTE_DROPOFF → COMPLETED

**Error Responses:**
```json
// If task not in PLANNED status
{
  "success": false,
  "message": "Cannot start route. Task is currently in ONGOING status.",
  "error": "INVALID_STATUS_TRANSITION",
  "currentStatus": "ONGOING",
  "requiredStatus": "PLANNED"
}

// If driver not clocked in
{
  "success": false,
  "message": "Route start denied: You must clock in before starting a route",
  "error": "ATTENDANCE_REQUIRED",
  "details": {
    "message": "Please clock in first before starting your route."
  }
}

// If not at approved location
{
  "success": false,
  "message": "Route start denied: You must be at an approved location",
  "error": "ROUTE_START_LOCATION_NOT_APPROVED",
  "details": {
    "nearestLocation": "Main Depot",
    "distance": 150,
    "message": "You are 150m from Main Depot. Please move closer."
  }
}
```

**Data Flow:**
```
UI: "Start Route" Button Click
    ↓
API: PUT /api/driver/transport-tasks/:taskId/status
    Body: { status: "en_route_pickup", location, notes }
    ↓
Backend: updateTaskStatus()
    ↓
Validations:
    1. Check task.status === "PLANNED"
    2. Check Attendance.findOne() → Driver clocked in?
    3. Check ApprovedLocation + validateGeofence() → At approved location?
    ↓
If Valid:
    FleetTask.updateOne() → Set status="ONGOING", actualStartTime=now
    ↓
Response: { success: true, taskId, status, actualStartTime }
    ↓
UI: Navigate to route navigation screen
```

---

## 3. Route Navigation

### Screen: `RouteNavigationComponent.tsx`

### Button: "Get Worker Manifests"
**API Call:**
```
GET /api/driver/transport-tasks/:taskId/worker-manifests
```

**Backend Controller:** `driverController.getWorkerManifests()`

**Database Collections Accessed:**
1. **FleetTask** - Verify task belongs to driver
   - Query: `{ id: taskId, driverId, companyId }`

2. **FleetTaskPassenger** - Get all passengers for task
   - Query: `{ fleetTaskId: taskId }`
   - Fields: `workerEmployeeId, pickupLocation, dropLocation`

3. **Employee** - Get worker details
   - Query: `{ id: { $in: employeeIds }, companyId }`
   - Fields: `fullName, employeeId, department, phone, roomNumber`

4. **Attendance** (via MongoDB collection) - Check today's attendance
   - Query: `{ employeeId: { $in: employeeIds }, date: today, checkIn: { $ne: null } }`
   - Purpose: Determine which workers have checked in today

**Response Data:**
```json
{
  "success": true,
  "data": [
    {
      "workerId": 501,
      "workerName": "Ahmed Ali",
      "employeeId": "EMP-501",
      "department": "Construction",
      "contactNumber": "+971501234567",
      "roomNumber": "A-101",
      "status": "checked-in",
      "pickupLocation": "Dormitory A",
      "dropLocation": "Construction Site B"
    },
    {
      "workerId": 502,
      "workerName": "Mohammed Hassan",
      "employeeId": "EMP-502",
      "department": "Construction",
      "contactNumber": "+971501234568",
      "roomNumber": "A-102",
      "status": "Pending",
      "pickupLocation": "Dormitory A",
      "dropLocation": "Construction Site B"
    }
  ]
}
```

**Data Flow:**
```
UI: Load Worker Manifests
    ↓
API: GET /api/driver/transport-tasks/:taskId/worker-manifests
    ↓
Backend: getWorkerManifests()
    ↓
Database:
    1. FleetTask.findOne() → Verify task
    2. FleetTaskPassenger.find() → Get all passengers
    3. Employee.find() → Get worker details
    4. Attendance collection query → Check who's checked in today
    ↓
Response: Array of workers with check-in status
    ↓
UI: Display worker list with status badges
```

---

## 4. Worker Check-In

### Screen: `WorkerCheckInForm.tsx`

### Button: "Check In Worker"
**API Call:**
```
POST /api/driver/pickup-locations/:locationId/check-in
```

**Request Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "workerId": 501,
  "location": {
    "latitude": 25.2048,
    "longitude": 55.2708,
    "accuracy": 10,
    "timestamp": "2026-02-11T07:15:00.000Z"
  },
  "notes": "Worker boarded at Dormitory A"
}
```

**Backend Controller:** `driverController.checkInWorker()` (endpoint needs to be created)

**Database Collections Accessed:**
1. **FleetTaskPassenger** - Update pickup status
   - Query: `{ workerEmployeeId: workerId, fleetTaskId: taskId }`
   - Update: `{ pickupStatus: 'confirmed', pickupConfirmedAt: new Date() }`

2. **FleetTask** - Get task details
   - Query: `{ id: taskId }`
   - Purpose: Verify task and get project info

3. **Attendance** - Create/update attendance record
   - Query: `{ employeeId: workerId, date: today, projectId }`
   - Update/Insert: `{ checkIn: new Date(), insideGeofenceAtCheckin: true, lastLatitude, lastLongitude }`

**Response Data:**
```json
{
  "success": true,
  "message": "Worker checked in successfully",
  "data": {
    "workerId": 501,
    "workerName": "Ahmed Ali",
    "checkInTime": "2026-02-11T07:15:00.000Z",
    "location": {
      "latitude": 25.2048,
      "longitude": 55.2708
    },
    "pickupStatus": "confirmed"
  }
}
```

**Data Flow:**
```
UI: "Check In" Button for Worker
    ↓
API: POST /api/driver/pickup-locations/:locationId/check-in
    Body: { workerId, location, notes }
    ↓
Backend: checkInWorker()
    ↓
Database:
    1. FleetTaskPassenger.updateOne() → Set pickupStatus='confirmed'
    2. FleetTask.findOne() → Get task/project info
    3. Attendance.updateOne() → Record check-in time + GPS
    ↓
Response: { success: true, workerId, checkInTime }
    ↓
UI: Update worker status badge to "Checked In"
```

---

## 5. Pickup Completion

### Screen: `TransportTasksScreen.tsx`

### Button: "Complete Pickup"
**API Call:**
```
POST /api/driver/transport-tasks/:taskId/pickup-complete
```

**Request Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "multipart/form-data"
}
```

**Request Body (FormData):**
```
locationId: 1
workerCount: 25
photo: <File>
location: {"latitude": 25.2048, "longitude": 55.2708}
notes: "All workers picked up from Dormitory A"
```

**Backend Controller:** `driverController.confirmPickup()`

**Database Collections Accessed:**
1. **FleetTask** - Update task status
   - Query: `{ id: taskId, driverId, companyId }`
   - Update: `{ status: 'PICKUP_COMPLETE' or 'ENROUTE_DROPOFF', actualStartTime, updatedAt }`

2. **FleetTaskPassenger** - Check if all passengers picked up
   - Query: `{ fleetTaskId: taskId }`
   - Purpose: Determine if all pickups are complete

3. **Project** - Get project details for response
   - Query: `{ id: task.projectId }`

4. **FleetVehicle** - Get vehicle details for response
   - Query: `{ id: task.vehicleId }`

**Response Data:**
```json
{
  "success": true,
  "message": "Pickup confirmed successfully",
  "status": "PICKUP_COMPLETE",
  "task": {
    "_id": "507f1f77bcf86cd799439011",
    "id": 101,
    "projectName": "Tower Construction",
    "vehicleNo": "ABC-1234",
    "startTime": "2026-02-11T07:00:00.000Z",
    "endTime": "2026-02-11T08:00:00.000Z",
    "actualStartTime": "2026-02-11T07:00:00.000Z",
    "status": "PICKUP_COMPLETE",
    "pickupLocation": "Dormitory A",
    "dropLocation": "Construction Site B"
  },
  "updatedPassengers": [
    {
      "id": 1,
      "name": "Ahmed Ali",
      "pickupPoint": "Dormitory A",
      "pickupStatus": "confirmed",
      "dropStatus": "pending"
    }
  ]
}
```

**Data Flow:**
```
UI: "Complete Pickup" Button
    ↓
Validation: Check worker count, prompt for photo
    ↓
API: POST /api/driver/transport-tasks/:taskId/pickup-complete
    Body: FormData { locationId, workerCount, photo, location, notes }
    ↓
Backend: confirmPickup()
    ↓
Database:
    1. FleetTask.findOne() → Verify task
    2. FleetTaskPassenger.find() → Check all passengers
    3. Determine new status (PICKUP_COMPLETE or ENROUTE_DROPOFF)
    4. FleetTask.updateOne() → Update status + actualStartTime
    5. Project.findOne() → Get project name
    6. FleetVehicle.findOne() → Get vehicle details
    ↓
Response: { success: true, status, task, updatedPassengers }
    ↓
UI: Navigate to dropoff screen, show route to site
```

**Important Notes:**
- The endpoint does NOT automatically update individual passenger pickupStatus
- Individual workers should be checked in via the checkInWorker endpoint BEFORE completing pickup
- The pickup completion just changes the overall task status
- If using old format with confirmed/missed arrays, those passengers are updated

---

## 6. Dropoff Completion

### Screen: `TransportTasksScreen.tsx`

### Button: "Complete Dropoff"
**API Call:**
```
POST /api/driver/transport-tasks/:taskId/dropoff-complete
```

**Request Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "multipart/form-data"
}
```

**Request Body (FormData):**
```
workerCount: 25
workerIds: [501, 502, 503, ...]  // Optional: specific workers to drop
photo: <File>
location: {"latitude": 25.2048, "longitude": 55.2708}
notes: "All workers dropped at Construction Site B"
```

**Backend Controller:** `driverController.confirmDrop()`

**Database Collections Accessed:**
1. **FleetTask** - Update task to completed
   - Query: `{ id: taskId, driverId, companyId }`
   - Update: `{ status: 'COMPLETED', actualEndTime: new Date(), updatedAt }`

2. **FleetTaskPassenger** - Update drop status for workers
   - Query: `{ fleetTaskId: taskId, workerEmployeeId: { $in: workerIds } }`
   - Update: `{ dropStatus: 'confirmed', dropConfirmedAt: new Date() }`
   - Note: Only updates if workerIds provided, otherwise expects workers already checked out

3. **Project** - Get project details
   - Query: `{ id: task.projectId }`

4. **FleetVehicle** - Get vehicle details
   - Query: `{ id: task.vehicleId }`

**Response Data:**
```json
{
  "success": true,
  "message": "Drop-off confirmed successfully",
  "status": "COMPLETED",
  "task": {
    "_id": "507f1f77bcf86cd799439011",
    "id": 101,
    "projectName": "Tower Construction",
    "vehicleNo": "ABC-1234",
    "startTime": "2026-02-11T07:00:00.000Z",
    "endTime": "2026-02-11T08:00:00.000Z",
    "actualStartTime": "2026-02-11T07:00:00.000Z",
    "actualEndTime": "2026-02-11T08:30:00.000Z",
    "status": "COMPLETED",
    "pickupLocation": "Dormitory A",
    "dropLocation": "Construction Site B"
  },
  "updatedPassengers": [
    {
      "id": 1,
      "name": "Ahmed Ali",
      "pickupPoint": "Dormitory A",
      "pickupStatus": "confirmed",
      "dropStatus": "confirmed"
    }
  ]
}
```

**Data Flow:**
```
UI: "Complete Dropoff" Button
    ↓
Validation: Check worker count, prompt for photo
    ↓
API: POST /api/driver/transport-tasks/:taskId/dropoff-complete
    Body: FormData { workerCount, workerIds, photo, location, notes }
    ↓
Backend: confirmDrop()
    ↓
Database:
    1. FleetTask.findOne() → Verify task
    2. FleetTaskPassenger.find() → Get all passengers
    3. If workerIds provided:
       FleetTaskPassenger.updateMany() → Set dropStatus='confirmed'
    4. FleetTask.updateOne() → Set status='COMPLETED', actualEndTime=now
    5. Project.findOne() → Get project name
    6. FleetVehicle.findOne() → Get vehicle details
    ↓
Response: { success: true, status: "COMPLETED", task, updatedPassengers }
    ↓
UI: Show trip summary, navigate to dashboard
```

**Important Notes:**
- Three ways to handle dropoff:
  1. Send workerIds array - updates specific workers
  2. Workers already checked out via checkOutWorker endpoint - no update needed
  3. No workerIds and no checkouts - WARNING logged, no auto-update
- Completing dropoff enables workers to submit their own attendance
- Task status changes to COMPLETED
- actualEndTime is recorded

---

## 7. Attendance Screen

### Screen: `DriverAttendanceScreen.tsx`

### Button: "Clock In"
**API Call:**
```
POST /api/driver/attendance/clock-in
```

**Request Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "location": {
    "latitude": 25.2048,
    "longitude": 55.2708,
    "accuracy": 10
  },
  "timestamp": "2026-02-11T06:00:00.000Z"
}
```

**Backend Controller:** `driverController.clockIn()` (needs to be implemented)

**Database Collections Accessed:**
1. **Attendance** - Create attendance record
   - Insert: `{ 
       employeeId: driverId, 
       companyId, 
       date: today, 
       checkIn: new Date(), 
       pendingCheckout: true,
       insideGeofenceAtCheckin: true,
       lastLatitude, 
       lastLongitude 
     }`

2. **ApprovedLocation** - Validate geofence
   - Query: `{ companyId, active: true, allowedForAttendance: true }`
   - Purpose: Ensure driver is at approved location

**Response Data:**
```json
{
  "success": true,
  "message": "Clocked in successfully",
  "data": {
    "attendanceId": 1001,
    "employeeId": 123,
    "checkIn": "2026-02-11T06:00:00.000Z",
    "location": {
      "latitude": 25.2048,
      "longitude": 55.2708
    },
    "insideGeofence": true
  }
}
```

**Data Flow:**
```
UI: "Clock In" Button
    ↓
Get Current Location (GPS)
    ↓
API: POST /api/driver/attendance/clock-in
    Body: { location, timestamp }
    ↓
Backend: clockIn()
    ↓
Validations:
    1. Check if already clocked in today
    2. Validate geofence (ApprovedLocation)
    ↓
Database:
    Attendance.create() → New attendance record
    ↓
Response: { success: true, attendanceId, checkIn, location }
    ↓
UI: Show "Clocked In" status, display check-in time
```

---

### Button: "Clock Out"
**API Call:**
```
POST /api/driver/attendance/clock-out
```

**Request Body:**
```json
{
  "location": {
    "latitude": 25.2048,
    "longitude": 55.2708,
    "accuracy": 10
  },
  "timestamp": "2026-02-11T18:00:00.000Z"
}
```

**Backend Controller:** `driverController.clockOut()`

**Database Collections Accessed:**
1. **Attendance** - Update attendance record
   - Query: `{ employeeId: driverId, date: today, pendingCheckout: true }`
   - Update: `{ 
       checkOut: new Date(), 
       pendingCheckout: false,
       regularHours: calculated,
       insideGeofenceAtCheckout: true 
     }`

**Response Data:**
```json
{
  "success": true,
  "message": "Clocked out successfully",
  "data": {
    "attendanceId": 1001,
    "employeeId": 123,
    "checkIn": "2026-02-11T06:00:00.000Z",
    "checkOut": "2026-02-11T18:00:00.000Z",
    "regularHours": 12,
    "location": {
      "latitude": 25.2048,
      "longitude": 55.2708
    },
    "insideGeofence": true
  }
}
```

**Data Flow:**
```
UI: "Clock Out" Button
    ↓
Get Current Location (GPS)
    ↓
API: POST /api/driver/attendance/clock-out
    Body: { location, timestamp }
    ↓
Backend: clockOut()
    ↓
Database:
    1. Attendance.findOne() → Get today's attendance
    2. Calculate regularHours (checkOut - checkIn)
    3. Attendance.updateOne() → Set checkOut, regularHours, pendingCheckout=false
    ↓
Response: { success: true, checkOut, regularHours }
    ↓
UI: Show "Clocked Out" status, display total hours worked
```

---

## 8. Vehicle Info Screen

### Screen: `VehicleInfoScreen.tsx`

### Button: "Load Vehicle Details"
**API Call:**
```
GET /api/driver/vehicle/details
```

**Backend Controller:** `driverController.getVehicleDetails()`

**Database Collections Accessed:**
1. **FleetTask** - Get today's tasks to find assigned vehicle
   - Query: `{ driverId, companyId, taskDate: today }`
   - Purpose: Get vehicleId from first task

2. **FleetVehicle** - Get complete vehicle information
   - Query: `{ id: vehicleId }`
   - Fields: All vehicle details including:
     - registrationNo, vehicleType, capacity, fuelType
     - odometer, fuelLevel, status
     - insuranceExpiry, roadTaxExpiry, lastServiceDate
     - assignedRoute information

**Response Data:**
```json
{
  "success": true,
  "message": "Vehicle details retrieved successfully",
  "vehicle": {
    "id": 10,
    "plateNumber": "ABC-1234",
    "model": "Bus",
    "year": 2023,
    "vehicleCode": "VEH-010",
    "registrationNo": "ABC-1234",
    "vehicleType": "Bus",
    "capacity": 50,
    "fuelType": "Diesel",
    "currentMileage": 45000,
    "fuelLevel": 75,
    "status": "active",
    "assignedDriverName": "John Driver",
    "insurance": {
      "policyNumber": "INS-12345",
      "provider": "ABC Insurance",
      "expiryDate": "2026-12-31T00:00:00.000Z",
      "status": "active"
    },
    "roadTax": {
      "validUntil": "2026-12-31T00:00:00.000Z",
      "status": "active"
    },
    "insuranceExpiry": "2026-12-31T00:00:00.000Z",
    "lastServiceDate": "2026-01-15T00:00:00.000Z",
    "odometer": 45000,
    "assignedTasks": 3,
    "maintenanceSchedule": [],
    "fuelLog": [],
    "assignedRoute": {
      "routeName": "Dormitory A to Site B",
      "routeCode": "RT-001",
      "pickupLocations": [
        {
          "name": "Dormitory A",
          "address": "123 Dormitory Road",
          "coordinates": { "latitude": 25.2048, "longitude": 55.2708 }
        }
      ],
      "dropoffLocation": {
        "name": "Construction Site B",
        "address": "456 Site Road",
        "coordinates": { "latitude": 25.2148, "longitude": 55.2808 }
      },
      "estimatedDistance": 15.5,
      "estimatedDuration": 30
    }
  }
}
```

**Data Flow:**
```
UI: Load Vehicle Info Screen
    ↓
API: GET /api/driver/vehicle/details
    ↓
Backend: getVehicleDetails()
    ↓
Database:
    1. FleetTask.find() → Get today's tasks
    2. FleetVehicle.findOne() → Get vehicle details
    3. Calculate insurance/roadTax status
    ↓
Response: Complete vehicle information
    ↓
UI: Display vehicle card with:
    - Basic info (plate, model, capacity)
    - Fuel level gauge
    - Mileage display
    - Insurance/tax status badges
    - Maintenance alerts
```

---

### Button: "View Maintenance Alerts"
**API Call:**
```
GET /api/driver/vehicle/maintenance-alerts
```

**Backend Controller:** `driverController.getMaintenanceAlerts()`

**Database Collections Accessed:**
1. **FleetTask** - Get today's vehicle assignment
   - Query: `{ driverId, companyId, taskDate: today }`

2. **FleetVehicle** - Get vehicle maintenance data
   - Query: `{ id: vehicleId }`
   - Fields: insuranceExpiry, lastServiceDate, odometer

**Response Data:**
```json
{
  "success": true,
  "message": "Maintenance alerts retrieved successfully",
  "data": [
    {
      "id": 1,
      "vehicleId": 10,
      "type": "insurance",
      "title": "Insurance Renewal Due",
      "description": "Insurance expires in 25 days",
      "dueDate": "2026-03-08T00:00:00.000Z",
      "priority": "high",
      "status": "upcoming"
    },
    {
      "id": 2,
      "vehicleId": 10,
      "type": "service",
      "title": "Service Due Soon",
      "description": "Service due in 15 days",
      "dueDate": "2026-02-26T00:00:00.000Z",
      "priority": "medium",
      "status": "upcoming"
    },
    {
      "id": 3,
      "vehicleId": 10,
      "type": "service",
      "title": "Mileage Service Due",
      "description": "Service due in 450 km",
      "dueMileage": 50000,
      "priority": "medium",
      "status": "upcoming"
    }
  ]
}
```

**Alert Generation Logic:**
- Insurance: Check if expiry < 30 days (high), < 60 days (medium), or expired (critical)
- Service: Check if last service > 90 days ago
- Mileage: Check if odometer within 500km of next service milestone (every 10,000km)

**Data Flow:**
```
UI: "Maintenance Alerts" Button
    ↓
API: GET /api/driver/vehicle/maintenance-alerts
    ↓
Backend: getMaintenanceAlerts()
    ↓
Database:
    1. FleetTask.find() → Get vehicle assignment
    2. FleetVehicle.findOne() → Get maintenance data
    ↓
Calculate Alerts:
    - Check insurance expiry dates
    - Check last service date (90-day cycle)
    - Check odometer (10,000km service intervals)
    ↓
Response: Array of maintenance alerts
    ↓
UI: Display alert cards with priority badges
```

---

## 9. Trip History

### Screen: `TransportTasksScreen.tsx` (History Tab)

### Button: "Load Trip History"
**API Call:**
```
GET /api/driver/trip-history?startDate=2026-02-04&endDate=2026-02-11
```

**Backend Controller:** `driverController.getTripHistory()`

**Database Collections Accessed:**
1. **FleetTask** - Get completed trips in date range
   - Query: `{ 
       status: 'COMPLETED', 
       driverId, 
       companyId, 
       taskDate: { $gte: startDate, $lte: endDate } 
     }`
   - Sort: `{ taskDate: -1 }` (newest first)

2. **Project** - Get project names
   - Query: `{ id: { $in: projectIds } }`

3. **FleetVehicle** - Get vehicle details
   - Query: `{ id: { $in: vehicleIds } }`

4. **FleetTaskPassenger** - Count passengers per trip
   - Aggregation: Group by fleetTaskId, count passengers

**Response Data:**
```json
{
  "success": true,
  "message": "Found 15 trips",
  "trips": [
    {
      "taskId": 101,
      "projectName": "Tower Construction",
      "startTime": "2026-02-11T07:00:00.000Z",
      "endTime": "2026-02-11T08:00:00.000Z",
      "actualStartTime": "2026-02-11T07:00:00.000Z",
      "actualEndTime": "2026-02-11T08:30:00.000Z",
      "vehicleNumber": "ABC-1234",
      "passengers": 25,
      "status": "COMPLETED",
      "pickupLocation": "Dormitory A",
      "dropLocation": "Construction Site B",
      "taskDate": "2026-02-11T00:00:00.000Z"
    }
  ]
}
```

**Data Flow:**
```
UI: Select Date Range, Load History
    ↓
API: GET /api/driver/trip-history?startDate=...&endDate=...
    ↓
Backend: getTripHistory()
    ↓
Database:
    1. FleetTask.find() → Get completed trips (sorted by date)
    2. Project.find() → Get project names
    3. FleetVehicle.find() → Get vehicle details
    4. FleetTaskPassenger.aggregate() → Count passengers
    ↓
Response: Array of completed trips
    ↓
UI: Display trip history list with:
    - Date, project, route
    - Actual times vs planned times
    - Passenger count
    - Status badge
```

---

## 10. Profile Screen

### Screen: `DriverProfileScreen.tsx`

### Button: "Load Profile"
**API Call:**
```
GET /api/driver/profile
```

**Backend Controller:** `driverController.getDriverProfile()`

**Database Collections Accessed:**
1. **Company** - Get company details
   - Query: `{ id: companyId }`
   - Fields: `name`

2. **User** - Get user account details
   - Query: `{ id: driverId }`
   - Fields: `email, phone`

3. **Driver** - Get driver-specific details
   - Query: `{ id: driverId }`
   - Fields: `employeeName, licenseNo, licenseClass, licenseExpiry, status`

4. **Employee** - Get employee details
   - Query: `{ id: driverId }`
   - Fields: `fullName, phone, photoUrl, emergencyContact, certifications`

5. **FleetVehicle** - Get assigned vehicles
   - Query: `{ driverId, companyId }`
   - Fields: `id, registrationNo, model, isPrimary`

6. **FleetTask** - Calculate performance metrics
   - Aggregation: Count completed trips, calculate on-time performance

**Response Data:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "name": "John Driver",
      "email": "john.driver@company.com",
      "phone": "+971501234567",
      "profileImage": "/uploads/drivers/photo.jpg",
      "employeeId": "EMP-123",
      "companyName": "ABC Construction",
      "employmentStatus": "ACTIVE"
    },
    "driverInfo": {
      "licenseNumber": "DL-123456",
      "licenseClass": "Commercial",
      "licenseIssueDate": "2020-01-15T00:00:00.000Z",
      "licenseExpiry": "2027-01-15T00:00:00.000Z",
      "licenseIssuingAuthority": "Transport Authority",
      "licensePhoto