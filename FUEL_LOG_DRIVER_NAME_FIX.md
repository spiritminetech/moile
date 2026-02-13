# Fuel Log Driver Name Fix

## ❌ Problem
Fuel log entries were showing `"driverName": "Unknown Driver"` instead of the actual driver's name.

**Example of bad data:**
```json
{
  "driverId": 50,
  "driverName": "Unknown Driver",  // ❌ Wrong!
  "amount": 15,
  "cost": 1500
}
```

## 🔍 Root Cause

The code was trying to get the driver name from the `drivers` collection directly:
```javascript
driverName: driver.name || driver.username || 'Unknown Driver'
```

**Problem:** The `drivers` collection doesn't have a `name` field. It has an `employeeId` field that links to the `employees` collection where the actual name is stored.

## 📊 Database Structure

### drivers collection:
```javascript
{
  id: 50,
  employeeId: 123,  // ← Links to employees collection
  username: "driver50",
  // NO name field here!
}
```

### employees collection:
```javascript
{
  id: 123,
  name: "John Smith",  // ← Actual name is here!
  fullName: "John Smith",
  companyId: 1
}
```

## ✅ Solution

Updated the code to:
1. Get driver record from `drivers` collection
2. Get `employeeId` from driver record
3. Look up employee in `employees` collection using `employeeId`
4. Get `name` or `fullName` from employee record

**Fixed Code:**
```javascript
// Get driver record
const driver = await Driver.findOne({ id: driverId, companyId });

// Get driver name from employees collection using employeeId
let driverName = 'Unknown Driver';
if (driver.employeeId) {
  const employee = await Employee.findOne({ 
    id: driver.employeeId, 
    companyId 
  });
  
  if (employee) {
    driverName = employee.name || employee.fullName || 'Unknown Driver';
  } else {
    // Fallback to driver record name fields
    driverName = driver.name || driver.username || 'Unknown Driver';
  }
} else {
  // Fallback to driver record name fields
  driverName = driver.name || driver.username || 'Unknown Driver';
}
```

## 📝 Changes Made

### File: `moile/backend/src/modules/driver/driverController.js`

**Function:** `submitFuelLog`

**Before:**
```javascript
const driver = await Driver.findOne({ id: driverId, companyId });
// ...
driverName: driver.name || driver.username || 'Unknown Driver'
```

**After:**
```javascript
const driver = await Driver.findOne({ id: driverId, companyId });

// Get driver name from employees collection using employeeId
let driverName = 'Unknown Driver';
if (driver.employeeId) {
  const employee = await Employee.findOne({ 
    id: driver.employeeId, 
    companyId 
  });
  
  if (employee) {
    driverName = employee.name || employee.fullName || 'Unknown Driver';
  } else {
    driverName = driver.name || driver.username || 'Unknown Driver';
  }
} else {
  driverName = driver.name || driver.username || 'Unknown Driver';
}
// ...
driverName: driverName
```

## 🔧 Fix Existing Data

A script has been created to fix existing fuel log entries that have "Unknown Driver".

**File:** `moile/backend/fix-fuel-log-driver-names.js`

**To run:**
```bash
cd moile/backend
node fix-fuel-log-driver-names.js
```

**What it does:**
1. Finds all fuel logs with "Unknown Driver"
2. For each fuel log:
   - Gets driver record using `driverId`
   - Gets employee record using `driver.employeeId`
   - Updates fuel log with correct driver name
3. Shows summary of updates

**Example output:**
```
📋 Found 5 fuel log entries to fix

🔍 Processing fuel log ID: 1
   Driver ID: 50
   Current name: "Unknown Driver"
   ✅ Found driver record
   Employee ID: 123
   ✅ Found employee: John Smith
   ✅ Updated to: "John Smith"

📊 Summary:
   Total fuel logs processed: 5
   ✅ Successfully updated: 5
   ❌ Failed: 0
```

## ✅ Result

### Before Fix:
```json
{
  "driverId": 50,
  "driverName": "Unknown Driver",
  "amount": 15,
  "cost": 1500
}
```

### After Fix:
```json
{
  "driverId": 50,
  "driverName": "John Smith",  // ✅ Correct name from employees collection
  "amount": 15,
  "cost": 1500
}
```

## 🧪 Testing

### Test New Fuel Log Entries:

1. **Check driver's employeeId:**
   ```javascript
   db.drivers.findOne({ id: 50 })
   // Should show: { id: 50, employeeId: 123, ... }
   ```

2. **Check employee's name:**
   ```javascript
   db.employees.findOne({ id: 123 })
   // Should show: { id: 123, name: "John Smith", ... }
   ```

3. **Submit fuel log via app**

4. **Verify fuel log has correct name:**
   ```javascript
   db.fuelLogs.findOne({ driverId: 50 })
   // Should show: { driverId: 50, driverName: "John Smith", ... }
   ```

## 📋 Fallback Logic

The code has multiple fallback levels:

1. **Primary:** Get name from `employees` collection via `employeeId`
2. **Fallback 1:** Use `driver.name` if exists
3. **Fallback 2:** Use `driver.username` if exists
4. **Fallback 3:** Use "Unknown Driver" as last resort

This ensures we always get the best available name.

## 🔍 Debugging

If driver name is still "Unknown Driver", check:

1. **Does driver have employeeId?**
   ```javascript
   db.drivers.findOne({ id: 50 })
   // Check if employeeId field exists
   ```

2. **Does employee exist?**
   ```javascript
   db.employees.findOne({ id: <employeeId> })
   // Should return employee record
   ```

3. **Does employee have name?**
   ```javascript
   db.employees.findOne({ id: <employeeId> })
   // Check if name or fullName field exists
   ```

4. **Check backend logs:**
   ```
   ✅ Found driver name from employee: John Smith (employeeId: 123)
   ```
   or
   ```
   ⚠️ Employee not found for employeeId: 123
   ```

## 📊 Summary

**Problem:** Driver name showing "Unknown Driver"

**Root Cause:** Name is in `employees` collection, not `drivers` collection

**Solution:** Look up employee using `driver.employeeId` to get actual name

**Files Changed:**
- ✅ `moile/backend/src/modules/driver/driverController.js` (submitFuelLog function)

**Script Created:**
- ✅ `moile/backend/fix-fuel-log-driver-names.js` (to fix existing data)

**Result:** All new fuel log entries will have correct driver names from employees collection
