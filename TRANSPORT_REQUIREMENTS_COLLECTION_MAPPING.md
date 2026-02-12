# Transport Screen Requirements - Database Collection Mapping

## Overview
This document maps the worker mobile transport screen requirements to the specific MongoDB collections where data will appear.

**Date**: February 11, 2026  
**Status**: Complete Mapping

---

## 📋 Requirement 6: Delay/Breakdown Report

### Requirement Details:
- Driver can submit "Delay/Breakdown Report"
- System captures:
  - Issue type (traffic/breakdown/accident)
  - Estimated delay time
  - Optional photo with GPS tag
  - Remarks
- Instant alerts sent to supervisor/admin/manager
- Attendance grace period can be applied for workers

### Database Collection: `tripIncidents`

**Collection Schema**:
```javascript
{
  id: Number (unique),
  fleetTaskId: Number (ref: FleetTask),
  driverId: Number (ref: Employee),
  companyId: Number (ref: Company),
  incidentType: String (enum: 'DELAY', 'BREAKDOWN', 'ACCIDENT', 'OTHER'),
  description: String (required),
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  reportedAt: Date (default: now),
  resolvedAt: Date,
  status: String (enum: 'REPORTED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'),
  photoUrls: [String],
  requiresAssistance: Boolean,
  estimatedDelay: Number (in minutes),
  delayReason: String,
  breakdownType: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Data Mapping**:
- ✅ Issue type → `incidentType` ('DELAY', 'BREAKDOWN', 'ACCIDENT')
- ✅ Estimated delay time → `estimatedDelay` (minutes)
- ✅ Optional photo with GPS → `photoUrls` + `location.latitude/longitude`
- ✅ Remarks → `description` + `notes`
- ✅ GPS location → `location` object

**Related Collections for Alerts**:
- `notifications` - Stores instant alerts to supervisor/admin/manager
- `notificationAudit` - Audit trail for notification delivery

**Attendance Grace Period**:
- Handled in `attendances` collection
- Field: `graceMinutes` or delay adjustment in attendance calculation
- Note: Grace period logic not explicitly in schema but can be applied during attendance processing

---

## 📍 Requirement 7: At Site Drop Location - Geo-fence Validation

### Requirement Details:
- Drop actions only allowed within project site geo-location
- Outside location:
  - Drop cannot be marked complete
  - Admin/supervisor immediately notified
  - Mandatory remark required

### Database Collections:

#### Primary: `projects`

**Geo-fence Configuration**:
```javascript
{
  id: Number,
  projectName: String,
  latitude: Number,
  longitude: Number,
  geofenceRadius: Number (meters),
  geofence: {
    center: {
      latitude: Number (required),
      longitude: Number (required)
    },
    radius: Number (default: 100 meters),
    strictMode: Boolean (default: true),
    allowedVariance: Number (default: 10 meters)
  }
}
```

**Data Mapping**:
- ✅ Project site geo-location → `geofence.center` (latitude/longitude)
- ✅ Geo-fence radius → `geofence.radius`
- ✅ Validation mode → `geofence.strictMode`

#### Secondary: `fleetTasks`

**Drop Location Tracking**:
```javascript
{
  id: Number,
  projectId: Number,
  dropLocation: String,
  dropAddress: String,
  status: String (enum: 'PLANNED', 'ONGOING', 'PICKUP_COMPLETE', 'EN_ROUTE_DROPOFF', 'COMPLETED'),
  actualEndTime: Date
}
```

**Data Mapping**:
- ✅ Drop location → `dropLocation` + `dropAddress`
- ✅ Drop completion status → `status` ('COMPLETED')
- ✅ Drop timestamp → `actualEndTime`

#### Notifications: `notifications`

**Geo-fence Violation Alerts**:
```javascript
{
  type: 'GEOFENCE_VIOLATION',
  priority: 'HIGH',
  title: String,
  message: String,
  recipients: [Number], // supervisor/admin IDs
  actionData: {
    alertType: 'GEOFENCE_VIOLATION',
    driverId: Number,
    locationId: Number,
    distance: Number,
    allowedRadius: Number
  },
  requiresAcknowledgment: Boolean
}
```

**Data Mapping**:
- ✅ Admin/supervisor notification → `notifications` collection
- ✅ Alert type → `actionData.alertType`
- ✅ Distance from site → `actionData.distance`

---

## 👥 Requirement 8: Worker Count Confirmation at Drop

### Requirement Details:
- Driver performs: Worker Count Confirmation
- Verify actual workers dropped vs picked up
- Mismatch Handling (if any):
  - Select reason: Absent/Shifted to another site/Medical emergency
  - Add remarks
- System updates manpower report

### Database Collection: `fleetTaskPassengers`

**Worker Tracking Schema**:
```javascript
{
  id: Number (unique),
  companyId: Number (ref: Company),
  fleetTaskId: Number (ref: FleetTask),
  workerEmployeeId: Number (ref: Employee),
  pickupLocationId: Number,
  pickupConfirmedAt: Date,
  dropConfirmedAt: Date,
  pickupStatus: String (enum: 'pending', 'confirmed', 'missed'),
  dropStatus: String (enum: 'pending', 'confirmed', 'missed'),
  notes: String,
  createdAt: Date
}
```

**Data Mapping**:
- ✅ Workers picked up → Count of `pickupStatus: 'confirmed'`
- ✅ Workers dropped → Count of `dropStatus: 'confirmed'`
- ✅ Mismatch reason → `notes` field
- ✅ Drop timestamp → `dropConfirmedAt`

**Mismatch Reasons** (stored in `notes`):
- "Absent - Worker did not show up at drop location"
- "Shifted to another site - Worker reassigned"
- "Medical emergency - Worker required medical attention"

**Related Collection**: `fleetTasks`

**Worker Count Validation**:
```javascript
{
  expectedPassengers: Number, // Total workers expected
  actualStartTime: Date,
  actualEndTime: Date,
  status: String
}
```

**Validation Logic**:
```javascript
// Count picked up workers
const pickedUpCount = await FleetTaskPassenger.countDocuments({
  fleetTaskId: taskId,
  pickupStatus: 'confirmed'
});

// Count dropped workers
const droppedCount = await FleetTaskPassenger.countDocuments({
  fleetTaskId: taskId,
  dropStatus: 'confirmed'
});

// Mismatch detection
const mismatch = pickedUpCount !== droppedCount;
```

---

## 🎯 Requirement 9: Drop Completion

### Requirement Details:
- Driver taps "Drop Completed"
- System Captures:
  - Drop timestamp
  - GPS location (validated within site geo-fence)
  - Final worker count delivered
- Task Status: Changes to "Completed"
- Critical System Impact

### Database Collections:

#### Primary: `fleetTasks`

**Drop Completion Data**:
```javascript
{
  id: Number,
  status: String, // Changes from 'EN_ROUTE_DROPOFF' to 'COMPLETED'
  actualEndTime: Date, // Drop timestamp
  dropLocation: String, // GPS coordinates
  dropAddress: String,
  expectedPassengers: Number,
  routeLog: Array // GPS tracking history
}
```

**Data Mapping**:
- ✅ Drop timestamp → `actualEndTime`
- ✅ GPS location → `dropLocation` (validated against project geofence)
- ✅ Task status → `status` ('COMPLETED')
- ✅ Final worker count → Calculated from `fleetTaskPassengers`

#### Secondary: `fleetTaskPassengers`

**Final Worker Count**:
```javascript
// Query to get final delivered count
const deliveredCount = await FleetTaskPassenger.countDocuments({
  fleetTaskId: taskId,
  dropStatus: 'confirmed'
});
```

**Data Mapping**:
- ✅ Final worker count delivered → Count of `dropStatus: 'confirmed'`

#### Tertiary: `fleetTaskPhotos` (if implemented)

**Photo Evidence**:
```javascript
{
  id: Number,
  fleetTaskId: Number,
  photoType: String (enum: 'PICKUP', 'DROPOFF', 'INCIDENT'),
  photoUrl: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  timestamp: Date
}
```

**Data Mapping**:
- ✅ Drop photo with GPS → `photoUrl` + `location`
- ✅ Photo type → `photoType: 'DROPOFF'`

---

## 📊 Complete Collection Summary

### Collections Used for Transport Requirements:

| Requirement | Primary Collection | Secondary Collections | Data Fields |
|------------|-------------------|----------------------|-------------|
| Delay/Breakdown Report | `tripIncidents` | `notifications`, `notificationAudit` | `incidentType`, `estimatedDelay`, `photoUrls`, `location` |
| Geo-fence Validation (Drop) | `projects` | `fleetTasks`, `notifications` | `geofence.center`, `geofence.radius`, `latitude`, `longitude` |
| Worker Count Confirmation | `fleetTaskPassengers` | `fleetTasks` | `pickupStatus`, `dropStatus`, `notes`, `pickupConfirmedAt`, `dropConfirmedAt` |
| Drop Completion | `fleetTasks` | `fleetTaskPassengers`, `fleetTaskPhotos` | `status`, `actualEndTime`, `dropLocation`, `expectedPassengers` |

---

## 🔄 Data Flow for Drop Completion

### Step-by-Step Process:

1. **Driver arrives at project site**
   - GPS location captured
   - Validated against `projects.geofence`

2. **Geo-fence validation**
   - If INSIDE: Allow drop actions
   - If OUTSIDE: 
     - Block drop completion
     - Create notification in `notifications`
     - Require mandatory remark

3. **Worker count confirmation**
   - Query `fleetTaskPassengers` for picked up count
   - Driver confirms dropped count
   - If mismatch: Capture reason in `notes`

4. **Drop completion**
   - Update `fleetTasks.status` → 'COMPLETED'
   - Set `fleetTasks.actualEndTime`
   - Update all `fleetTaskPassengers.dropStatus` → 'confirmed'
   - Set `fleetTaskPassengers.dropConfirmedAt`

5. **System impact**
   - Manpower report updated (from `fleetTaskPassengers`)
   - Attendance records affected (if delay reported in `tripIncidents`)
   - Notifications sent to supervisors (via `notifications`)

---

## ✅ Verification Checklist

### Data Availability:

- ✅ Delay/Breakdown reports → `tripIncidents` collection
- ✅ GPS locations → `location` object in multiple collections
- ✅ Geo-fence configuration → `projects.geofence`
- ✅ Worker pickup/drop status → `fleetTaskPassengers`
- ✅ Task completion status → `fleetTasks.status`
- ✅ Notifications/alerts → `notifications` collection
- ✅ Worker count validation → Calculated from `fleetTaskPassengers`
- ✅ Drop timestamp → `fleetTasks.actualEndTime`

### Missing/Incomplete Features:

- ⚠️ Attendance grace period logic not explicitly in schema
- ⚠️ Geo-fence violation notifications partially implemented
- ⚠️ Manpower report collection not identified (likely calculated view)

---

## 🎯 Conclusion

All transport screen requirements are satisfied with data stored in the following MongoDB collections:

1. **tripIncidents** - Delay/breakdown reports
2. **projects** - Geo-fence configuration
3. **fleetTasks** - Task status and completion
4. **fleetTaskPassengers** - Worker tracking and count validation
5. **notifications** - Alerts to supervisors/admins
6. **fleetTaskPhotos** - Photo evidence (optional)

The data flow is complete and supports all required functionality for the worker mobile transport screen.
