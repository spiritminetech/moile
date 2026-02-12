# Driver Screen - Button to Collection Mapping

This document shows which button triggers which API call and which database collections are accessed.

---

## 1. Dashboard Screen

### Button: "View Tasks" / Load Dashboard
- **API**: `GET /api/driver/dashboard/summary`
- **Collections Used**:
  - `FleetTask` - Get today's tasks for the driver
  - `FleetTaskPassenger` - Count total passengers
  - `FleetVehicle` - Get current vehicle details
  - `Employee` - Get driver information

---

## 2. Transport Tasks Screen

### Button: "Load Today's Tasks"
- **API**: `GET /api/driver/transport-tasks`
- **Collections Used**:
  - `FleetTask` - Get today's transport tasks
  - `Project` - Get project details
  - `FleetVehicle` - Get vehicle details
  - `FleetTaskPassenger` - Count passengers per task
  - `Employee` - Get driver info

### Button: "Start Route"
- **API**: `PUT /api/driver/transport-tasks/:taskId/status`
- **Collections Used**:
  - `FleetTask` - Update task status to ONGOING
  - `Attendance` - Validate driver has clocked in
  - `ApprovedLocation` - Validate driver is at approved location (geofence)

---

## 3. Route Navigation

### Button: "Get Worker Manifests"
- **API**: `GET /api/driver/transport-tasks/:taskId/worker-manifests`
- **Collections Used**:
  - `FleetTask` - Verify task belongs to driver
  - `FleetTaskPassenger` - Get all passengers for task
  - `Employee` - Get worker details
  - `Attendance` - Check today's attendance status

---

## 4. Worker Check-In

### Button: "Check In Worker"
- **API**: `POST /api/driver/pickup-locations/:locationId/check-in`
- **Collections Used**:
  - `FleetTaskPassenger` - Update pickup status to 'confirmed'
  - `FleetTask` - Get task details
  - `Attendance` - Create/update attendance record with check-in time

---

## 5. Pickup Completion

### Button: "Complete Pickup"
- **API**: `POST /api/driver/transport-tasks/:taskId/pickup-complete`
- **Collections Used**:
  - `FleetTask` - Update task status to PICKUP_COMPLETE or ENROUTE_DROPOFF
  - `FleetTaskPassenger` - Check if all passengers picked up
  - `Project` - Get project details for response
  - `FleetVehicle` - Get vehicle details for response

---

## 6. Dropoff Completion

### Button: "Complete Dropoff"
- **API**: `POST /api/driver/transport-tasks/:taskId/dropoff-complete`
- **Collections Used**:
  - `FleetTask` - Update task to COMPLETED status
  - `FleetTaskPassenger` - Update drop status for workers
  - `Project` - Get project details
  - `FleetVehicle` - Get vehicle details

---

## 7. Attendance Screen

### Button: "Clock In"
- **API**: `POST /api/driver/attendance/clock-in`
- **Collections Used**:
  - `Attendance` - Create attendance record with check-in time
  - `ApprovedLocation` - Validate geofence

### Button: "Clock Out"
- **API**: `POST /api/driver/attendance/clock-out`
- **Collections Used**:
  - `Attendance` - Update attendance record with check-out time

---

## 8. Vehicle Info Screen

### Button: "Load Vehicle Details"
- **API**: `GET /api/driver/vehicle/details`
- **Collections Used**:
  - `FleetTask` - Get today's tasks to find assigned vehicle
  - `FleetVehicle` - Get complete vehicle information

### Button: "View Maintenance Alerts"
- **API**: `GET /api/driver/vehicle/maintenance-alerts`
- **Collections Used**:
  - `FleetTask` - Get today's vehicle assignment
  - `FleetVehicle` - Get vehicle maintenance data

---

## 9. Trip History

### Button: "Load Trip History"
- **API**: `GET /api/driver/trip-history?startDate=...&endDate=...`
- **Collections Used**:
  - `FleetTask` - Get completed trips in date range
  - `Project` - Get project names
  - `FleetVehicle` - Get vehicle details
  - `FleetTaskPassenger` - Count passengers per trip

---

## 10. Profile Screen

### Button: "Load Profile"
- **API**: `GET /api/driver/profile`
- **Collections Used**:
  - `Company` - Get company details
  - `User` - Get user account details
  - `Driver` - Get driver-specific details
  - `Employee` - Get employee details
  - `FleetVehicle` - Get assigned vehicles
  - `FleetTask` - Calculate performance metrics

---

## Quick Reference: Collections by Feature

### Core Task Management
- `FleetTask` - Main task/trip records
- `FleetTaskPassenger` - Worker assignments to tasks
- `FleetVehicle` - Vehicle information

### Worker & Driver Data
- `Employee` - Worker and driver personal details
- `Driver` - Driver-specific information (license, etc.)
- `Attendance` - Check-in/check-out records

### Supporting Data
- `Project` - Project information
- `Company` - Company details
- `User` - User account information
- `ApprovedLocation` - Geofence validation

---

## Data Flow Summary

1. **Button Click** → Triggers API call
2. **API Endpoint** → Calls backend controller
3. **Backend Controller** → Queries database collections
4. **Database Collections** → Return data
5. **Response** → Sent back to mobile app
6. **UI Update** → Display data to driver
