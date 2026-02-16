# Start Task Flow - Architecture Verification ✅

## Required Flow (from Requirements)

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

## Current Implementation Status

### ✅ IMPLEMENTED - All Checks Present

The system implements ALL required checks in the correct order:

#### 1. ✅ Geofence Check (Mobile App)
**Location:** `ConstructionERPMobile/src/components/cards/TaskCard.tsx` (Line 121-133)

```typescript
if (!isInsideGeofence) {
  Alert.alert(
    'Outside Geo-Fence',
    'You must be at the work site to start this task. Please move closer to the project location.',
    [
      { text: 'OK' },
      { 
        text: 'View Location', 
        onPress: () => onViewLocation(task)
      }
    ]
  );
  return;
}
```

**Status:** ✅ Implemented
- Checks geofence before allowing task start
- Shows alert with option to view location on map
- Prevents API call if outside geofence

---

#### 2. ✅ Attendance Check (Backend API)
**Location:** `backend/src/modules/worker/workerController.js` (Line 2145-2173)

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

**Status:** ✅ Implemented
- Checks if worker has checked in today
- Returns clear error message
- Prevents task start without attendance

---

#### 3. ✅ Active Task Check (Backend API)
**Location:** `backend/src/modules/worker/workerController.js` (Line 2175-2195)

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
      requiresPause: true  // ← Indicates pause is required
    }
  });
}
```

**Status:** ✅ Implemented
- Checks for any other task with status 'in_progress'
- Returns active task details
- Sets `requiresPause: true` flag

---

## Additional Validations (Bonus)

The system also implements these additional checks:

### 4. ✅ Offline Check (Mobile App)
**Location:** `TaskCard.tsx` (Line 112-119)
```typescript
if (isOffline) {
  Alert.alert(
    'Offline Mode',
    'Cannot start tasks while offline. Please connect to internet.',
    [{ text: 'OK' }]
  );
  return;
}
```

### 5. ✅ Dependency Check (Backend API)
**Location:** `workerController.js` (Line 2118-2132)
```javascript
// Check task dependencies
if (assignment.dependencies && assignment.dependencies.length > 0) {
  const dependencyResult = await checkDependencies(assignment.dependencies);
  if (!dependencyResult.canStart) {
    return res.status(400).json({ 
      success: false, 
      message: dependencyResult.message,
      error: "DEPENDENCIES_NOT_MET",
      data: {
        incompleteDependencies: dependencyResult.incompleteDependencies,
        missingDependencies: dependencyResult.missingDependencies
      }
    });
  }
}
```

### 6. ✅ Sequence Check (Backend API)
**Location:** `workerController.js` (Line 2134-2145)
```javascript
// Check task sequence
const sequenceResult = await validateTaskSequence(assignment, employee.id, assignment.date);
if (!sequenceResult.canStart) {
  return res.status(400).json({ 
    success: false, 
    message: sequenceResult.message,
    error: "SEQUENCE_VALIDATION_FAILED",
    data: {
      incompleteEarlierTasks: sequenceResult.incompleteEarlierTasks
    }
  });
}
```

---

## Execution Order

The checks execute in this order:

### Mobile App (Pre-flight checks)
1. ✅ Offline check
2. ✅ Geofence check
3. ✅ Dependency check (canStart prop)
4. → Confirmation dialog
5. → API call to backend

### Backend API (Server-side validation)
1. ✅ Authentication validation
2. ✅ Task assignment validation
3. ✅ Task status check (already started/completed)
4. ✅ Dependency validation
5. ✅ Sequence validation
6. ✅ **Attendance check** ← Required check #2
7. ✅ **Active task check** ← Required check #3
8. ✅ Project/geofence validation
9. → Start task (update status to 'in_progress')

---

## Missing Feature: Pause & Switch

### ⚠️ PARTIALLY IMPLEMENTED

The system detects when another task is active and returns `requiresPause: true`, but the mobile app doesn't currently handle the "Pause Task 1 and start Task 2?" dialog.

### Current Behavior:
- Backend returns error: "You have another task in progress"
- Mobile app shows generic error message
- Worker cannot start new task

### Required Behavior:
- Backend returns error with `requiresPause: true` ✅ (Already done)
- Mobile app shows dialog: "You are working on Task 1. Pause Task 1 and start Task 2?" ❌ (Not implemented)
- If worker confirms → Call pause API for Task 1, then start Task 2 ❌ (Not implemented)

### Implementation Needed:

**Mobile App** (`TaskCard.tsx` - after line 145):
```typescript
// In handleStartTask, after confirmation:
const response = await startTask(assignmentId, location);

if (!response.success && response.error === 'ANOTHER_TASK_ACTIVE') {
  Alert.alert(
    'Task Already Active',
    `You are working on "${response.data.activeTaskName}". Pause that task and start "${task.taskName}"?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Pause & Start', 
        onPress: async () => {
          // 1. Pause active task
          await pauseTask(response.data.activeTaskAssignmentId);
          // 2. Start new task
          await startTask(assignmentId, location);
        }
      }
    ]
  );
}
```

**Backend API** (Need pause endpoint):
```javascript
// POST /worker/tasks/:taskId/pause
export const pauseWorkerTask = async (req, res) => {
  // Update status from 'in_progress' to 'paused'
  // Record pause time
  // Calculate hours worked so far
};
```

---

## Summary

### ✅ Fully Implemented (3/3 Required Checks)
1. ✅ Geofence validation
2. ✅ Attendance check
3. ✅ Active task detection

### ⚠️ Partially Implemented (Pause & Switch Flow)
- Backend detects active task ✅
- Backend returns `requiresPause: true` ✅
- Mobile app shows pause dialog ❌
- Pause API endpoint ❌
- Auto-pause and start new task ❌

### Recommendation

The core validation is complete. To fully implement the requirement, add:

1. **Pause Task API** endpoint
2. **Mobile app dialog** to handle ANOTHER_TASK_ACTIVE error
3. **Auto-pause logic** when worker confirms switch

The current implementation is production-ready for the validation checks. The pause-and-switch feature can be added as an enhancement.
