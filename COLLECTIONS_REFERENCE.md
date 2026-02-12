# Route Start - Collections Reference

## Which Collections Are Checked/Updated

### 1. Driver Logged In (Attendance)
**Collection:** `attendance`
**Action:** READ (query only)
**Purpose:** Verify driver clocked in today with GPS

### 2. Approved Location (Geofence)
**Collection:** `approvedLocations` 
**Action:** READ (query only)
**Purpose:** Validate driver at depot/dormitory/yard

**Types:** depot, dormitory, yard, office, other

### 3. Vehicle Assignment
**Collections:** `drivers` + `fleetVehicles`
**Action:** READ (query only)
**Purpose:** Confirm vehicle assigned to driver

### 4. Task Status
**Collection:** `fleetTasks`
**Action:** WRITE (updated)
**Purpose:** Change status from PLANNED to ONGOING

## Approved Location vs Project Location

### Approved Locations (for DRIVERS)
- **Collection:** `approvedLocations`
- **Types:** depot, dormitory, yard
- **Used for:** Driver clock-in and route start
- **Fields:** name, type, center (lat/lng), radius

### Project Locations (for WORKERS)
- **Collection:** `projects`
- **Used for:** Worker attendance at project sites
- **NOT used for driver route start**
- **Fields:** geofence.center (lat/lng), geofence.radius

## Summary

**Only `fleetTasks` is UPDATED on route start**
All other collections are READ-ONLY for validation.

Driver location validated against `approvedLocations` (depot/dormitory/yard), NOT project locations.
