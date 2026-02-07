# Driver API Quick Reference Guide

Quick reference for mobile app integration.

---

## 🔐 Authentication

```javascript
// Login
POST /api/auth/login
Body: { email, password }
Response: { token, user: { id, role, ... } }

// Store token for subsequent requests
headers: { 'Authorization': 'Bearer {token}' }
```

---

## 📊 Dashboard

```javascript
// Get dashboard summary
GET /api/driver/dashboard/summary
Response: {
  summary: {
    totalTrips, completedTrips, ongoingTrips, pendingTrips,
    totalPassengers, currentVehicle, driverName, driverPhoto
  }
}

// Get assigned vehicle
GET /api/driver/vehicle
Response: {
  vehicle: {
    registrationNo, vehicleType, capacity, status,
    insuranceExpiry, lastServiceDate, odometer
  }
}
```

---

## 🚐 Transport Tasks

```javascript
// Get today's tasks
GET /api/driver/tasks/today
Response: {
  tasks: [{
    taskId, projectName, startTime, endTime,
    vehicleNumber, passengers, status,
    pickupLocation, dropLocation
  }]
}

// Get task details with passenger list
GET /api/driver/tasks/:taskId
Response: {
  id, projectName, vehicleNo, startTime, endTime,
  passengers: [{ id, name, pickupPoint, pickupStatus, dropStatus }],
  status, pickupLocation, dropLocation
}

// Confirm pickup
POST /api/driver/tasks/:taskId/pickup
Body: {
  confirmed: [passengerId1, passengerId2],
  missed: [passengerId3]
}
Response: { status: "ONGOING", updatedPassengers: [...] }

// Confirm drop
POST /api/driver/tasks/:taskId/drop
Body: {
  confirmed: [passengerId1, passengerId2],
  missed: [passengerId3]
}
Response: { status: "COMPLETED", updatedPassengers: [...] }

// Get trip summary
GET /api/driver/tasks/:taskId/summary
Response: {
  projectName, vehicleNo, driverName,
  totalPassengers, pickedUp, dropped, missed,
  durationMinutes, startTime, endTime, status
}
```

---

## 📝 Trip Updates

```javascript
// Report delay
POST /api/driver/tasks/:taskId/delay
Body: {
  delayReason: "Heavy traffic",
  estimatedDelay: 30, // minutes
  currentLocation: { latitude, longitude, address }
}
Response: { incident: { id, incidentType, status, reportedAt } }

// Report breakdown
POST /api/driver/tasks/:taskId/breakdown
Body: {
  breakdownType: "Engine Overheating",
  description: "Engine temperature gauge showing red",
  location: { latitude, longitude, address },
  requiresAssistance: true
}
Response: { incident: { id, incidentType, status, reportedAt } }

// Upload trip photos (max 10)
POST /api/driver/tasks/:taskId/photos
Content-Type: multipart/form-data
Body: FormData with 'photos' field (array of files)
Response: { photos: ["/uploads/trips/photo1.jpg", ...] }

// Validate worker count
POST /api/driver/tasks/:taskId/validate-count
Body: {
  expectedCount: 10,
  actualCount: 10
}
Response: {
  validation: {
    expectedCount, actualCount, databaseCount,
    countMatch, countDiscrepancy, status
  }
}
```

---

## 📅 Trip History

```javascript
// Get trip history (default: last 7 days)
GET /api/driver/trips/history?startDate=2026-02-01&endDate=2026-02-07
Response: {
  trips: [{
    taskId, projectName, startTime, endTime,
    actualStartTime, actualEndTime, vehicleNumber,
    passengers, status, pickupLocation, dropLocation, taskDate
  }]
}
```

---

## 👤 Profile

```javascript
// Get profile
GET /api/driver/profile
Response: {
  profile: {
    id, name, email, phoneNumber, companyName,
    role, photoUrl, createdAt, updatedAt
  }
}

// Change password
PUT /api/driver/profile/password
Body: { oldPassword, newPassword }
Response: { message: "Password updated successfully" }

// Upload profile photo
POST /api/driver/profile/photo
Content-Type: multipart/form-data
Body: FormData with 'photo' field
Response: { photoUrl, driver: {...} }
```

---

## 📄 Driving License

```javascript
// Get license details
GET /api/driver/profile/license
Response: {
  license: {
    driverId, driverName, licenseNumber, licenseType,
    licenseExpiry, licensePhotoUrl, isExpired
  }
}

// Update license details
PUT /api/driver/profile/license
Body: {
  licenseNumber: "DL123456789",
  licenseType: "Class 3",
  licenseExpiry: "2026-12-31"
}
Response: { license: {...} }

// Upload license photo
POST /api/driver/profile/license/photo
Content-Type: multipart/form-data
Body: FormData with 'photo' field
Response: { licensePhotoUrl, license: {...} }
```

---

## 👋 Logout

```javascript
// Logout (optional server-side tracking)
POST /api/driver/attendance/logout
Response: { message: "Logout successful", timestamp }
```

---

## 🎨 UI Implementation Tips

### Dashboard Screen
- Show summary cards: Total Trips, Completed, Pending, Passengers
- Display current vehicle info prominently
- Show today's task list with status indicators

### Task Details Screen
- Map view for pickup/drop locations
- Passenger list with checkboxes for pickup/drop confirmation
- Quick actions: Report Delay, Report Breakdown, Upload Photos

### Trip Updates
- Delay form: Reason dropdown + estimated delay slider
- Breakdown form: Type dropdown + description + assistance toggle
- Photo upload: Camera + gallery picker, max 10 photos

### Profile Screen
- Editable fields: Password change
- Photo upload with preview
- License section with expiry warning if < 30 days

### License Management
- Display license details with expiry date
- Warning badge if expired or expiring soon
- Edit form with date picker for expiry
- Photo upload with preview

---

## 🔄 Typical Workflows

### Morning Routine
1. Login → Dashboard
2. View today's tasks
3. Check vehicle assignment
4. Start first trip

### During Trip
1. View task details
2. Confirm pickup (select passengers)
3. If delay: Report delay
4. If breakdown: Report breakdown
5. Navigate to drop location
6. Confirm drop (select passengers)
7. View trip summary

### End of Day
1. View trip history
2. Check completed trips
3. Logout

---

## ⚠️ Error Handling

```javascript
// All endpoints return consistent error format
{
  success: false,
  message: "Error description",
  error: "Detailed error message"
}

// Common HTTP status codes
200 - Success
400 - Bad request (validation error)
401 - Unauthorized (invalid/expired token)
404 - Not found (task/vehicle not found)
500 - Server error
```

---

## 📱 Offline Support Recommendations

### Cache Locally
- Today's tasks
- Vehicle details
- Driver profile
- Recent trip history

### Queue for Sync
- Pickup confirmations
- Drop confirmations
- Delay reports
- Breakdown reports
- Photo uploads

### Sync Strategy
- Auto-sync when online
- Show sync status indicator
- Retry failed requests
- Conflict resolution for passenger status

---

## 🧪 Testing Checklist

- [ ] Login with driver credentials
- [ ] View dashboard summary
- [ ] View vehicle details
- [ ] View today's tasks
- [ ] View task details with passengers
- [ ] Confirm pickup
- [ ] Report delay
- [ ] Report breakdown
- [ ] Upload trip photos
- [ ] Validate worker count
- [ ] Confirm drop
- [ ] View trip summary
- [ ] View trip history
- [ ] View/update profile
- [ ] Change password
- [ ] Upload profile photo
- [ ] View/update license
- [ ] Upload license photo
- [ ] Logout

---

## 📞 Support

**Base URL:** `http://localhost:5000/api` (development)

**Authentication:** All endpoints require JWT token in Authorization header

**File Uploads:** Max 5MB per file, images only

**Date Format:** ISO 8601 (YYYY-MM-DD or full ISO string)

---

**Ready for Integration!** 🚀
