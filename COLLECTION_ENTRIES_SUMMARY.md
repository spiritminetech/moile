# Collection Entries - Route Start Requirements

## Quick Answer: Which Collection Entries Appear

---

## Requirement: "Vehicle assignment must be confirmed"

### Collection 1: `drivers`
**Entry that appears:**
```javascript
{
  id: 50,
  companyId: 1,
  employeeId: 50,
  employeeName: "John Driver",
  vehicleId: 5,              // ← THIS FIELD confirms vehicle assignment
  status: "ACTIVE"
}
```

### Collection 2: `fleetVehicles`
**Entry that appears:**
```javascript
{
  id: 5,                     // ← Matches drivers.vehicleId
  companyId: 1,
  registrationNo: "SBA1234X",
  vehicleType: "Van",
  assignedDriverId: 50,      // ← THIS FIELD confirms driver assignment
  status: "AVAILABLE"
}
```

**How it's confirmed:**
- `drivers.vehicleId` (5) matches `fleetVehicles.id` (5)
- `fleetVehicles.assignedDriverId` (50) matches `drivers.id` (50)
- Both entries must exist for vehicle assignment to be confirmed

---

## Requirement: "Transport task must be in 'Not Started' status"

### Collection: `fleetTasks`
**Entry that appears (BEFORE route starts):**
```javascript
{
  id: 101,
  companyId: 1,
  projectId: 10,
  driverId: 50,
  vehicleId: 5,
  taskDate: ISODate("2024-11-20"),
  status: "PLANNED",         // ← THIS IS "Not Started" status
  actualStartTime: null,     // ← NULL means not started yet
  actualEndTime: null,
  pickupLocation: "Worker Dormitory A",
  dropLocation: "Construction Site A",
  expectedPassengers: 8
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
  status: "ONGOING",                              // ← Changed from "PLANNED"
  actualStartTime: ISODate("2024-11-20T06:45Z"), // ← Now has timestamp
  actualEndTime: null,
  pickupLocation: "Worker Dormitory A",
  dropLocation: "Construction Site A",
  expectedPassengers: 8
}
```

**Status values:**
- `"PLANNED"` = Not Started ✅ (can start route)
- `"ONGOING"` = Route started (cannot start again)
- `"PICKUP_COMPLETE"` = Pickup done
- `"EN_ROUTE_DROPOFF"` = Going to dropoff
- `"COMPLETED"` = Trip finished
- `"CANCELLED"` = Trip cancelled

---

## Summary Table

| Requirement | Collection | Field Name | Value When Working |
|------------|-----------|-----------|-------------------|
| Vehicle Assignment | `drivers` | `vehicleId` | `5` (vehicle ID) |
| Vehicle Assignment | `fleetVehicles` | `id` | `5` (matches driver's vehicleId) |
| Vehicle Assignment | `fleetVehicles` | `assignedDriverId` | `50` (driver ID) |
| Task Not Started | `fleetTasks` | `status` | `"PLANNED"` |
| Task Not Started | `fleetTasks` | `actualStartTime` | `null` |

---

## How to Check in MongoDB

### Check Vehicle Assignment:
```javascript
// Find driver's assigned vehicle
db.drivers.findOne({ id: 50 })
// Returns: { vehicleId: 5, ... }

// Find vehicle details
db.fleetVehicles.findOne({ id: 5 })
// Returns: { registrationNo: "SBA1234X", assignedDriverId: 50, ... }
```

### Check Task Status:
```javascript
// Find today's tasks for driver
db.fleetTasks.find({ 
  driverId: 50, 
  status: "PLANNED"  // Only "Not Started" tasks
})
// Returns: { id: 101, status: "PLANNED", actualStartTime: null, ... }
```

---

## Real Example from Your System

When driver ID 50 logs in and views tasks:

**Step 1: System queries `drivers` collection**
```javascript
db.drivers.findOne({ id: 50 })
```
**Returns:**
```javascript
{
  id: 50,
  vehicleId: 5,  // ✅ Vehicle assigned
  employeeName: "John Driver"
}
```

**Step 2: System queries `fleetVehicles` collection**
```javascript
db.fleetVehicles.findOne({ id: 5 })
```
**Returns:**
```javascript
{
  id: 5,
  registrationNo: "SBA1234X",  // ✅ Plate number
  vehicleType: "Van",          // ✅ Vehicle type
  assignedDriverId: 50         // ✅ Confirms assignment
}
```

**Step 3: System queries `fleetTasks` collection**
```javascript
db.fleetTasks.find({ 
  driverId: 50, 
  taskDate: { $gte: startOfDay, $lte: endOfDay }
})
```
**Returns:**
```javascript
{
  id: 101,
  driverId: 50,
  vehicleId: 5,
  status: "PLANNED",        // ✅ Not Started
  actualStartTime: null,    // ✅ Confirms not started
  pickupLocation: "Worker Dormitory A",
  dropLocation: "Construction Site A"
}
```

**Mobile app displays:**
- Vehicle: SBA1234X (Van) ✅
- Task 101: Status "Pending" (PLANNED) ✅
- Can start route: YES ✅

---

## What Happens When Route Starts

**API Call:** `PUT /api/v1/driver/transport-tasks/101/status`

**Database Update:**
```javascript
db.fleetTasks.updateOne(
  { id: 101 },
  { 
    $set: { 
      status: "ONGOING",                    // Changed from "PLANNED"
      actualStartTime: new Date(),          // Set timestamp
      updatedAt: new Date()
    }
  }
)
```

**Result in `fleetTasks` collection:**
```javascript
{
  id: 101,
  status: "ONGOING",                        // ✅ Updated
  actualStartTime: ISODate("2024-11-20T06:45:00Z")  // ✅ Set
}
```

Now the task is no longer in "Not Started" status.
