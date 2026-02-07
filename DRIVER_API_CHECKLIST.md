# Driver Mobile App API Checklist
**Excluding Notifications (Future Phase)**

---

## 1. 📊 DASHBOARD

### Today's Transport Tasks
- ✅ **GET /api/driver/tasks/today**
  - Returns: taskId, projectName, startTime, endTime, vehicleNumber, passengers, status, pickup/drop locations, driver info
  - **Status: AVAILABLE**

### Vehicle Assigned
- ❌ **GET /api/driver/dashboard/vehicle**
  - Returns: Current vehicle assignment for today's tasks
  - **Status: NOT AVAILABLE - NEEDS IMPLEMENTATION**

### Pickup Time & Location
- ✅ **Included in GET /api/driver/tasks/today**
  - Fields: `startTime`, `pickupLocation`
  - **Status: AVAILABLE**

### Number of Workers
- ✅ **Included in GET /api/driver/tasks/today**
  - Field: `passengers` (count)
  - **Status: AVAILABLE**

### Dashboard Summary
- ❌ **GET /api/driver/dashboard/summary**
  - Returns: Total trips today, completed, pending, total passengers
  - **Status: NOT AVAILABLE - NEEDS IMPLEMENTATION**

---

## 2. 🚐 TRANSPORT TASKS

### Dormitory Pickup List
- ✅ **GET /api/driver/tasks/:taskId**
  - Returns: Full passenger list with pickup points
  - **Status: AVAILABLE**

### Site Drop Locations (Map)
- ✅ **Included in GET /api/driver/tasks/:taskId**
  - Fields: `dropLocation`, `dropAddress`
  - **Status: AVAILABLE**

### Worker Count Confirmation
- ⚠️ **Partial - No dedicated endpoint**
  - Current: Passenger count in task details
  - Enhancement needed: **POST /api/driver/tasks/:taskId/validate-count**
  - Body: `{ expectedCount: number, actualCount: number }`
  - **Status: PARTIALLY AVAILABLE - ENHANCEMENT RECOMMENDED**

### Task Status (Started / Completed)
- ✅ **POST /api/driver/tasks/:taskId/pickup** (Marks as ONGOING/Started)
  - Body: `{ confirmed: [passengerId], missed: [passengerId] }`
  - **Status: AVAILABLE**

- ✅ **POST /api/driver/tasks/:taskId/drop** (Marks as COMPLETED)
  - Body: `{ confirmed: [passengerId], missed: [passengerId] }`
  - **Status: AVAILABLE**

---

## 3. 📝 TRIP UPDATES

### Pickup Completed
- ✅ **POST /api/driver/tasks/:taskId/pickup**
  - Body: `{ confirmed: [passengerId], missed: [passengerId] }`
  - Updates task status to "ONGOING"
  - **Status: AVAILABLE**

### Drop Completed
- ✅ **POST /api/driver/tasks/:taskId/drop**
  - Body: `{ confirmed: [passengerId], missed: [passengerId] }`
  - Updates task status to "COMPLETED"
  - **Status: AVAILABLE**

### Delay Report
- ❌ **POST /api/driver/tasks/:taskId/delay**
  - Body: `{ delayReason: string, estimatedDelay: number, currentLocation: object }`
  - **Status: NOT AVAILABLE - NEEDS IMPLEMENTATION**

### Breakdown Report
- ❌ **POST /api/driver/tasks/:taskId/breakdown**
  - Body: `{ breakdownType: string, description: string, location: object, requiresAssistance: boolean }`
  - **Status: NOT AVAILABLE - NEEDS IMPLEMENTATION**

### Photo Upload (if required)
- ❌ **POST /api/driver/tasks/:taskId/photos**
  - Body: FormData with photo files
  - Storage: `uploads/trips/`
  - **Status: NOT AVAILABLE - NEEDS IMPLEMENTATION**

---

## 4. 📅 ATTENDANCE

### Login
- ✅ **POST /api/auth/login**
  - Body: `{ email: string, password: string }`
  - Returns: JWT token, user info, role
  - **Status: AVAILABLE**

### Logout
- ⚠️ **Client-side token removal (standard practice)**
  - Optional enhancement: **POST /api/driver/attendance/logout**
  - For server-side session tracking
  - **Status: PARTIALLY AVAILABLE - ENHANCEMENT OPTIONAL**

### Trip History
- ✅ **GET /api/driver/trips/history**
  - Query: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
  - Returns: Completed trips with timestamps, serves as attendance log
  - **Status: AVAILABLE**

---

## 5. 🔔 NOTIFICATIONS
**SKIPPED - FUTURE PHASE**

---

## 6. 🚗 VEHICLE INFO

### Vehicle Details
- ❌ **GET /api/driver/vehicle**
  - Returns: registrationNo, vehicleType, capacity, status, insuranceExpiry, lastServiceDate, odometer
  - **Status: NOT AVAILABLE - NEEDS IMPLEMENTATION**
  - Note: Data exists in FleetVehicle model, just needs endpoint

### Fuel Log (optional future phase)
- ❌ **POST /api/driver/vehicle/fuel-log**
  - **Status: NOT AVAILABLE - FUTURE PHASE**

- ❌ **GET /api/driver/vehicle/fuel-log**
  - **Status: NOT AVAILABLE - FUTURE PHASE**

### Maintenance Alerts (future)
- ❌ **GET /api/driver/vehicle/maintenance-alerts**
  - **Status: NOT AVAILABLE - FUTURE PHASE**

---

## 7. 👤 PROFILE

### Personal Info
- ✅ **GET /api/driver/profile**
  - Returns: id, name, email, phoneNumber, companyName, role, photoUrl
  - **Status: AVAILABLE**

- ✅ **PUT /api/driver/profile/password**
  - Body: `{ oldPassword: string, newPassword: string }`
  - **Status: AVAILABLE**

- ✅ **POST /api/driver/profile/photo**
  - Body: FormData with photo file
  - **Status: AVAILABLE**

### Driving License Details
- ❌ **GET /api/driver/profile/license**
  - Returns: licenseNumber, licenseType, licenseExpiry, licensePhotoUrl
  - **Status: NOT AVAILABLE - NEEDS IMPLEMENTATION**

- ❌ **PUT /api/driver/profile/license**
  - Body: `{ licenseNumber, licenseType, licenseExpiry }`
  - **Status: NOT AVAILABLE - NEEDS IMPLEMENTATION**

- ❌ **POST /api/driver/profile/license/photo**
  - Body: FormData with license photo
  - **Status: NOT AVAILABLE - NEEDS IMPLEMENTATION**

---

## 📊 SUMMARY

| Category | Available | Not Available | Partial/Enhancement |
|----------|-----------|---------------|---------------------|
| **Dashboard** | 2 | 2 | 0 |
| **Transport Tasks** | 4 | 0 | 1 |
| **Trip Updates** | 2 | 3 | 0 |
| **Attendance** | 2 | 0 | 1 |
| **Notifications** | - | - | SKIPPED |
| **Vehicle Info** | 0 | 1 | 0 |
| **Profile** | 3 | 3 | 0 |
| **TOTAL** | **13** | **9** | **2** |

---

## 🎯 REQUIRED IMPLEMENTATIONS (Priority Order)

### 🔴 HIGH PRIORITY (Core MVP Features)

1. **Dashboard Summary**
   ```
   GET /api/driver/dashboard/summary
   ```

2. **Vehicle Details**
   ```
   GET /api/driver/vehicle
   ```

3. **Delay Report**
   ```
   POST /api/driver/tasks/:taskId/delay
   Body: { delayReason, estimatedDelay, currentLocation }
   ```

4. **Breakdown Report**
   ```
   POST /api/driver/tasks/:taskId/breakdown
   Body: { breakdownType, description, location, requiresAssistance }
   ```

5. **Trip Photo Upload**
   ```
   POST /api/driver/tasks/:taskId/photos
   Body: FormData with photos
   ```

6. **Driving License Management**
   ```
   GET /api/driver/profile/license
   PUT /api/driver/profile/license
   POST /api/driver/profile/license/photo
   ```

### 🟡 MEDIUM PRIORITY (Enhanced UX)

7. **Worker Count Validation**
   ```
   POST /api/driver/tasks/:taskId/validate-count
   Body: { expectedCount, actualCount }
   ```

8. **Dashboard Vehicle Assignment**
   ```
   GET /api/driver/dashboard/vehicle
   ```

9. **Logout Tracking** (Optional)
   ```
   POST /api/driver/attendance/logout
   ```

### 🟢 LOW PRIORITY (Future Phase)

10. **Fuel Log System** - Complete CRUD
11. **Maintenance Alerts** - Automated alerts

---

## ✅ EXISTING ENDPOINTS (Ready to Use)

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

---

## 🔧 DATABASE ENHANCEMENTS NEEDED

### Employee Model (Add License Fields)
```javascript
drivingLicenseNumber: { type: String },
licenseType: { type: String }, // e.g., "Class 3", "Class 4"
licenseExpiry: { type: Date },
licensePhotoUrl: { type: String }
```

### New Model: TripIncident
```javascript
{
  id: Number,
  fleetTaskId: Number,
  driverId: Number,
  companyId: Number,
  incidentType: String, // 'DELAY', 'BREAKDOWN'
  description: String,
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  reportedAt: Date,
  resolvedAt: Date,
  status: String, // 'REPORTED', 'IN_PROGRESS', 'RESOLVED'
  photoUrls: [String],
  requiresAssistance: Boolean,
  estimatedDelay: Number, // minutes
  createdAt: Date,
  updatedAt: Date
}
```

### New Model: FuelLog (Future Phase)
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

---

## 📝 IMPLEMENTATION NOTES

1. **All endpoints require JWT authentication** via `verifyToken` middleware
2. **Photo uploads** use multer with 5MB file size limit
3. **Date formats** use ISO 8601 (YYYY-MM-DD)
4. **Response format**: `{ success: boolean, message: string, data: object }`
5. **Error handling** uses centralized error middleware with proper HTTP status codes
6. **File storage paths**:
   - Driver photos: `uploads/drivers/`
   - Trip photos: `uploads/trips/`
   - License photos: `uploads/drivers/licenses/`

---

## 🚀 NEXT STEPS

1. ✅ Review this checklist with team
2. ⬜ Implement HIGH PRIORITY endpoints (6 endpoints)
3. ⬜ Add database schema enhancements (Employee model + TripIncident model)
4. ⬜ Test existing endpoints with Postman/mobile app
5. ⬜ Document API specifications for mobile team
6. ⬜ Implement MEDIUM PRIORITY enhancements
7. ⬜ Plan FUTURE PHASE features (fuel log, maintenance alerts)
