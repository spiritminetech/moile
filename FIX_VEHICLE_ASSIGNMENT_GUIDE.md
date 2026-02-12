# Fix Vehicle Assignment Issues - Step by Step Guide

## Issues Found in Your Data

### Issue 1: Vehicle Missing Driver Assignment
**Collection:** `fleetVehicles` (id: 1)
**Problem:** No `assignedDriverId` field

```json
{
  "id": 1,
  "registrationNo": "ABC123",
  // ❌ Missing: "assignedDriverId": 50
  // ❌ Missing: "assignedDriverName": "Driver Name"
}
```

### Issue 2: Task Already Started
**Collection:** `fleetTasks` (id: 10003)
**Problem:** Status is "ONGOING" instead of "PLANNED"

```json
{
  "id": 10003,
  "status": "ONGOING",  // ❌ Should be "PLANNED" to show Start Route button
  "actualStartTime": "2026-02-11T04:28:28.375Z"  // ❌ Already has start time
}
```

---

## Quick Fix - MongoDB Queries

### Step 1: Fix Vehicle Assignment

Run this in MongoDB Compass or mongosh:

```javascript
// Update vehicle with driver assignment
db.fleetVehicles.updateOne(
  { id: 1 },
  {
    $set: {
      assignedDriverId: 50,
      assignedDriverName: "Driver Name",  // Get from drivers collection
      status: "IN_SERVICE",
      updatedAt: new Date()
    }
  }
);
```

### Step 2: Reset Task to PLANNED (Optional - for testing)

```javascript
// Reset task to PLANNED status
db.fleetTasks.updateOne(
  { id: 10003 },
  {
    $set: {
      status: "PLANNED",
      notes: "",
      updatedAt: new Date()
    },
    $unset: {
      actualStartTime: ""  // Remove start time
    }
  }
);
```

### Step 3: Verify Driver Has Vehicle Assignment

```javascript
// Check driver
db.drivers.findOne({ id: 50 });

// If vehicleId is missing, update it
db.drivers.updateOne(
  { id: 50 },
  {
    $set: {
      vehicleId: 1,
      updatedAt: new Date()
    }
  }
);
```

---

## Alternative - Run Node.js Script

### Option 1: Run the fix script

```bash
cd moile/backend
node fix-vehicle-assignment.js
```

### Option 2: Reset task to PLANNED

```bash
node fix-vehicle-assignment.js --reset-task
```

---

## Verification Queries

### Check Vehicle Assignment

```javascript
db.fleetVehicles.findOne({ id: 1 }, {
  id: 1,
  registrationNo: 1,
  assignedDriverId: 1,
  assignedDriverName: 1,
  status: 1
});
```

**Expected Result:**
```json
{
  "id": 1,
  "registrationNo": "ABC123",
  "assignedDriverId": 50,  // ✅ Should be present
  "assignedDriverName": "Driver Name",  // ✅ Should be present
  "status": "IN_SERVICE"
}
```

### Check Task Status

```javascript
db.fleetTasks.findOne({ id: 10003 }, {
  id: 1,
  status: 1,
  driverId: 1,
  vehicleId: 1,
  actualStartTime: 1
});
```

**Expected Result (for testing):**
```json
{
  "id": 10003,
  "status": "PLANNED",  // ✅ Should be PLANNED to show Start Route button
  "driverId": 50,
  "vehicleId": 1,
  "actualStartTime": null  // ✅ Should be null
}
```

### Check Driver Assignment

```javascript
db.drivers.findOne({ id: 50 }, {
  id: 1,
  employeeName: 1,
  vehicleId: 1
});
```

**Expected Result:**
```json
{
  "id": 50,
  "employeeName": "Driver Name",
  "vehicleId": 1  // ✅ Should match vehicle id
}
```

---

## Complete Validation Check

Run this query to check all validations at once:

```javascript
db.fleetTasks.aggregate([
  { $match: { id: 10003 } },
  {
    $lookup: {
      from: "fleetVehicles",
      localField: "vehicleId",
      foreignField: "id",
      as: "vehicle"
    }
  },
  { $unwind: "$vehicle" },
  {
    $lookup: {
      from: "drivers",
      localField: "driverId",
      foreignField: "id",
      as: "driver"
    }
  },
  { $unwind: "$driver" },
  {
    $project: {
      taskId: "$id",
      taskStatus: "$status",
      
      check1_taskReady: {
        $cond: [
          { $eq: ["$status", "PLANNED"] },
          "✅ Task is PLANNED",
          "❌ Task already started"
        ]
      },
      
      check2_vehicleAssignment: {
        vehicleId: "$vehicleId",
        registrationNo: "$vehicle.registrationNo",
        assignedDriverId: "$vehicle.assignedDriverId",
        status: {
          $cond: [
            { $eq: ["$vehicle.assignedDriverId", "$driverId"] },
            "✅ Vehicle assigned to driver",
            "❌ Vehicle not assigned"
          ]
        }
      },
      
      check3_driverAssignment: {
        driverId: "$driverId",
        driverName: "$driver.employeeName",
        driverVehicleId: "$driver.vehicleId",
        status: {
          $cond: [
            { $eq: ["$driver.vehicleId", "$vehicleId"] },
            "✅ Driver assigned to vehicle",
            "❌ Driver not assigned"
          ]
        }
      },
      
      canStartRoute: {
        $and: [
          { $eq: ["$status", "PLANNED"] },
          { $eq: ["$vehicle.assignedDriverId", "$driverId"] },
          { $eq: ["$driver.vehicleId", "$vehicleId"] }
        ]
      }
    }
  }
]);
```

**Expected Result:**
```json
{
  "taskId": 10003,
  "taskStatus": "PLANNED",
  "check1_taskReady": "✅ Task is PLANNED",
  "check2_vehicleAssignment": {
    "vehicleId": 1,
    "registrationNo": "ABC123",
    "assignedDriverId": 50,
    "status": "✅ Vehicle assigned to driver"
  },
  "check3_driverAssignment": {
    "driverId": 50,
    "driverName": "Driver Name",
    "driverVehicleId": 1,
    "status": "✅ Driver assigned to vehicle"
  },
  "canStartRoute": true  // ✅ All validations passed
}
```

---

## What Each Fix Does

### Fix 1: Add assignedDriverId to Vehicle
**Before:**
```json
{
  "id": 1,
  "registrationNo": "ABC123"
  // Missing driver assignment
}
```

**After:**
```json
{
  "id": 1,
  "registrationNo": "ABC123",
  "assignedDriverId": 50,  // ✅ Added
  "assignedDriverName": "Driver Name",  // ✅ Added
  "status": "IN_SERVICE"  // ✅ Updated
}
```

### Fix 2: Reset Task to PLANNED
**Before:**
```json
{
  "id": 10003,
  "status": "ONGOING",  // Already started
  "actualStartTime": "2026-02-11T04:28:28.375Z"
}
```

**After:**
```json
{
  "id": 10003,
  "status": "PLANNED",  // ✅ Reset to not started
  "actualStartTime": null  // ✅ Removed
}
```

### Fix 3: Add vehicleId to Driver
**Before:**
```json
{
  "id": 50,
  "employeeName": "Driver Name"
  // Missing vehicle assignment
}
```

**After:**
```json
{
  "id": 50,
  "employeeName": "Driver Name",
  "vehicleId": 1  // ✅ Added
}
```

---

## Summary

**Run these 3 queries to fix all issues:**

```javascript
// 1. Fix vehicle
db.fleetVehicles.updateOne(
  { id: 1 },
  { $set: { assignedDriverId: 50, assignedDriverName: "Driver Name", status: "IN_SERVICE", updatedAt: new Date() } }
);

// 2. Reset task (optional - for testing)
db.fleetTasks.updateOne(
  { id: 10003 },
  { $set: { status: "PLANNED", notes: "", updatedAt: new Date() }, $unset: { actualStartTime: "" } }
);

// 3. Fix driver
db.drivers.updateOne(
  { id: 50 },
  { $set: { vehicleId: 1, updatedAt: new Date() } }
);
```

After running these queries, the "Start Route" button will appear in the driver mobile app!
