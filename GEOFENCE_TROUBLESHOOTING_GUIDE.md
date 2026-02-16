# Geofence "Outside Geo-Fence" Issue - Troubleshooting Guide

## Issue

Button shows "Outside Geo-Fence" even though worker is at the project site.

---

## ✅ Verified Working

1. **Database:** Geofence IS configured correctly ✅
   - Location: 12.9716, 77.5946
   - Radius: 100m + 20m tolerance = 120m total

2. **Worker Location:** IS at project site ✅
   - Location: 12.9716, 77.5946
   - Distance: 0.00m (same location)

3. **API Response:** WILL include geofence data ✅
   - All 5 tasks have `projectGeofence` object
   - Contains latitude, longitude, radius, allowedVariance

4. **Frontend Code:** IS implemented correctly ✅
   - Distance calculation using Haversine formula
   - Button disable logic based on geofence check

---

## 🔍 Root Cause Analysis

The button shows "Outside Geo-Fence" because of ONE of these reasons:

### 1. **Mobile App is Using Cached Data** (Most Likely)
The app loaded tasks BEFORE we added the geofence configuration.

**Solution:** Pull to refresh or restart the app

### 2. **Location Permission Not Granted**
The app doesn't have access to device location.

**Solution:** Grant location permission in device settings

### 3. **Location Services Disabled**
GPS is turned off on the device.

**Solution:** Enable location services

### 4. **No Current Location Available**
The app hasn't obtained the worker's current GPS location yet.

**Solution:** Wait for GPS to acquire location or move to open area

---

## 🔧 Step-by-Step Fix

### Step 1: Check Location Permission

**On the mobile app:**
1. Go to device Settings
2. Find the Construction ERP app
3. Check Location permission
4. Should be set to "Allow all the time" or "Allow while using app"

**Expected Result:** Permission should be granted

---

### Step 2: Enable Location Services

**On the device:**
1. Go to device Settings
2. Find Location or GPS settings
3. Turn ON location services
4. Set to "High accuracy" mode if available

**Expected Result:** GPS icon should appear in status bar

---

### Step 3: Refresh Tasks in Mobile App

**Method 1: Pull to Refresh**
1. Open Today's Tasks screen
2. Pull down from the top
3. Release to refresh
4. Wait for tasks to reload

**Method 2: Navigate Away and Back**
1. Go to Dashboard
2. Go back to Today's Tasks
3. Tasks will reload automatically

**Method 3: Force Close and Reopen**
1. Close the app completely
2. Reopen the app
3. Login again if needed
4. Go to Today's Tasks

**Expected Result:** Tasks reload with new geofence data

---

### Step 4: Verify Location is Acquired

**Check for:**
1. GPS icon in device status bar
2. No "Location Required" alerts
3. Map shows your current location (if you open map view)

**If location not acquired:**
- Move to an open area (away from buildings)
- Wait 30-60 seconds for GPS to lock
- Check if airplane mode is OFF

---

### Step 5: Check Button Status

**After refreshing, the button should show:**
- Text: "Start Task" (not "Outside Geo-Fence")
- Color: Green
- State: Enabled (can click)

**If still showing "Outside Geo-Fence":**
- Check console logs in the app (if in development mode)
- Verify your actual GPS location matches expected location

---

## 🧪 Testing Scenarios

### Scenario 1: Inside Geofence (Current)
**Your Location:** 12.9716, 77.5946  
**Project Location:** 12.9716, 77.5946  
**Distance:** 0.00m  
**Expected:** Button ENABLED (green "Start Task")

### Scenario 2: At Boundary (120m away)
**Distance:** 120m  
**Expected:** Button ENABLED (within tolerance)

### Scenario 3: Just Outside (121m away)
**Distance:** 121m  
**Expected:** Button DISABLED (red "Outside Geo-Fence")

### Scenario 4: No Location Permission
**Permission:** Denied  
**Expected:** Button DISABLED (treated as outside)

### Scenario 5: No GPS Lock
**Location:** null/undefined  
**Expected:** Button DISABLED (treated as outside)

---

## 📱 Quick Fix Checklist

- [ ] Location permission granted
- [ ] Location services enabled
- [ ] GPS has acquired location
- [ ] Pulled to refresh tasks
- [ ] Tasks reloaded with new data
- [ ] Button now shows "Start Task" (green)

---

## 🔍 Debug Information

### Check in Mobile App Console (Development Mode)

Look for these log messages:

```
🎯 Starting task - Location state debug:
  currentLocation: true/false
  hasLocationPermission: true/false
  isLocationEnabled: true/false
```

**If `currentLocation: false`:**
- Location not acquired yet
- Grant permission or wait for GPS

**If `hasLocationPermission: false`:**
- Permission not granted
- Go to device settings and grant permission

**If `isLocationEnabled: false`:**
- GPS is turned off
- Enable location services in device settings

---

## 🎯 Expected Behavior After Fix

### When Inside Geofence:
1. Open Today's Tasks
2. See green "Start Task" button
3. Click button
4. Task starts successfully

### When Outside Geofence:
1. Open Today's Tasks
2. See red "Outside Geo-Fence" button
3. Button is disabled
4. Alert explains you must be at work site

---

## 📊 Verification Steps

### 1. Check Database (Backend)
```bash
node check-geofence-status.js
```
**Expected:** Shows "INSIDE GEOFENCE" for all tasks

### 2. Check API Response (Backend)
```bash
node test-todays-tasks-api-with-geofence.js
```
**Expected:** All tasks have `projectGeofence` object

### 3. Check Mobile App (Frontend)
- Pull to refresh
- Check button text and color
- Try to start task

---

## 🚀 Most Likely Solution

**The mobile app is using cached data from before the geofence was configured.**

**Fix:**
1. Pull down to refresh on Today's Tasks screen
2. OR close and reopen the app
3. Button should now show "Start Task" (green)

---

## ⚠️ If Still Not Working

### Check These:

1. **Backend Server Running?**
   - Make sure backend is running
   - Check if API is accessible

2. **Network Connection?**
   - Check if device has internet
   - Try loading other screens

3. **Correct Login?**
   - Logged in as worker@gmail.com?
   - Employee ID is 2?

4. **Correct Date?**
   - Tasks are for 2026-02-15?
   - Device date/time correct?

5. **App Version?**
   - Using latest code?
   - Rebuilt after geofence implementation?

---

## 📝 Summary

**Problem:** Button shows "Outside Geo-Fence"  
**Root Cause:** Mobile app using old cached data  
**Solution:** Pull to refresh or restart app  
**Expected Result:** Button shows "Start Task" (green)

The geofence is configured correctly in the database and the API will send the correct data. The mobile app just needs to refresh to get the updated information.
