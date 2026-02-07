# Driver Mobile App API Availability Analysis

## Executive Summary
Based on the current backend implementation, **most core driver APIs are available**, but several features require new endpoints or enhancements.

---

## 1. Dashboard APIs

### ✅ **AVAILABLE**
- **GET /api/driver/tasks/today** - Today's Transport Tasks
  - Returns: taskId, projectName, startTime, endTime, vehicleNumber, passengers count, status, pickup/drop locations, driver info
  - Status: ✅ Fully implemented

### ❌ **MISSING**
- **Dashboard Summary Statistics** - Quick overview cards
  - Total trips today
  - Completed trips
  - Pending trips
  - Total passengers transported
  - **Action Required**: Create new endpoint `/api/driver/dashboard/summary`

---

## 2. Transport Tasks APIs

### ✅ **AVAILABLE**
- **GET /api/driver/tasks/today** - Dormitory Pickup List
  - Returns full task list with pickup locations
  - Status: ✅ Implemented

- **GET /api/driver/tasks/:taskId** - Task Details with Worker List
  - Returns: passengers array with pickup points, pickup/drop status
  - Includes map locations (pickup/drop addresses)
  - Status: ✅ Implemented

- **POST /api/driver/tasks/:taskId/pickup** - Confirm Pickup
  - Body: `{ confirmed: [passengerId], missed: [passengerId] }`
  - Updates task status to "ONGOING"
  - Status: ✅ Implemented

- **POST /api/driver/tasks/:taskId/drop** - Confirm Drop
  - Body: `{ confirmed: [passengerId], missed: [passengerId] }`
  - Updates task status to "COMPLETED"
  - Status: ✅ Implemented

### ⚠️ **NEEDS ENHANCEMENT**
- **Worker Count Confirmation** - Currently returns passenger count but no explicit confirmation endpoint
  - Current: Passenger count included in task details
  - Enhancement: Add validation endpoint `/api/driver/tasks/:taskId/validate-count`
  - Body: `{ expectedCount: number, actualCount: number }`

---

## 3. Trip Updates APIs

### ✅ **AVAILABLE**
- **POST /api/driver/tasks/:taskId/pickup** - Pickup Completed
  - Marks pickup as completed
  - Status: ✅ Implemented

- **POST /api/driver/tasks/:taskId/drop** - Drop Completed
  - Marks drop as completed
  - Status: ✅ Implemented

### ❌ **MISSING**
- **POST /api/driver/tasks/:taskId/delay** - Delay Report
  - Body: `{ delayReason: string, estimatedDelay: number, currentLocation: object }`
  - **Action Required**: Create new endpoint

- **POST /api/driver/tasks/:taskId/breakdown** - Breakdown Report
  - Body: `{ breakdownType: string, description: string, location: object, requiresAssistance: boolean }`
  - **Action Required**: Create new endpoint

- **POST /api/driver/tasks/:taskId/photos** - Photo Upload for Trip
  - Body: FormData with photo files
  - **Action Required**: Create new endpoint with multer configuration
  - Storage path: `uploads/trips/`

---

## 4. Attendance APIs

### ✅ **AVAILABLE**
- **Trip History** (serves as attendance log)
  - **GET /api/driver/trips/history** - Trip History
  - Query params: `startDate`, `endDate`
  - Returns: Completed trips with timestamps
  - Status: ✅ Implemented

### ⚠️ **NEEDS CLARIFICATION**
- **Login/Logout** - Currently handled by authentication system
  - Login: **POST /api/auth/login** (existing)
  - Logout: Client-side token removal (standard practice)
  - Optional: Create **POST /api/driver/attendance/logout** for server-side session tracking

---

## 5. Notifications APIs

### ✅ **AVAILABLE** (Generic Worker Notifications)
- **GET /api/notifications** - Get all notifications
  - Returns: All notifications for the logged-in user
  - Status: ✅ Implemented (generic endpoint)

- **PUT /api/notifications/:id/read** - Mark as read
  - Status: ✅ Implemented (generic endpoint)

### ❌ **MISSING** (Driver-Specific)
- **GET /api/driver/notifications** - Driver-specific notifications
  - Filter: Admin instructions, route changes, urgent alerts
  - **Action Required**: Create driver-specific notification filtering

- **GET /api/driver/notifications/urgent** - Urgent Alerts Only
  - **Action Required**: Create endpoint with priority filtering

- **POST /api/driver/notifications/:id/acknowledge** - Acknowledge Critical Notifications
  - **Action Required**: Create acknowledgment tracking

---

## 6. Vehicle Info APIs

### ⚠️ **PARTIALLY AVAILABLE**
- **Vehicle Details** - Data exists in FleetVehicle model but no driver-facing endpoint
  - Model fields available:
    - `registrationNo`, `vehicleType`, `capacity`, `status`
    - `insuranceExpiry`, `lastServiceDate`, `odometer`
  - **Action Required**: Create **GET /api/driver/vehicle** endpoint
  - Should return vehicle assigned to driver for current/upcoming tasks

### ❌ **MISSING** (Future Phase)
- **POST /api/driver/vehicle/fuel-log** - Fuel Log Entry
  - Body: `{ odometer: number, fuelAmount: number, cost: number, date: Date }`
  - **Action Required**: Create FuelLog model and endpoints

- **GET /api/driver/vehicle/maintenance-alerts** - Maintenance Alerts
  - Based on: odometer, lastServiceDate, insuranceExpiry
  - **Action Required**: Create maintenance alert logic

---

## 7. Profile APIs

### ✅ **AVAILABLE**
- **GET /api/driver/profile** - Personal Info
  - Returns: id, name, email, phoneNumber, companyName, role, photoUrl
  - Status: ✅ Implemented

- **PUT /api/driver/profile/password** - Change Password
  - Body: `{ oldPassword: string, newPassword: string }`
  - Status: ✅ Implemented

- **POST /api/driver/profile/photo** - Upload Profile Photo
  - Body: FormData with photo file
  - Status: ✅ Implemented

### ⚠️ **NEEDS ENHANCEMENT**
- **Driving License Details** - Not currently stored
  - **Action Required**: Add fields to Employee model:
    - `drivingLicenseNumber`, `licenseType`, `licenseExpiry`, `licensePhotoUrl`
  - Create endpoint: **PUT /api/driver/profile/license**

---

## Summary Table

| Feature Category | Available | Missing | Needs Enhancement |
|-----------------|-----------|---------|-------------------|
| **Dashboard** | 1 | 1 | 0 |
| **Transport Tasks** | 4 | 0 | 1 |
| **Trip Updates** | 2 | 3 | 0 |
| **Attendance** | 1 | 0 | 1 |
| **Notifications** | 2 | 3 | 0 |
| **Vehicle Info** | 0 | 2 | 1 |
| **Profile** | 3 | 0 | 1 |
| **TOTAL** | **13** | **9** | **4** |

---

## Priority Implementation Roadmap

### 🔴 **HIGH PRIORITY** (Core Functionality)
1. **Dashboard Summary Endpoint** - `/api/driver/dashboard/summary`
2. **Delay/Breakdown Reporting** - `/api/driver/tasks/:taskId/delay` & `/breakdown`
3. **Trip Photo Upload** - `/api/driver/tasks/:taskId/photos`
4. **Driver-Specific Notifications** - `/api/driver/notifications`
5. **Vehicle Info Endpoint** - `/api/driver/vehicle`

### 🟡 **MEDIUM PRIORITY** (Enhanced UX)
6. **Worker Count Validation** - `/api/driver/tasks/:taskId/validate-count`
7. **Urgent Alerts Filtering** - `/api/driver/notifications/urgent`
8. **Notification Acknowledgment** - `/api/driver/notifications/:id/acknowledge`
9. **Driving License Management** - Employee model enhancement + endpoints

### 🟢 **LOW PRIORITY** (Future Phase)
10. **Fuel Log System** - Complete CRUD for fuel tracking
11. **Maintenance Alerts** - Automated alert generation based on vehicle data
12. **Attendance Logout Tracking** - Server-side session management

---

## Existing API Endpoints (Ready to Use)

### Authentication
```
POST /api/auth/login
POST /api/auth/refresh-token
```

### Driver Profile
```
GET    /api/driver/profile
PUT    /api/driver/profile/password
POST   /api/driver/profile/photo
```

### Driver Tasks
```
GET    /api/driver/tasks/today
GET    /api/driver/tasks/:taskId
POST   /api/driver/tasks/:taskId/pickup
POST   /api/driver/tasks/:taskId/drop
GET    /api/driver/tasks/:taskId/summary
```

### Trip History
```
GET    /api/driver/trips/history?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

### Notifications (Generic)
```
GET    /api/notifications
PUT    /api/notifications/:id/read
```

---

## Required New Endpoints

### Dashboard
```
GET    /api/driver/dashboard/summary
```

### Trip Updates
```
POST   /api/driver/tasks/:taskId/delay
POST   /api/driver/tasks/:taskId/breakdown
POST   /api/driver/tasks/:taskId/photos
POST   /api/driver/tasks/:taskId/validate-count
```

### Notifications
```
GET    /api/driver/notifications
GET    /api/driver/notifications/urgent
POST   /api/driver/notifications/:id/acknowledge
```

### Vehicle Info
```
GET    /api/driver/vehicle
GET    /api/driver/vehicle/maintenance-alerts
POST   /api/driver/vehicle/fuel-log
GET    /api/driver/vehicle/fuel-log
```

### Profile Enhancement
```
PUT    /api/driver/profile/license
GET    /api/driver/profile/license
```

---

## Database Schema Enhancements Needed

### Employee Model (for Driver License)
```javascript
drivingLicenseNumber: { type: String },
licenseType: { type: String }, // e.g., "Class 3", "Class 4"
licenseExpiry: { type: Date },
licensePhotoUrl: { type: String }
```

### New Models Required

#### FuelLog Model
```javascript
{
  id: Number,
  driverId: Number,
  vehicleId: Number,
  companyId: Number,
  odometer: Number,
  fuelAmount: Number,
  fuelCost: Number,
  fuelType: String,
  location: String,
  date: Date,
  receiptPhotoUrl: String,
  createdAt: Date
}
```

#### TripIncident Model (for delays/breakdowns)
```javascript
{
  id: Number,
  fleetTaskId: Number,
  driverId: Number,
  incidentType: String, // 'DELAY', 'BREAKDOWN', 'ACCIDENT'
  description: String,
  location: Object,
  reportedAt: Date,
  resolvedAt: Date,
  status: String,
  photoUrls: [String],
  requiresAssistance: Boolean
}
```

---

## Next Steps

1. **Review and prioritize** missing endpoints based on MVP requirements
2. **Implement HIGH PRIORITY endpoints** first (dashboard, delay/breakdown, photos)
3. **Enhance Employee model** for driving license data
4. **Create new models** (FuelLog, TripIncident) for future features
5. **Test existing endpoints** with mobile app integration
6. **Document API specifications** for mobile team (request/response formats)

---

## Notes

- All existing endpoints use JWT authentication via `verifyToken` middleware
- Photo uploads use multer with 5MB file size limit
- Date ranges in queries use ISO 8601 format
- All responses follow standard format: `{ success: boolean, message: string, data: object }`
- Error handling is centralized with proper HTTP status codes
