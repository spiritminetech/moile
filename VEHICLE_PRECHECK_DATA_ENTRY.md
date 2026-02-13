# Vehicle Pre-Check - Data Entry Details

## 📱 What Happens When Driver Clicks "Vehicle Pre-Check"

### Step-by-Step User Flow:

```
Driver clicks "🔍 Vehicle Pre-Check" button
  ↓
Modal opens with inspection checklist
  ↓
Driver inspects each item and marks Pass/Fail
  ↓
Driver adds notes/photos for failed items
  ↓
Driver signs digitally
  ↓
System calculates overall status
  ↓
Data saved to vehicleInspections collection
```

---

## 📋 Inspection Checklist Items

### 12 Safety Items to Check:

#### 1. 🚗 **Tires**
**What to check:**
- Tire pressure (proper inflation)
- Tire tread depth (not worn out)
- No visible damage (cuts, bulges)
- All tires present (including spare)

**Driver marks:** ✅ Pass / ❌ Fail / ⚠️ Needs Attention

**If Fail/Needs Attention:**
- Add notes: "Front left tire low pressure"
- Add photo: Picture of the tire

---

#### 2. 💡 **Lights**
**What to check:**
- Headlights (both working)
- Brake lights (working)
- Turn signals (all 4 working)
- Hazard lights (working)
- Interior lights (working)

**Driver marks:** ✅ Pass / ❌ Fail / ⚠️ Needs Attention

**If Fail:**
- Add notes: "Right brake light not working"
- Add photo: Picture of the light

---

#### 3. 🛑 **Brakes**
**What to check:**
- Brake pedal feels firm (not spongy)
- No strange noises when braking
- Parking brake holds vehicle
- Brake warning light not on

**Driver marks:** ✅ Pass / ❌ Fail / ⚠️ Needs Attention

**If Fail:**
- Add notes: "Brake pedal feels soft"
- Add photo: Dashboard warning light

---

#### 4. 🎯 **Steering**
**What to check:**
- Steering wheel turns smoothly
- No excessive play in steering
- No strange noises when turning
- Power steering working

**Driver marks:** ✅ Pass / ❌ Fail / ⚠️ Needs Attention

---

#### 5. 🛢️ **Fluid Levels**
**What to check:**
- Engine oil level (check dipstick)
- Coolant level (check reservoir)
- Brake fluid level
- Windshield washer fluid
- No visible leaks under vehicle

**Driver marks:** ✅ Pass / ❌ Fail / ⚠️ Needs Attention

**If Fail:**
- Add notes: "Engine oil low"
- Add photo: Dipstick reading

---

#### 6. 🪞 **Mirrors**
**What to check:**
- All mirrors present
- Mirrors clean and visible
- Mirrors properly adjusted
- No cracks or damage

**Driver marks:** ✅ Pass / ❌ Fail / ⚠️ Needs Attention

---

#### 7. 🔒 **Seatbelts**
**What to check:**
- All seatbelts present
- Seatbelts retract properly
- Buckles work correctly
- No fraying or damage

**Driver marks:** ✅ Pass / ❌ Fail / ⚠️ Needs Attention

---

#### 8. 📢 **Horn**
**What to check:**
- Horn works when pressed
- Horn is loud enough

**Driver marks:** ✅ Pass / ❌ Fail / ⚠️ Needs Attention

---

#### 9. 🌧️ **Windshield Wipers**
**What to check:**
- Wipers work on all speeds
- Wiper blades not torn
- Windshield clean
- No cracks in windshield

**Driver marks:** ✅ Pass / ❌ Fail / ⚠️ Needs Attention

---

#### 10. 🚨 **Emergency Equipment**
**What to check:**
- First aid kit present
- Fire extinguisher present and charged
- Warning triangle present
- Spare tire and jack present
- Emergency contact numbers visible

**Driver marks:** ✅ Pass / ❌ Fail / ⚠️ Needs Attention

---

#### 11. 🧹 **Interior Cleanliness**
**What to check:**
- Cabin clean
- No trash or debris
- Seats clean
- Floor mats in place

**Driver marks:** ✅ Pass / ❌ Fail / ⚠️ Needs Attention

---

#### 12. 🚙 **Exterior Condition**
**What to check:**
- No new dents or scratches
- All doors open/close properly
- Fuel cap secure
- License plates visible
- Vehicle registration visible

**Driver marks:** ✅ Pass / ❌ Fail / ⚠️ Needs Attention

---

## 📊 Additional Data Collected

### 1. **Odometer Reading**
- Driver enters current mileage
- Example: 45,230 km
- Used to track vehicle usage

### 2. **GPS Location**
- Automatically captured
- Shows where inspection was done
- Latitude, Longitude, Address

### 3. **Digital Signature**
- Driver signs on screen
- Confirms inspection was done
- Legal proof of inspection

### 4. **Overall Status**
System automatically calculates:
- **PASS** - All items pass, can start trip
- **CONDITIONAL PASS** - Minor issues, can start with caution
- **FAIL** - Critical issues, cannot start trip

---

## 💾 Data Saved to Database

### Example Entry in `vehicleInspections` Collection:

```json
{
  "id": 1,
  "vehicleId": 1,
  "driverId": 50,
  "driverName": "John Smith",
  "companyId": 1,
  "inspectionDate": "2026-02-13T06:30:00Z",
  "inspectionType": "pre_trip",
  
  "checklist": {
    "tires": {
      "status": "pass",
      "notes": "",
      "photos": []
    },
    "lights": {
      "status": "fail",
      "notes": "Right brake light not working",
      "photos": ["https://storage.com/photo1.jpg"]
    },
    "brakes": {
      "status": "pass",
      "notes": "",
      "photos": []
    },
    "steering": {
      "status": "pass",
      "notes": "",
      "photos": []
    },
    "fluids": {
      "status": "needs_attention",
      "notes": "Engine oil slightly low",
      "photos": ["https://storage.com/photo2.jpg"]
    },
    "mirrors": {
      "status": "pass",
      "notes": "",
      "photos": []
    },
    "seatbelts": {
      "status": "pass",
      "notes": "",
      "photos": []
    },
    "horn": {
      "status": "pass",
      "notes": "",
      "photos": []
    },
    "wipers": {
      "status": "pass",
      "notes": "",
      "photos": []
    },
    "emergencyEquipment": {
      "status": "pass",
      "notes": "",
      "photos": []
    },
    "interior": {
      "status": "pass",
      "notes": "",
      "photos": []
    },
    "exterior": {
      "status": "pass",
      "notes": "",
      "photos": []
    }
  },
  
  "overallStatus": "conditional_pass",
  "canProceed": true,
  
  "issuesFound": [
    {
      "item": "lights",
      "severity": "medium",
      "description": "Right brake light not working",
      "actionRequired": "Replace brake light bulb"
    },
    {
      "item": "fluids",
      "severity": "low",
      "description": "Engine oil slightly low",
      "actionRequired": "Top up engine oil"
    }
  ],
  
  "odometerReading": 45230,
  
  "location": {
    "latitude": 25.2048,
    "longitude": 55.2708,
    "address": "Company Parking Lot, Main Street"
  },
  
  "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  
  "createdAt": "2026-02-13T06:35:00Z",
  "updatedAt": "2026-02-13T06:35:00Z"
}
```

---

## 🎯 What Happens After Submission

### If Overall Status = PASS ✅
```
✅ All items passed
  ↓
Driver can start trip
  ↓
FleetTask status changes to "in_progress"
  ↓
No issues created
```

### If Overall Status = CONDITIONAL PASS ⚠️
```
⚠️ Minor issues found
  ↓
Driver can start trip with caution
  ↓
VehicleIssue created automatically for each problem
  ↓
Maintenance team notified
  ↓
Issues must be fixed before next inspection
```

### If Overall Status = FAIL ❌
```
❌ Critical issues found
  ↓
Driver CANNOT start trip
  ↓
VehicleIssue created with "critical" severity
  ↓
Vehicle status changed to "needs_repair"
  ↓
Supervisor notified immediately
  ↓
Alternate vehicle must be assigned
```

---

## 📱 Mobile App UI Flow

### Screen 1: Inspection Checklist
```
┌─────────────────────────────────┐
│  🔍 Vehicle Pre-Check           │
│  Vehicle: ABC123                │
│  Date: Feb 13, 2026 6:30 AM     │
├─────────────────────────────────┤
│                                 │
│  ☐ Tires                        │
│     ✅ Pass  ❌ Fail  ⚠️ Attention│
│                                 │
│  ☐ Lights                       │
│     ✅ Pass  ❌ Fail  ⚠️ Attention│
│                                 │
│  ☐ Brakes                       │
│     ✅ Pass  ❌ Fail  ⚠️ Attention│
│                                 │
│  ... (9 more items)             │
│                                 │
│  [Next]                         │
└─────────────────────────────────┘
```

### Screen 2: Issue Details (if Fail/Needs Attention)
```
┌─────────────────────────────────┐
│  ❌ Lights - Failed              │
├─────────────────────────────────┤
│                                 │
│  Describe the issue:            │
│  ┌───────────────────────────┐ │
│  │ Right brake light not     │ │
│  │ working                   │ │
│  └───────────────────────────┘ │
│                                 │
│  📷 Add Photo (Optional)        │
│  [Take Photo] [Choose Photo]   │
│                                 │
│  [Back]  [Save & Continue]     │
└─────────────────────────────────┘
```

### Screen 3: Odometer & Signature
```
┌─────────────────────────────────┐
│  📊 Final Details               │
├─────────────────────────────────┤
│                                 │
│  Current Odometer Reading:      │
│  ┌───────────────────────────┐ │
│  │ 45230 km                  │ │
│  └───────────────────────────┘ │
│                                 │
│  Driver Signature:              │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  │   [Signature Area]        │ │
│  │                           │ │
│  └───────────────────────────┘ │
│  [Clear]                        │
│                                 │
│  [Cancel]  [Submit Inspection] │
└─────────────────────────────────┘
```

### Screen 4: Results
```
┌─────────────────────────────────┐
│  ⚠️ Inspection Complete          │
├─────────────────────────────────┤
│                                 │
│  Status: CONDITIONAL PASS       │
│                                 │
│  Issues Found: 2                │
│  • Right brake light not working│
│  • Engine oil slightly low      │
│                                 │
│  ⚠️ You can proceed with caution│
│                                 │
│  These issues have been reported│
│  to maintenance team.           │
│                                 │
│  [View Issues]  [Start Trip]   │
└─────────────────────────────────┘
```

---

## 📊 Summary

### Data Entry Required:
1. **12 Checklist Items** - Pass/Fail/Needs Attention for each
2. **Notes** - For failed items (optional but recommended)
3. **Photos** - For failed items (optional but recommended)
4. **Odometer Reading** - Current mileage (required)
5. **Digital Signature** - Driver confirmation (required)

### Auto-Captured Data:
- GPS location
- Date/time
- Driver ID and name
- Vehicle ID
- Company ID
- Overall status (calculated)

### Time to Complete:
- **Quick inspection:** 3-5 minutes (all pass)
- **With issues:** 5-10 minutes (photos and notes)

### Result:
- Saved to `vehicleInspections` collection
- Creates `VehicleIssue` entries if problems found
- Blocks trip start if critical failure
- Legal proof of inspection completed

---

## 🎯 Key Benefits

1. **Legal Compliance** - Documented proof of inspection
2. **Safety** - Catches problems before trip starts
3. **Accountability** - Driver signature confirms inspection
4. **Traceability** - Full audit trail with photos
5. **Proactive Maintenance** - Issues reported before they become critical

This is a standard, professional vehicle inspection system used by fleet management companies worldwide!
