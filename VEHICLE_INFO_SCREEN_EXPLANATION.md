# Vehicle Information Screen - Complete Button Guide

## Overview
The Vehicle Information screen displays comprehensive vehicle details, maintenance status, and provides quick action buttons for drivers. The screen auto-refreshes and shows real-time vehicle data.

---

## 🔄 Real-Time Data Updates

### Auto-Refresh Behavior
- **Pull-to-refresh**: Swipe down to manually refresh all data
- **Refresh button**: Top-right corner button (↻) to reload data
- **Last Updated**: Shows timestamp at bottom of screen
- **Data Source**: All data comes from backend API in real-time

### What Updates in Real-Time:
1. **Vehicle Status**: Current mileage, fuel level
2. **Maintenance Alerts**: New alerts from backend
3. **Fuel Log**: Recent fuel entries
4. **Maintenance Schedule**: Updated service schedules
5. **Insurance/Road Tax**: Expiry status changes

---

## 📊 Information Sections

### 1. Vehicle Details Card
**Displays:**
- Vehicle plate number (e.g., 🚛 ABC-1234)
- Vehicle model and year
- Assigned driver name
- Passenger capacity
- Fuel type (Diesel/Petrol)
- Current mileage (in km)
- Fuel level (% with color coding):
  - 🔴 Red: ≤20% (Critical)
  - 🟡 Yellow: 21-40% (Low)
  - 🟢 Green: >40% (Good)

**Insurance Information:**
- Provider name
- Policy number
- Expiry date with status:
  - 🔴 EXPIRED
  - 🟡 EXPIRING_SOON
  - 🟢 ACTIVE

**Road Tax Information:**
- Valid until date
- Status (EXPIRED/EXPIRING_SOON/ACTIVE)

**Database Collection:** `vehicles`

---

### 2. Assigned Route Section
**Displays:**
- Route name and code
- List of pickup locations (numbered)
- Drop-off location
- Estimated distance (km)
- Estimated duration (minutes)

**Database Collection:** `routes` (linked to vehicle)

---

### 3. Maintenance Alerts Card
**Shows:**
- Alert type (e.g., OIL_CHANGE, TIRE_ROTATION)
- Priority level:
  - 🔴 CRITICAL
  - 🟡 HIGH
  - 🔵 MEDIUM
  - ⚪ LOW
- Description of maintenance needed
- Due date
- Due mileage (if applicable)
- Estimated cost

**Database Collection:** `maintenanceAlerts`

---

### 4. Recent Fuel Log Card
**Displays last 5 fuel entries:**
- Date of fuel entry
- Amount (liters)
- Cost ($)
- Mileage at time of fueling
- Location (gas station)
- Receipt photo indicator (if attached)

**Database Collection:** `fuelLogs`

---

### 5. Maintenance Schedule Card
**Shows upcoming services:**
- Service type (OIL_CHANGE, TIRE_ROTATION, etc.)
- Status with color coding:
  - 🔴 OVERDUE
  - 🟡 DUE
  - 🟢 UPCOMING
- Due date
- Due mileage

**Database Collection:** `maintenanceSchedule` (embedded in vehicle document)

---

## 🎯 Action Buttons Explained

### Button 1: ⛽ Log Fuel (in Vehicle Details Card)
**Purpose:** Record fuel purchases and consumption

**When Clicked:**
- Opens FuelLogModal
- Driver enters:
  - Fuel amount (liters)
  - Cost ($)
  - Current mileage
  - Location (gas station name)
  - Optional: Receipt photo

**Database Action:**
- Creates new entry in `fuelLogs` collection
- Updates vehicle's `fuelLog` array
- Updates vehicle's `fuelLevel` if provided

**API Endpoint:** `POST /api/driver/fuel-log`

---

### Button 2: 🔧 Report Issue (in Vehicle Details Card)
**Purpose:** Report vehicle problems immediately

**When Clicked:**
- Shows issue category selection:
  1. **Mechanical Issue** (engine, transmission, brakes)
  2. **Electrical Issue** (lights, battery, electronics)
  3. **Safety Concern** (seatbelts, airbags, structural)
  4. **Other Issue** (general problems)

**Future Implementation Will Include:**
- Issue description text field
- Severity level (Low/Medium/High/Critical)
- Photo attachments
- Current GPS location
- "Immediate assistance needed?" checkbox

**Database Action:**
- Creates entry in `vehicleIssues` collection
- Notifies maintenance team
- Updates vehicle status if critical

**API Endpoint:** `POST /api/driver/vehicle-issue` (to be implemented)

---

### Button 3: 🔍 Vehicle Pre-Check
**Purpose:** Perform pre-trip safety inspection

**When Clicked:**
- Opens pre-trip inspection checklist

**Future Implementation Will Include:**
- Tire condition and pressure check
- Lights and signals test
- Brakes and steering check
- Fluid levels verification
- Safety equipment inspection
- Interior/exterior condition
- Photo documentation
- Digital signature

**Database Action:**
- Creates entry in `vehicleInspections` collection
- Records timestamp and driver
- Stores checklist results
- Flags any failed items

**API Endpoint:** `POST /api/driver/pre-check` (to be implemented)

---

### Button 4: ⛽ Log Fuel Entry (in Quick Actions)
**Purpose:** Same as Button 1 (duplicate for convenience)

See Button 1 explanation above.

---

### Button 5: 🔧 Report Vehicle Issue (in Quick Actions)
**Purpose:** Same as Button 2 (duplicate for convenience)

See Button 2 explanation above.

---

### Button 6: 📋 View Maintenance History
**Purpose:** View complete maintenance schedule and history

**When Clicked:**
- Shows alert with maintenance summary:
  - **OVERDUE items** (red) - immediate attention needed
  - **UPCOMING items** (yellow) - scheduled soon
  - Due dates and mileage for each item

**Data Source:**
- Reads from `vehicle.maintenanceSchedule` array
- Filters by status (overdue/due/upcoming)

**No Database Write** - Read-only display

---

### Button 7: 📋 View Full Schedule (in Maintenance Alerts Card)
**Purpose:** Same as Button 6

See Button 6 explanation above.

---

### Button 8: 🚨 Emergency Assistance
**Purpose:** Request immediate help for emergencies

**When Clicked:**
- Shows emergency type selection:
  1. **Vehicle Breakdown** - mechanical failure, can't move
  2. **Medical Emergency** - health emergency

**For Vehicle Breakdown:**
- Sends emergency notification to dispatch
- Records incident in system
- Dispatch contacts driver

**For Medical Emergency:**
- Shows emergency contact numbers
- Reminds to call 911 first
- Shows company emergency line

**Database Action:**
- Creates entry in `emergencyIncidents` collection
- Records:
  - Incident type
  - Timestamp
  - Driver location (GPS)
  - Vehicle ID
  - Driver ID
- Triggers notification to dispatch

**API Endpoint:** `POST /api/driver/emergency-assistance`

---

## 📱 Database Collections Used

### 1. `vehicles` Collection
```javascript
{
  id: number,
  plateNumber: string,
  model: string,
  year: number,
  vehicleType: string,
  capacity: number,
  fuelType: string,
  currentMileage: number,
  fuelLevel: number,
  assignedDriverId: number,
  assignedDriverName: string,
  insurance: {
    provider: string,
    policyNumber: string,
    expiryDate: Date,
    status: 'active' | 'expiring_soon' | 'expired'
  },
  roadTax: {
    validUntil: Date,
    status: 'active' | 'expiring_soon' | 'expired'
  },
  assignedRoute: {
    routeId: number,
    routeName: string,
    routeCode: string,
    pickupLocations: string[],
    dropoffLocation: string,
    estimatedDistance: number,
    estimatedDuration: number
  },
  maintenanceSchedule: [{
    type: string,
    dueDate: Date,
    dueMileage: number,
    status: 'upcoming' | 'due' | 'overdue'
  }],
  fuelLog: [{
    id: number,
    date: Date,
    amount: number,
    cost: number,
    mileage: number,
    location: string,
    receiptPhoto?: string
  }]
}
```

### 2. `maintenanceAlerts` Collection
```javascript
{
  id: number,
  vehicleId: number,
  type: string,
  description: string,
  priority: 'critical' | 'high' | 'medium' | 'low',
  dueDate: Date,
  dueMileage?: number,
  estimatedCost?: number,
  status: 'pending' | 'scheduled' | 'completed'
}
```

### 3. `fuelLogs` Collection
```javascript
{
  id: number,
  vehicleId: number,
  driverId: number,
  date: Date,
  amount: number,
  cost: number,
  mileage: number,
  location: string,
  receiptPhoto?: string
}
```

### 4. `vehicleIssues` Collection (Future)
```javascript
{
  id: number,
  vehicleId: number,
  driverId: number,
  reportedAt: Date,
  category: 'mechanical' | 'electrical' | 'safety' | 'other',
  description: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  photos: string[],
  location: { lat: number, lng: number },
  immediateAssistance: boolean,
  status: 'reported' | 'acknowledged' | 'in_progress' | 'resolved'
}
```

### 5. `vehicleInspections` Collection (Future)
```javascript
{
  id: number,
  vehicleId: number,
  driverId: number,
  inspectionDate: Date,
  checklist: {
    tires: 'pass' | 'fail',
    lights: 'pass' | 'fail',
    brakes: 'pass' | 'fail',
    fluids: 'pass' | 'fail',
    safetyEquipment: 'pass' | 'fail',
    // ... more items
  },
  photos: string[],
  notes: string,
  signature: string,
  overallStatus: 'pass' | 'fail'
}
```

### 6. `emergencyIncidents` Collection
```javascript
{
  id: number,
  vehicleId: number,
  driverId: number,
  incidentType: 'breakdown' | 'medical' | 'accident',
  reportedAt: Date,
  location: { lat: number, lng: number },
  description: string,
  status: 'reported' | 'dispatched' | 'resolved',
  resolvedAt?: Date
}
```

---

## 🔄 API Endpoints

### GET Endpoints (Read Data)
1. `GET /api/driver/vehicle` - Get assigned vehicle info
2. `GET /api/driver/maintenance-alerts` - Get maintenance alerts

### POST Endpoints (Write Data)
1. `POST /api/driver/fuel-log` - Submit fuel log entry
2. `POST /api/driver/vehicle-issue` - Report vehicle issue (future)
3. `POST /api/driver/pre-check` - Submit pre-trip inspection (future)
4. `POST /api/driver/emergency-assistance` - Request emergency help

---

## 💡 Key Features

### Color Coding System
- **Fuel Level**: Red (≤20%), Yellow (21-40%), Green (>40%)
- **Alert Priority**: Red (Critical), Yellow (High), Blue (Medium), Gray (Low)
- **Maintenance Status**: Red (Overdue), Yellow (Due), Green (Upcoming)
- **Expiry Status**: Red (Expired), Yellow (Expiring Soon), Green (Active)

### Offline Support
- Shows offline indicator when no internet
- Disables refresh when offline
- Caches last loaded data

### User Experience
- Pull-to-refresh for manual updates
- Loading indicators during data fetch
- Error handling with retry option
- Last updated timestamp
- Smooth scrolling with proper spacing

---

## 🎯 Summary

**Total Buttons: 8** (some are duplicates for convenience)

**Fully Implemented:**
1. ⛽ Log Fuel (2 instances)
2. 📋 View Maintenance History (2 instances)

**Partially Implemented:**
3. 🔧 Report Issue (shows categories, full form pending)
4. 🔍 Vehicle Pre-Check (shows description, full checklist pending)
5. 🚨 Emergency Assistance (shows options, backend integration pending)

**All buttons are designed for real-time usage** - they either display current data from the database or allow drivers to submit new data that immediately updates the backend.
