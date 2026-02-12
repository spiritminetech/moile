# How the Driver Route Start System Works - Step by Step

## Real User Flow (What Actually Happens)

---

## Step 1: Driver Opens Mobile App

**Screen**: Login Screen

**What happens:**
1. Driver enters username and password
2. App sends credentials to backend
3. Backend validates and returns JWT token
4. App stores token and navigates to Dashboard

**No database changes yet**

---

## Step 2: Driver Clocks In

**Screen**: Driver Attendance Screen

### What Driver Sees:
- "Clock In" button
- Current date and time
- Vehicle assignment info

### What Driver Does:
1. Clicks "Clock In" button
2. System asks for GPS permission (if not granted)
3. Pre-check modal appears:
   - ☐ Vehicle pre-check completed
   - Optional: Enter mileage reading
4. Driver checks the box
5. Driver clicks "Clock In" in modal

### What Happens Behind the Scenes:

**Mobile App:**
```javascript
// 1. Get current GPS location
const location = {
  latitude: 1.3521,
  longitude: 103.8198
};

// 2. Make API call
POST /api/v1/driver/attendance/clock-in
Body: {
  vehicleId: 5,
  location: { latitude: 1.3521, longitude: 103.8198 },
  preCheckCompleted: true,
  mileageReading: 45000
}
```

**Backend (driverController.js - clockInDriver function):**
```javascript
// 1. Get driver info from JWT token
const driverId = 50;  // From req.user.id
const companyId = 1;  // From req.user.companyId

// 2. Validate vehicle exists
const vehicle = await FleetVehicle.findOne({
  id: 5,
  companyId: 1
});
// Returns: { id: 5, registrationNo: "SBA1234X", vehicleType: "Van" }

// 3. Check if already clocked in today
const existingAttendance = await Attendance.findOne({
  employeeId: 50,
  date: { $gte: startOfDay, $lte: endOfDay }
});
// Returns: null (not clocked in yet)

// 4. Create attendance record
const attendance = new Attendance({
  id: 1234,
  employeeId: 50,
  projectId: 0,
  date: startOfDay,
  checkIn: new Date(),  // 2024-11-20T06:30:15Z
  checkOut: null,
  status: "present",
  pendingCheckout: true,
  lastLatitude: 1.3521,
  lastLongitude: 103.8198
});
await attendance.save();

// 5. Count today's tasks
const todayTasks = await FleetTask.countDocuments({
  driverId: 50,
  companyId: 1,
  plannedPickupTime: { $gte: startOfDay, $lte: endOfDay }
});
// Returns: 2
```

**Database Entry Created:**
```javascript
// Collection: attendance
{
  id: 1234,
  employeeId: 50,
  projectId: 0,
  date: ISODate("2024-11-20T00:00:00Z"),
  checkIn: ISODate("2024-11-20T06:30:15Z"),  // ✅ Logged in with timestamp
  checkOut: null,
  status: "present",
  pendingCheckout: true,
  lastLatitude: 1.3521,                       // ✅ GPS stored
  lastLongitude: 103.8198,                    // ✅ GPS stored
  regularHours: 0,
  overtimeHours: 0,
  absenceReason: "PRESENT",
  createdAt: ISODate("2024-11-20T06:30:15Z")
}
```

**Response to Mobile App:**
```javascript
{
  success: true,
  message: "Clock in successful",
  data: {
    checkInTime: "2024-11-20T06:30:15.000Z",
    session: "CHECKED_IN",
    vehicleAssigned: {
      id: 5,
      plateNumber: "SBA1234X",
      model: "Van"
    },
    todayTasks: 2,
    attendanceId: 1234
  }
}
```

### What Driver Sees:
- ✅ Success message: "Clock in successful"
- Green status badge: "🟢 Checked In"
- Vehicle info: SBA1234X (Van)
- Today's tasks: 2

---

## Step 3: Driver Views Today's Tasks

**Screen**: Driver Dashboard or Transport Tasks Screen

### What Driver Sees:
- List of today's transport tasks
- Each task shows:
  - Route: "Worker Dormitory A → Construction Site A"
  - Status: "Pending" (yellow badge)
  - Time: "07:00 AM - 08:00 AM"
  - Vehicle: "SBA1234X"
  - Workers: "0/8 checked in"
  - "Start Route" button

### What Happens Behind the Scenes:

**Mobile App:**
```javascript
// Make API call
GET /api/v1/driver/transport-tasks
```

**Backend (driverController.js - getTodaysTasks function):**
```javascript
// 1. Get driver info
const driverId = 50;
const companyId = 1;

// 2. Get today's date range
const startOfDay = ISODate("2024-11-20T00:00:00Z");
const endOfDay = ISODate("2024-11-20T23:59:59Z");

// 3. Find today's tasks
const tasks = await FleetTask.find({
  driverId: 50,
  companyId: 1,
  taskDate: { $gte: startOfDay, $lte: endOfDay }
});
// Returns: [
//   { id: 101, status: "PLANNED", vehicleId: 5, ... },
//   { id: 102, status: "PLANNED", vehicleId: 5, ... }
// ]

// 4. Get vehicle details
const vehicles = await FleetVehicle.find({
  id: { $in: [5] }
});
// Returns: [{ id: 5, registrationNo: "SBA1234X", vehicleType: "Van" }]

// 5. Get passenger counts
const passengerCounts = await FleetTaskPassenger.aggregate([
  { $match: { fleetTaskId: { $in: [101, 102] } } },
  { $group: { _id: "$fleetTaskId", count: { $sum: 1 } } }
]);
// Returns: [{ _id: 101, count: 8 }, { _id: 102, count: 6 }]

// 6. Get checked-in worker counts
const checkedInCounts = await FleetTaskPassenger.aggregate([
  { $match: { fleetTaskId: { $in: [101, 102] } } },
  // ... complex aggregation with attendance lookup
]);
// Returns: [{ _id: 101, count: 0 }, { _id: 102, count: 0 }]
```

**Database Entries Read:**
```javascript
// Collection: fleetTasks
{
  id: 101,
  companyId: 1,
  projectId: 10,
  driverId: 50,                    // ✅ Assigned to this driver
  vehicleId: 5,                    // ✅ Assigned vehicle
  taskDate: ISODate("2024-11-20"),
  plannedPickupTime: ISODate("2024-11-20T07:00:00Z"),
  plannedDropTime: ISODate("2024-11-20T08:00:00Z"),
  pickupLocation: "Worker Dormitory A",
  dropLocation: "Construction Site A",
  expectedPassengers: 8,
  actualStartTime: null,           // ✅ Not started yet
  status: "PLANNED",               // ✅ "Not Started" status
  createdAt: ISODate("2024-11-19T10:00:00Z")
}

// Collection: fleetVehicles
{
  id: 5,
  registrationNo: "SBA1234X",      // ✅ Vehicle plate number
  vehicleType: "Van",              // ✅ Vehicle type
  assignedDriverId: 50,            // ✅ Confirms driver assignment
  status: "AVAILABLE"
}

// Collection: drivers
{
  id: 50,
  vehicleId: 5,                    // ✅ Driver's assigned vehicle
  employeeName: "John Driver",
  status: "ACTIVE"
}
```

**Response to Mobile App:**
```javascript
{
  success: true,
  data: [
    {
      taskId: 101,
      route: "Worker Dormitory A → Construction Site A",
      status: "PLANNED",           // Backend status
      totalWorkers: 8,
      checkedInWorkers: 0,
      startTime: "07:00 AM",
      endTime: "08:00 AM",
      vehicleNumber: "SBA1234X",   // From fleetVehicles
      pickupLocation: "Worker Dormitory A",
      dropLocation: "Construction Site A"
    },
    {
      taskId: 102,
      route: "Worker Dormitory B → Construction Site B",
      status: "PLANNED",
      totalWorkers: 6,
      checkedInWorkers: 0,
      startTime: "07:30 AM",
      endTime: "08:30 AM",
      vehicleNumber: "SBA1234X",
      pickupLocation: "Worker Dormitory B",
      dropLocation: "Construction Site B"
    }
  ]
}
```

**Mobile App Transforms Status:**
```javascript
// Backend "PLANNED" → Frontend "pending"
const frontendStatus = "pending";  // Displayed as "Pending" with yellow badge
```

---

## Step 4: Driver Clicks "Start Route"

**Screen**: Transport Tasks Screen or Dashboard

### What Driver Sees:
- Task card with "Start Route" button
- Clicks the button
- Confirmation dialog appears:
  - "Are you sure you want to start route 'Worker Dormitory A → Construction Site A'?"
  - [Cancel] [Start]
- Driver clicks "Start"

### What Happens Behind the Scenes:

**Mobile App (DriverDashboard.tsx - handleStartRoute function):**
```javascript
// 1. Get current location
const location = {
  latitude: 1.3521,
  longitude: 103.8198
};

// 2. Make API call
PUT /api/v1/driver/transport-tasks/101/status
Body: {
  status: "en_route_pickup",  // Frontend status
  location: { latitude: 1.3521, longitude: 103.8198 },
  notes: "Route started from dashboard"
}
```

**Backend (driverController.js - updateTaskStatus function):**
```javascript
// 1. Get driver info
const driverId = 50;
const companyId = 1;
const taskId = 101;

// 2. Map frontend status to backend status
const statusMap = {
  'pending': 'PLANNED',
  'en_route_pickup': 'ONGOING',
  'pickup_complete': 'PICKUP_COMPLETE',
  'en_route_dropoff': 'EN_ROUTE_DROPOFF',
  'completed': 'COMPLETED'
};
const backendStatus = statusMap['en_route_pickup'];  // "ONGOING"

// 3. Find the task
const task = await FleetTask.findOne({
  id: 101,
  driverId: 50,
  companyId: 1
});
// Returns: { id: 101, status: "PLANNED", ... }

// 4. ⚠️ NO VALIDATION HERE - Should check if status is "PLANNED"

// 5. Update the task
task.status = "ONGOING";
task.currentLocation = {
  latitude: 1.3521,
  longitude: 103.8198,
  timestamp: new Date()
};
task.notes = "Route started from dashboard";
task.updatedAt = new Date();
await task.save();
```

**Database Entry Updated:**
```javascript
// Collection: fleetTasks
// BEFORE:
{
  id: 101,
  status: "PLANNED",
  actualStartTime: null,
  updatedAt: ISODate("2024-11-19T10:00:00Z")
}

// AFTER:
{
  id: 101,
  status: "ONGOING",              // ✅ Changed from "PLANNED"
  actualStartTime: null,          // ⚠️ Not set automatically
  currentLocation: {
    latitude: 1.3521,
    longitude: 103.8198,
    timestamp: ISODate("2024-11-20T06:45:00Z")
  },
  notes: "Route started from dashboard",
  updatedAt: ISODate("2024-11-20T06:45:00Z")  // ✅ Updated
}
```

**Response to Mobile App:**
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

### What Driver Sees:
- ✅ Success alert: "Route started successfully!"
- Task status changes from "Pending" to "En Route to Pickup"
- Status badge changes from yellow to blue
- "Start Route" button disappears
- New buttons appear: "Confirm Pickup", "Report Delay"

---

## Step 5: Driver Navigates to Pickup Location

**Screen**: Route Navigation Component

### What Driver Sees:
- Map showing route to pickup location
- Current location marker (blue dot)
- Pickup location marker (green pin)
- Distance and ETA
- "Open in Google Maps" button
- Worker list (8 workers to pick up)

### What Happens:
- GPS continuously updates driver's location
- App calculates distance to pickup
- No database changes during navigation

---

## Step 6: Driver Arrives and Confirms Pickup

**Screen**: Worker Check-In Screen

### What Driver Does:
1. Arrives at pickup location
2. Workers board the vehicle
3. Driver marks workers as checked in (tap checkboxes)
4. Driver clicks "Confirm Pickup"

### What Happens Behind the Scenes:

**Mobile App:**
```javascript
POST /api/v1/driver/transport-tasks/101/pickup-complete
Body: {
  locationId: 1001,
  workerCount: 8,
  location: { latitude: 1.3621, longitude: 103.8298 }
}
```

**Backend (driverController.js - confirmPickup function):**
```javascript
// 1. Find the task
const task = await FleetTask.findOne({
  id: 101,
  driverId: 50
});

// 2. Update passengers as confirmed
await FleetTaskPassenger.updateMany(
  { fleetTaskId: 101, pickupPoint: "1001" },
  {
    $set: {
      pickupStatus: "confirmed",
      pickupConfirmedAt: new Date()
    }
  }
);

// 3. Update task status
await FleetTask.updateOne(
  { id: 101 },
  {
    $set: {
      status: "PICKUP_COMPLETE",
      actualStartTime: task.actualStartTime || new Date(),
      updatedAt: new Date()
    }
  }
);
```

**Database Entries Updated:**
```javascript
// Collection: fleetTasks
{
  id: 101,
  status: "PICKUP_COMPLETE",      // Changed from "ONGOING"
  actualStartTime: ISODate("2024-11-20T06:45:00Z"),
  updatedAt: ISODate("2024-11-20T07:05:00Z")
}

// Collection: fleetTaskPassengers
// 8 records updated:
{
  id: 5001,
  fleetTaskId: 101,
  workerEmployeeId: 201,
  pickupStatus: "confirmed",      // Changed from null
  pickupConfirmedAt: ISODate("2024-11-20T07:05:00Z")
}
// ... 7 more similar records
```

---

## Summary: Complete Data Flow

### Collections Involved:

1. **`attendance`** - Stores driver clock-in with GPS
   - Created when: Driver clocks in
   - Key fields: `checkIn`, `lastLatitude`, `lastLongitude`

2. **`drivers`** - Stores driver profile and vehicle assignment
   - Read when: Fetching driver info
   - Key field: `vehicleId`

3. **`fleetVehicles`** - Stores vehicle details
   - Read when: Validating vehicle, displaying vehicle info
   - Key fields: `registrationNo`, `vehicleType`, `assignedDriverId`

4. **`fleetTasks`** - Stores transport task details and status
   - Read when: Fetching today's tasks
   - Updated when: Starting route, confirming pickup
   - Key fields: `status`, `actualStartTime`, `driverId`, `vehicleId`

5. **`fleetTaskPassengers`** - Stores worker assignments to tasks
   - Read when: Counting workers
   - Updated when: Confirming pickup

---

## What's Working vs What's Missing

### ✅ Working:
1. Driver can clock in → GPS and timestamp stored in `attendance`
2. Driver can view tasks → Vehicle assignment shown from `drivers` + `fleetVehicles`
3. Driver can see task status → Status shown from `fleetTasks.status`
4. Driver can start route → Status updated in `fleetTasks`

### ❌ Missing:
1. **No geofence validation** - Driver can clock in from anywhere
2. **No status validation** - Driver can start a task that's already started
3. **No pre-start validation endpoint** - No single check for all requirements

### ⚠️ Partial:
1. Vehicle assignment works but no strict validation
2. Task status exists but no transition rules enforced
