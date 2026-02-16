# START TASK FLOW - Implementation Analysis

## Requirement Analysis

**User Requirement:**
```
▶ 3️⃣ WHEN WORKER STARTS TASK
Worker clicks: [ ▶ START TASK ]

System checks:
1. Is worker inside geo-fence?
2. Is attendance already logged?
3. Is another task already "In Progress"?

If another task active → System asks:
"You are working on Task 1. Pause Task 1 and start Task 2?"

Only ONE task can be active at a time.
```

---

## ✅ IMPLEMENTATION STATUS: FULLY IMPLEMENTED

All three validation checks are implemented in the current architecture.

---

## 📋 Detailed Implementation Breakdown

### 1. ✅ GEO-FENCE VALIDATION

**Location:** `backend/src/modules/worker/workerController.js` (Lines 2200-2260)

**Implementation:**
```javascript
// Get project information for geofence validation
const project = await Project.findOne({ id: assignment.projectId });

// Prepare project geofence information
const centerLat = project.geofence?.center?.latitude || project.latitude || 0;
const centerLng = project.geofence?.center?.longitude || project.longitude || 0;
const radius = project.geofence?.radius || project.geofenceRadius || 100;

const projectGeofence = {
  center: {
    latitude: centerLat,
    longitude: centerLng
  },
  radius: radius,
  strictMode: project.geofence?.strictMode !== false,
  allowedVariance: project.geofence?.allowedVariance || 10
};

// Validate geofence location
const geofenceValidation = validateGeofence(
  { latitude: location.latitude, longitude: location.longitude },
  projectGeofence
);

if (!geofenceValidation.isValid) {
  return res.status(400).json({
    success: false,
    message: geofenceValidation.message,
    error: "GEOFENCE_VALIDATION_FAILED",
    data: {
      distance: geofenceValidation.distance,
      allowedRadius: geofenceValidation.allowedRadius,
      insideGeofence: geofenceValidation.insideGeofence,
      strictMode: geofenceValidation.strictValidation
    }
  });
}
```

**Status:** ✅ FULLY IMPLEMENTED
- Checks if worker is inside project geofence
- Uses Haversine formula for distance calculation
- Supports configurable radius and tolerance
- Returns detailed error with distance information

---

### 2. ✅ ATTENDANCE VALIDATION

**Location:** `backend/src/modules/worker/workerController.js` (Lines 2160-2180)

**Implementation:**
```javascript
// Check if worker has logged attendance for today
const today = new Date();
const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

const todayAttendance = await Attendance.findOne({
  employeeId: employee.id,
  checkIn: { $exists: true, $ne: null },
  date: { $gte: startOfToday, $lt: startOfTomorrow }
});

if (!todayAttendance) {
  return res.status(400).json({
    success: false,
    message: "You must check in before starting tasks",
    error: "ATTENDANCE_REQUIRED",
    data: {
      requiresAttendance: true,
      message: "Please log your attendance before starting any task"
    }
  });
}
```

**Status:** ✅ FULLY IMPLEMENTED
- Checks if worker has checked in for today
- Validates attendance exists with non-null checkIn time
- Returns clear error message directing worker to check in first

---

### 3. ✅ ANOTHER TASK ACTIVE VALIDATION

**Location:** `backend/src/modules/worker/workerController.js` (Lines 2182-2200)

**Implementation:**
```javascript
// Check if worker has another task in progress
const activeTask = await WorkerTaskAssignment.findOne({
  employeeId: employee.id,
  status: 'in_progress',
  id: { $ne: taskIdValidation.id }
});

if (activeTask) {
  // Get task details for better error message
  const activeTaskDetails = await Task.findOne({ id: activeTask.taskId });
  
  return res.status(400).json({
    success: false,
    message: "You have another task in progress",
    error: "ANOTHER_TASK_ACTIVE",
    data: {
      activeTaskId: activeTask.id,
      activeTaskName: activeTaskDetails?.taskName || activeTask.taskName || 'Unknown Task',
      activeTaskAssignmentId: activeTask.id,
      requiresPause: true
    }
  });
}
```

**Status:** ✅ FULLY IMPLEMENTED
- Checks if worker has any other task with status 'in_progress'
- Returns active task details including task name
- Provides `requiresPause: true` flag for frontend handling

---

## 📱 Frontend Implementation

### Pause and Start Flow

**Location:** `ConstructionERPMobile/src/screens/worker/TodaysTasksScreen.tsx` (Lines 380-430)

**Implementation:**
```typescript
const handleStartTask = useCallback(async (taskId: number) => {
  // ... location validation ...
  
  try {
    const response = await workerApiService.startTask(taskId, currentLocation);
    
    if (response.success) {
      Alert.alert('Task Started', response.message || 'Task has been started successfully.');
      loadTasks(false);
    } else {
      // Handle specific error cases
      if (response.error === 'ATTENDANCE_REQUIRED') {
        Alert.alert(
          'Attendance Required',
          'You must check in before starting tasks. Please log your attendance first.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Check In', 
              onPress: () => navigation.navigate('Attendance')
            }
          ]
        );
      } else if (response.error === 'ANOTHER_TASK_ACTIVE') {
        // ✅ PAUSE AND START DIALOG
        Alert.alert(
          'Another Task Active',
          `You are working on ${response.data?.activeTaskName || 'another task'}. Pause and start this task?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Confirm', 
              onPress: async () => {
                try {
                  // Pause the active task
                  const pauseResponse = await workerApiService.pauseTask(response.data.activeTaskId);
                  
                  if (pauseResponse.success) {
                    // Now start the new task
                    const startResponse = await workerApiService.startTask(taskId, currentLocation);
                    
                    if (startResponse.success) {
                      Alert.alert('Task Started', 'Previous task paused. New task started successfully.');
                      loadTasks(false);
                    } else {
                      Alert.alert('Error', startResponse.message || 'Failed to start task');
                    }
                  } else {
                    Alert.alert('Error', pauseResponse.message || 'Failed to pause active task');
                  }
                } catch (error) {
                  console.error('Error pausing and starting task:', error);
                  Alert.alert('Error', 'Failed to pause and start task');
                }
              }
            }
          ]
        );
      } else if (response.error === 'GEOFENCE_VALIDATION_FAILED') {
        Alert.alert(
          'Outside Geo-Fence',
          'You must be inside the assigned site location to start this task.'
        );
      } else {
        Alert.alert('Cannot Start Task', response.message || 'Failed to start task. Please try again.');
      }
    }
  } catch (err: any) {
    console.error('Error starting task:', err);
    Alert.alert('Error', err.message || 'Failed to start task. Please check your connection and try again.');
  }
}, [currentLocation, hasLocationPermission, isLocationEnabled, loadTasks]);
```

**Status:** ✅ FULLY IMPLEMENTED
- Handles all three validation errors
- Shows appropriate dialog for each error type
- Implements pause-and-start flow with confirmation
- Provides navigation to attendance screen if needed

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Worker clicks "START TASK" button                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Check location permission & availability          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ API Call: POST /worker/tasks/{taskId}/start                 │
│ Body: { location: { latitude, longitude, accuracy } }       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend Validation #1: Check Dependencies                   │
│ - Are all dependency tasks completed?                       │
└────────────────────┬────────────────────────────────────────┘
                     │ ✅ Pass
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend Validation #2: Check Task Sequence                  │
│ - Are all earlier sequence tasks completed?                 │
└────────────────────┬────────────────────────────────────────┘
                     │ ✅ Pass
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend Validation #3: Check Attendance ✅                   │
│ - Has worker checked in today?                              │
│ - Is checkIn time not null?                                 │
└────────────────────┬────────────────────────────────────────┘
                     │ ✅ Pass
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend Validation #4: Check Another Task Active ✅          │
│ - Is there another task with status 'in_progress'?          │
│ - If YES: Return error with active task details             │
└────────────────────┬────────────────────────────────────────┘
                     │ ✅ Pass (No active task)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend Validation #5: Check Geo-Fence ✅                    │
│ - Calculate distance from worker to project site            │
│ - Is distance <= (radius + allowedVariance)?                │
└────────────────────┬────────────────────────────────────────┘
                     │ ✅ Pass
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Update Task Status                                           │
│ - Set status = 'in_progress'                                │
│ - Set startTime = now                                       │
│ - Log geofence validation                                   │
│ - Create location log entry                                 │
│ - Send notification to supervisor                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Return Success Response                                      │
│ { success: true, message: "Task started successfully" }     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 Error Handling Flow

### If Another Task is Active:

```
Backend Returns:
{
  success: false,
  error: "ANOTHER_TASK_ACTIVE",
  message: "You have another task in progress",
  data: {
    activeTaskId: 123,
    activeTaskName: "Install LED Lights",
    requiresPause: true
  }
}

Frontend Shows Alert:
┌──────────────────────────────────────────┐
│ Another Task Active                      │
├──────────────────────────────────────────┤
│ You are working on "Install LED Lights". │
│ Pause and start this task?              │
├──────────────────────────────────────────┤
│ [Cancel]              [Confirm]          │
└──────────────────────────────────────────┘

If User Clicks "Confirm":
1. Call pauseTask(activeTaskId)
2. If pause succeeds, call startTask(newTaskId)
3. Show success message
4. Refresh task list
```

### If Attendance Not Logged:

```
Backend Returns:
{
  success: false,
  error: "ATTENDANCE_REQUIRED",
  message: "You must check in before starting tasks",
  data: {
    requiresAttendance: true
  }
}

Frontend Shows Alert:
┌──────────────────────────────────────────┐
│ Attendance Required                      │
├──────────────────────────────────────────┤
│ You must check in before starting tasks. │
│ Please log your attendance first.       │
├──────────────────────────────────────────┤
│ [Cancel]              [Check In]         │
└──────────────────────────────────────────┘

If User Clicks "Check In":
- Navigate to Attendance screen
```

### If Outside Geo-Fence:

```
Backend Returns:
{
  success: false,
  error: "GEOFENCE_VALIDATION_FAILED",
  message: "You are outside the project site geofence",
  data: {
    distance: 523.45,
    allowedRadius: 110,
    insideGeofence: false
  }
}

Frontend Shows Alert:
┌──────────────────────────────────────────┐
│ Outside Geo-Fence                        │
├──────────────────────────────────────────┤
│ You must be inside the assigned site     │
│ location to start this task.            │
├──────────────────────────────────────────┤
│ [OK]                                     │
└──────────────────────────────────────────┘
```

---

## 📊 Validation Order

The system performs validations in this specific order:

1. **Authentication** - Is user logged in?
2. **Task Ownership** - Does this task belong to this worker?
3. **Task Status** - Is task not already started/completed?
4. **Dependencies** - Are all dependency tasks completed?
5. **Sequence** - Are all earlier sequence tasks completed?
6. **✅ Attendance** - Has worker checked in today?
7. **✅ Another Task Active** - Is another task in progress?
8. **✅ Geo-Fence** - Is worker inside project site?

This order ensures:
- Fast failures for basic validation
- Expensive operations (DB queries) only when needed
- User-friendly error messages in logical order

---

## 🎯 API Endpoints Involved

### 1. Start Task
```
POST /api/worker/tasks/{taskId}/start
Body: {
  location: {
    latitude: number,
    longitude: number,
    accuracy?: number
  }
}
```

### 2. Pause Task
```
POST /api/worker/tasks/{taskId}/pause
Body: {
  location: {
    latitude: number,
    longitude: number
  }
}
```

---

## 🔍 Additional Features Implemented

Beyond the basic requirement, the system also includes:

1. **Location Logging** - Every task start is logged with GPS coordinates
2. **Supervisor Notifications** - Supervisor is notified when task starts
3. **Geofence Audit Trail** - Validation results are stored in assignment
4. **Estimated End Time** - Calculated based on time estimates
5. **Dependency Validation** - Ensures tasks are done in correct order
6. **Sequence Validation** - Ensures sequential tasks are completed in order

---

## ✅ CONCLUSION

**All three required validations are FULLY IMPLEMENTED:**

1. ✅ **Geo-fence Check** - Worker must be inside project site
2. ✅ **Attendance Check** - Worker must have checked in today
3. ✅ **Another Task Active Check** - Only one task can be active at a time

**The pause-and-start flow is also FULLY IMPLEMENTED:**
- System detects active task
- Shows confirmation dialog with active task name
- Pauses active task if user confirms
- Starts new task
- Refreshes task list

**Implementation Quality:**
- Comprehensive error handling
- User-friendly error messages
- Proper validation order
- Audit trail logging
- Supervisor notifications
- Location tracking

The current architecture fully satisfies the stated requirement.
