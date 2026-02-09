# Attendance Monitoring - Current Status & Issues

## Date: February 7, 2026

---

## ✅ What's Working

### 1. Test Data Created Successfully
- ✅ 5 attendance records in database for today (2026-02-07)
- ✅ 4 pending correction requests in `attendancecorrections` collection
- ✅ Task assignments created for all workers
- ✅ Data is properly structured and valid

### 2. Navigation
- ✅ Team tab accessible
- ✅ "📊 Attendance Monitoring" card visible in Team Management screen
- ✅ "Open Attendance Monitoring" button works
- ✅ Attendance Monitoring screen loads

### 3. API Endpoint
- ✅ `/api/supervisor/attendance-monitoring` endpoint responds
- ✅ Returns 200 status
- ✅ Returns worker list (5 workers)

---

## ❌ Current Issues

### Issue #1: Timezone Mismatch in Date Query

**Problem:**
The attendance records are stored with dates in UTC timezone, but the API query uses local timezone (IST), causing a mismatch.

**Evidence:**
```
Attendance Record Date (stored): 2026-02-06T18:30:00.000Z (Feb 6 UTC = Feb 7 IST)
API Query Date Range: >= 2026-02-07T05:30:00.000Z (Feb 7 05:30 IST)
Result: No match found
```

**Impact:**
- Workers show as "ABSENT" even though attendance records exist
- `attendanceId: null` for all workers
- Check-in/check-out times not displayed

**Location:**
`backend/src/modules/supervisor/supervisorController.js` - `getAttendanceMonitoring` function

**Fix Needed:**
```javascript
// Current (problematic):
const attendanceRecords = await Attendance.find({
  date: {
    $gte: new Date(workDate),  // This creates local timezone date
    $lt: new Date(new Date(workDate).setDate(new Date(workDate).getDate() + 1))
  }
});

// Should be (UTC-based):
const startOfDay = new Date(workDate + 'T00:00:00.000Z');
const endOfDay = new Date(workDate + 'T23:59:59.999Z');
const attendanceRecords = await Attendance.find({
  date: {
    $gte: startOfDay,
    $lt: endOfDay
  }
});
```

---

### Issue #2: Pending Corrections Not Loaded

**Problem:**
The `loadPendingCorrections()` function in the mobile app is a placeholder that sets an empty array.

**Evidence:**
```typescript
const loadPendingCorrections = useCallback(async () => {
  try {
    // This would be a separate API endpoint for pending corrections
    // For now, we'll simulate with empty array
    setPendingCorrections([]);
  } catch (error) {
    console.error('Failed to load pending corrections:', error);
  }
}, []);
```

**Impact:**
- Yellow "⚠️ Pending Corrections" alert card never appears
- "Review Corrections" button not visible
- Modal cannot be tested

**Location:**
`ConstructionERPMobile/src/screens/supervisor/AttendanceMonitoringScreen.tsx` - line 159

**Fix Needed:**
```typescript
const loadPendingCorrections = useCallback(async () => {
  try {
    // Call the actual API endpoint
    const response = await supervisorApiService.getManualAttendanceWorkers({
      projectId: selectedProjectId || undefined,
      date: new Date().toISOString().split('T')[0]
    });
    
    if (response.success && response.data) {
      // Map the response to AttendanceCorrection format
      const corrections = response.data.pendingCorrections || [];
      setPendingCorrections(corrections);
    }
  } catch (error) {
    console.error('Failed to load pending corrections:', error);
  }
}, [selectedProjectId]);
```

---

## 🔧 Quick Fixes

### Fix #1: Update API Date Query (Backend)

File: `backend/src/modules/supervisor/supervisorController.js`

Find the `getAttendanceMonitoring` function and update the attendance query:

```javascript
// Around line 1236
const attendanceRecords = await Attendance.find({
  employeeId: { $in: employeeIds },
  date: {
    $gte: new Date(workDate + 'T00:00:00.000Z'),
    $lte: new Date(workDate + 'T23:59:59.999Z')
  }
}).lean();
```

### Fix #2: Load Pending Corrections (Mobile App)

File: `ConstructionERPMobile/src/screens/supervisor/AttendanceMonitoringScreen.tsx`

Update the `loadPendingCorrections` function (around line 159):

```typescript
const loadPendingCorrections = useCallback(async () => {
  try {
    // Fetch from attendancecorrections collection via API
    const response = await fetch(`${API_BASE_URL}/api/supervisor/attendance-corrections`, {
      headers: {
        'Authorization': `Bearer ${authState.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setPendingCorrections(data.corrections || []);
    }
  } catch (error) {
    console.error('Failed to load pending corrections:', error);
    setPendingCorrections([]);
  }
}, [authState.token]);
```

### Fix #3: Add Backend API Endpoint for Corrections

File: `backend/src/modules/supervisor/supervisorController.js`

Add new endpoint:

```javascript
export const getAttendanceCorrections = async (req, res) => {
  try {
    const AttendanceCorrection = mongoose.model('AttendanceCorrection');
    
    const corrections = await AttendanceCorrection.find({
      status: 'pending',
      supervisorId: req.user.userId
    }).sort({ requestedAt: -1 });
    
    return res.status(200).json({
      success: true,
      corrections: corrections
    });
  } catch (error) {
    console.error('Error fetching corrections:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch corrections'
    });
  }
};
```

Add route in `backend/src/modules/supervisor/supervisorRoutes.js`:

```javascript
router.get('/attendance-corrections', verifyToken, getAttendanceCorrections);
```

---

## 📊 Database Verification

### Attendance Records (5 records exist):
```javascript
db.attendance.find({ 
  projectId: 1,
  date: { $gte: new Date('2026-02-07T00:00:00') }
}).pretty()
```

### Pending Corrections (4 records exist):
```javascript
db.attendancecorrections.find({ status: 'pending' }).pretty()
```

---

## 🎯 Testing After Fixes

Once the fixes are applied:

1. **Restart backend server**
2. **Refresh mobile app** (pull to refresh on Attendance Monitoring screen)
3. **Expected Results:**
   - 5 workers displayed with actual attendance data
   - Check-in/check-out times visible
   - Yellow "⚠️ Pending Corrections" alert card appears
   - Shows "4 attendance correction(s) awaiting approval"
   - "Review Corrections" button clickable
   - Modal opens with first correction request

---

## 📝 Summary

**Root Causes:**
1. Timezone handling in date queries (backend)
2. Placeholder function not calling API (mobile app)
3. Missing API endpoint for corrections (backend)

**Data Status:**
- ✅ All test data exists in database
- ✅ Data structure is correct
- ❌ API queries not finding the data due to timezone issues
- ❌ Corrections not being fetched from database

**Next Steps:**
1. Apply Fix #1 to resolve timezone issue
2. Apply Fix #2 & #3 to load pending corrections
3. Test the complete workflow
4. Verify modal functionality

The infrastructure and data are all in place - we just need to connect the dots with these three fixes!
