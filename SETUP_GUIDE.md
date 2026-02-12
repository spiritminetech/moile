# Setup Guide - Route Start Validation Fixes

## Quick Start (3 Steps)

### Step 1: Run the Seed Script
```bash
cd moile/backend
node scripts/seed-approved-locations.js
```

**Expected Output**:
```
✅ Connected to MongoDB
✅ Created: Main Depot (depot)
✅ Created: Worker Dormitory A (dormitory)
✅ Successfully seeded approved locations!
```

### Step 2: Register the Routes (if not auto-loaded)

Add to your main server file (e.g., `server.js` or `app.js`):

```javascript
import approvedLocationRoutes from './src/modules/location/approvedLocationRoutes.js';

// Register routes
app.use('/api/v1/approved-locations', approvedLocationRoutes);
```

### Step 3: Restart Your Server
```bash
npm start
# or
node server.js
```

---

## What Was Fixed

✅ **Fix 1**: Geofence validation for clock-in  
✅ **Fix 2**: Prevent starting task twice  
✅ **Fix 3**: Location validation for route start  

---

## Testing the Fixes

### Test 1: Clock-In from Approved Location ✅

**Request**:
```bash
curl -X POST http://localhost:5000/api/v1/driver/attendance/clock-in \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": 5,
    "location": {
      "latitude": 1.3521,
      "longitude": 103.8198
    },
    "preCheckCompleted": true
  }'
```

**Expected**: Success (inside Main Depot)

### Test 2: Clock-In from Outside ❌

**Request**:
```bash
curl -X POST http://localhost:5000/api/v1/driver/attendance/clock-in \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": 5,
    "location": {
      "latitude": 1.4000,
      "longitude": 103.9000
    },
    "preCheckCompleted": true
  }'
```

**Expected**: Error 403 - "Clock-in denied: You must be at an approved location"

### Test 3: Start Route (First Time) ✅

**Request**:
```bash
curl -X PUT http://localhost:5000/api/v1/driver/transport-tasks/101/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "en_route_pickup",
    "location": {
      "latitude": 1.3621,
      "longitude": 103.8298
    }
  }'
```

**Expected**: Success (task status: PLANNED → ONGOING)

### Test 4: Try to Start Route Again ❌

**Request**: Same as Test 3

**Expected**: Error 400 - "Cannot start route. Task is currently in ONGOING status"

---

## Approved Locations Created

| ID | Name | Type | Coordinates | Radius | Clock-In | Route Start |
|----|------|------|-------------|--------|----------|-------------|
| 1 | Main Depot | depot | 1.3521, 103.8198 | 100m | ✅ | ✅ |
| 2 | Worker Dormitory A | dormitory | 1.3621, 103.8298 | 150m | ✅ | ✅ |
| 3 | Worker Dormitory B | dormitory | 1.3721, 103.8398 | 150m | ✅ | ✅ |
| 4 | Equipment Yard | yard | 1.3421, 103.8098 | 200m | ✅ | ✅ |
| 5 | Head Office | office | 1.3321, 103.7998 | 50m | ✅ | ❌ |

---

## Managing Approved Locations

### View All Locations
```bash
GET /api/v1/approved-locations
```

### Create New Location
```bash
POST /api/v1/approved-locations
{
  "name": "New Depot",
  "type": "depot",
  "address": "123 New Street",
  "center": {
    "latitude": 1.3000,
    "longitude": 103.8000
  },
  "radius": 100,
  "allowedForClockIn": true,
  "allowedForRouteStart": true
}
```

### Update Location
```bash
PUT /api/v1/approved-locations/1
{
  "radius": 150,
  "active": true
}
```

### Delete Location
```bash
DELETE /api/v1/approved-locations/1
```

---

## Troubleshooting

### Issue: "No approved locations configured"
**Solution**: Run the seed script again
```bash
node scripts/seed-approved-locations.js
```

### Issue: Routes not working
**Solution**: Make sure routes are registered in your main server file

### Issue: Still can clock in from anywhere
**Solution**: Check if approved locations exist in database
```javascript
db.approvedLocations.find({ companyId: 1, active: true })
```

---

## Files Modified

1. ✅ `backend/src/modules/driver/driverController.js` - Added validations
2. ✅ `backend/src/modules/location/ApprovedLocation.js` - New model
3. ✅ `backend/src/modules/location/approvedLocationController.js` - New controller
4. ✅ `backend/src/modules/location/approvedLocationRoutes.js` - New routes
5. ✅ `backend/scripts/seed-approved-locations.js` - Seed script

---

## Summary

All three issues are now fixed:
- ✅ Drivers must be at approved location to clock in
- ✅ Drivers cannot start a task twice
- ✅ Drivers must be at approved location to start route

The system now properly validates all pre-start requirements!
