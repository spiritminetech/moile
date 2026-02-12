# Trip Data Storage - Where Data is Stored When "Start Route" is Clicked

## Overview
When a driver clicks "Start Route" in the mobile app, the trip data is stored in the **MongoDB database** in the **`fleetTasks`** collection.

---

## 📊 Database Collection: `fleetTasks`

### Collection Name
```
fleetTasks
```

### Model/Schema
```javascript
FleetTask (moile/backend/src/modules/fleetTask/models/FleetTask.js)
```

---

## 📝 Data Stored When "Start Route" is Clicked

### 1. **Status Update**
```javascript
{
  status: "ONGOING"  // Changed from "PLANNED" to "ONGOING"
}
```

### 2. **Actual Start Time** (Trip Start Timestamp)
```javascript
{
  actualStartTime: new Date()  // Exact timestamp when route started
}
```

### 3. **Current Location** (GPS Coordinates)
```javascript
{
  currentLocation: {
    latitude: 13.123456,
    longitude: 77.654321,
    timestamp: new Date()
  }
}
```

### 4. **Notes** (Optional)
```javascript
{
  notes: "Route started from dashboard"
}
```

### 5. **Updated Timestamp**
```javascript
{
  updatedAt: new Date()  // Last update timestamp
}
```

---

## 🗂️ Complete FleetTask Document Structure

When a trip is active, the document in `fleetTasks` collection looks like this:

```javascript
{
  _id: ObjectId("..."),
  id: 123,  // Task ID
  companyId: 1,
  projectId: 1,
  driverId: 50,  // Driver's employee ID
  vehicleId: 10,
  taskDate: ISODate("2026-02-11T00:00:00.000Z"),
  
  // Pickup Information
  plannedPickupTime: ISODate("2026-02-11T06:00:00.000Z"),
  pickupLocation: "Worker Camp A",
  pickupAddress: "123 Main St, Bangalore",
  
  // Dropoff Information
  plannedDropTime: ISODate("2026-02-11T07:00:00.000Z"),
  dropLocation: "Construction Site B",
  dropAddress: "456 Site Rd, Bangalore",
  
  // Passenger Information
  expectedPassengers: 25,
  
  // ✅ TRIP START DATA (Set when "Start Route" is clicked)
  actualStartTime: ISODate("2026-02-11T06:05:30.000Z"),  // Trip start time
  status: "ONGOING",  // Status changed from PLANNED
  currentLocation: {
    latitude: 13.123456,
    longitude: 77.654321,
    timestamp: ISODate("2026-02-11T06:05:30.000Z")
  },
  notes: "Route started from dashboard",
  
  // Trip End Data (Set when trip is completed)
  actualEndTime: null,  // Will be set when trip completes
  
  // Route Tracking
  routeLog: [],  // Array of location updates during trip
  
  // Metadata
  createdBy: 1,
  createdAt: ISODate("2026-02-10T10:00:00.000Z"),
  updatedAt: ISODate("2026-02-11T06:05:30.000Z")  // Updated when route starts
}
```

---

## 🔄 Status Flow in Database

```
PLANNED (Initial)
   ↓ (Click "Start Route")
ONGOING (Route started - actualStartTime recorded)
   ↓ (Arrive at pickup)
PICKUP_COMPLETE (Workers picked up)
   ↓ (Start driving to site)
EN_ROUTE_DROPOFF (Heading to dropoff)
   ↓ (Arrive at site)
COMPLETED (Trip finished - actualEndTime recorded)
```

---

## 📍 Related Collections

### 1. **`fleetTaskPassengers`** Collection
Stores worker/passenger information for each trip:
```javascript
{
  _id: ObjectId("..."),
  id: 456,
  fleetTaskId: 123,  // Links to fleetTasks
  employeeId: 107,  // Worker ID
  companyId: 1,
  status: "ASSIGNED",  // Changes to "CHECKED_IN" when worker boards
  checkInTime: null,  // Set when worker checks in
  checkInLocation: null,
  checkOutTime: null,
  checkOutLocation: null,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### 2. **`attendances`** Collection
Driver must be clocked in before starting route:
```javascript
{
  _id: ObjectId("..."),
  employeeId: 50,  // Driver ID
  companyId: 1,
  projectId: 1,
  date: ISODate("2026-02-11T00:00:00.000Z"),
  checkIn: ISODate("2026-02-11T05:30:00.000Z"),  // Driver clocked in
  pendingCheckout: true,
  // ... other attendance fields
}
```

### 3. **`fleetVehicles`** Collection
Vehicle information:
```javascript
{
  _id: ObjectId("..."),
  id: 10,
  companyId: 1,
  registrationNo: "KA01AB1234",
  vehicleType: "Bus",
  capacity: 30,
  // ... other vehicle fields
}
```

---

## 🔐 Validations Before Route Start

Before allowing route start, the backend validates:

### 1. **Driver Attendance Check**
```javascript
// Driver must be clocked in today
const attendance = await Attendance.findOne({
  employeeId: driverId,
  date: { $gte: today, $lte: endOfDay },
  checkIn: { $ne: null },
  pendingCheckout: true
});
```

### 2. **Status Validation**
```javascript
// Task must be in PLANNED status
if (task.status !== 'PLANNED') {
  return error: 'Cannot start route. Task must be in PLANNED status'
}
```

### 3. **Location Validation** (Optional)
```javascript
// Driver must be at approved location (if configured)
const approvedLocations = await ApprovedLocation.find({
  companyId,
  active: true,
  allowedForRouteStart: true
});
```

---

## 📱 Mobile App → Backend → Database Flow

```
1. Driver clicks "Start Route" button
   ↓
2. Mobile app calls API:
   PUT /api/driver/transport-tasks/:taskId/status
   Body: {
     status: "en_route_pickup",
     location: { latitude, longitude, timestamp },
     notes: "Route started from dashboard"
   }
   ↓
3. Backend validates:
   - Driver is clocked in (attendances collection)
   - Task is in PLANNED status (fleetTasks collection)
   - Driver is at approved location (optional)
   ↓
4. Backend updates fleetTasks collection:
   - status: "PLANNED" → "ONGOING"
   - actualStartTime: new Date()
   - currentLocation: { lat, lng, timestamp }
   - updatedAt: new Date()
   ↓
5. Backend returns success response:
   {
     success: true,
     data: {
       taskId: 123,
       status: "ONGOING",
       actualStartTime: "2026-02-11T06:05:30.000Z",
       updatedAt: "2026-02-11T06:05:30.000Z"
     }
   }
   ↓
6. Mobile app updates UI:
   - Shows "Active Trip Tracking" card
   - Displays trip ID, start time, GPS status
   - Starts background location tracking
```

---

## 🔍 How to Query Trip Data

### Find Active Trips for a Driver
```javascript
db.fleetTasks.find({
  driverId: 50,
  status: "ONGOING",
  taskDate: { $gte: new Date("2026-02-11"), $lt: new Date("2026-02-12") }
})
```

### Find Trip by Task ID
```javascript
db.fleetTasks.findOne({
  id: 123
})
```

### Find All Trips Started Today
```javascript
db.fleetTasks.find({
  actualStartTime: {
    $gte: new Date("2026-02-11T00:00:00.000Z"),
    $lt: new Date("2026-02-12T00:00:00.000Z")
  }
})
```

### Find Completed Trips
```javascript
db.fleetTasks.find({
  status: "COMPLETED",
  actualEndTime: { $ne: null }
})
```

---

## 📊 Summary Table

| Data Field | Stored In | Collection | When Set |
|------------|-----------|------------|----------|
| Trip ID | `id` | `fleetTasks` | When task is created |
| Start Time | `actualStartTime` | `fleetTasks` | When "Start Route" clicked |
| Start Location | `currentLocation` | `fleetTasks` | When "Start Route" clicked |
| Status | `status` | `fleetTasks` | Changes from PLANNED → ONGOING |
| Driver ID | `driverId` | `fleetTasks` | When task is assigned |
| Vehicle ID | `vehicleId` | `fleetTasks` | When task is created |
| Passengers | `expectedPassengers` | `fleetTasks` | When task is created |
| Worker List | Multiple docs | `fleetTaskPassengers` | When workers assigned |
| Driver Attendance | Check-in time | `attendances` | When driver clocks in |
| End Time | `actualEndTime` | `fleetTasks` | When trip is completed |

---

## 🎯 Key Points

1. **Main Collection**: `fleetTasks` stores all trip data
2. **Trip Start Trigger**: Clicking "Start Route" updates `status` and sets `actualStartTime`
3. **GPS Location**: Stored in `currentLocation` field with coordinates and timestamp
4. **Trip ID**: The `id` field in `fleetTasks` document (e.g., 123)
5. **Mobile App Trip ID**: Generated as `TRIP-{taskId}-{timestamp}` for display only
6. **Database Trip ID**: The actual `id` field in the document
7. **Status Tracking**: `status` field tracks trip progress through workflow
8. **Location Updates**: Can be stored in `routeLog` array during trip
9. **Worker Check-ins**: Stored in `fleetTaskPassengers` collection
10. **Driver Attendance**: Must exist in `attendances` collection before route start

---

## 🔗 API Endpoint

```
PUT /api/driver/transport-tasks/:taskId/status
```

**Controller**: `moile/backend/src/modules/driver/driverController.js`
**Function**: `updateTaskStatus`
**Route**: `moile/backend/src/modules/driver/driverRoutes.js`

---

**Last Updated**: February 11, 2026
**Database**: MongoDB
**Collection**: `fleetTasks`
**Model**: `FleetTask`
