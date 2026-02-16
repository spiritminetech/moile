# Paused Task Resume Fix - Complete Solution

## Problem

When a task is:
1. Started (status: `'in_progress'`)
2. Paused (status changes to: `'queued'`)
3. Resumed and progress updated

You get error: `"Task must be started before progress can be updated"`

## Root Cause

The `pauseWorkerTask` function (line 3020 in workerController.js) changes the task status from `'in_progress'` to `'queued'`:

```javascript
// Update assignment to queued status (paused)
assignment.status = 'queued';
```

When you try to update progress, the backend validation rejects `'queued'` status tasks:

```javascript
if (assignment.status === 'queued') {
  return res.status(400).json({ 
    success: false, 
    message: "Task must be started before progress can be updated",
    error: "TASK_NOT_STARTED"
  });
}
```

## Solution: Add Resume Task Endpoint

We need to add a proper resume endpoint that changes status back to `'in_progress'`.

### Step 1: Add Resume Endpoint to Backend

**File: `backend/src/modules/worker/workerController.js`**

Add this function after the `pauseWorkerTask` function:

```javascript
/* ----------------------------------------------------
   POST /worker/tasks/{taskId}/resume - Resume paused task
---------------------------------------------------- */
export const resumeWorkerTask = async (req, res) => {
  try {
    // Input validation using validation utilities
    const authValidation = validateAuthData(req);
    if (!authValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: authValidation.message,
        error: authValidation.error
      });
    }

    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(403).json({ 
        success: false, 
        message: "Employee not found or unauthorized",
        error: "EMPLOYEE_UNAUTHORIZED"
      });
    }

    // Validate task ID from URL parameter
    const taskId = parseInt(req.params.taskId);
    const taskIdValidation = validateId(taskId, "task assignment");
    if (!taskIdValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: taskIdValidation.message,
        error: taskIdValidation.error
      });
    }

    // Validate location if provided
    let validatedLocation = null;
    if (req.body.location) {
      const locationValidation = validateCoordinates(
        req.body.location.latitude, 
        req.body.location.longitude
      );
      if (locationValidation.isValid) {
        validatedLocation = {
          latitude: req.body.location.latitude,
          longitude: req.body.location.longitude,
          accuracy: req.body.location.accuracy || null,
          timestamp: new Date()
        };
      }
    }

    // Find the task assignment
    const assignment = await WorkerTaskAssignment.findOne({
      id: taskIdValidation.id,
      employeeId: employee.id
    });

    if (!assignment) {
      return res.status(403).json({ 
        success: false, 
        message: "Task assignment not found or unauthorized",
        error: "ASSIGNMENT_UNAUTHORIZED"
      });
    }

    // Check if task is paused (queued with pause history)
    if (assignment.status !== 'queued') {
      return res.status(400).json({ 
        success: false, 
        message: "Only paused tasks can be resumed",
        error: "TASK_NOT_PAUSED",
        data: {
          currentStatus: assignment.status
        }
      });
    }

    // Check if task was previously started (has pauseHistory or startTime)
    if (!assignment.pauseHistory || assignment.pauseHistory.length === 0) {
      if (!assignment.startTime) {
        return res.status(400).json({ 
          success: false, 
          message: "Task was never started. Please start the task first.",
          error: "TASK_NEVER_STARTED"
        });
      }
    }

    // Update assignment back to in_progress status
    const resumedAt = new Date();
    const previousStatus = assignment.status;
    assignment.status = 'in_progress';
    
    // Update pause history with resume time
    if (assignment.pauseHistory && assignment.pauseHistory.length > 0) {
      const lastPause = assignment.pauseHistory[assignment.pauseHistory.length - 1];
      if (!lastPause.resumedAt) {
        lastPause.resumedAt = resumedAt;
        lastPause.resumedBy = employee.id;
      }
    }

    await assignment.save();

    // Log location if provided
    if (validatedLocation) {
      try {
        const lastLocationLog = await LocationLog.findOne().sort({ id: -1 }).select("id");
        const nextLocationId = lastLocationLog ? lastLocationLog.id + 1 : 1;

        await LocationLog.create({
          id: nextLocationId,
          employeeId: employee.id,
          projectId: assignment.projectId,
          latitude: validatedLocation.latitude,
          longitude: validatedLocation.longitude,
          accuracy: validatedLocation.accuracy,
          timestamp: validatedLocation.timestamp,
          action: 'TASK_RESUMED',
          metadata: {
            assignmentId: assignment.id,
            taskName: assignment.taskName
          }
        });
      } catch (locationError) {
        console.error("❌ Error logging location:", locationError);
        // Don't fail the request if location logging fails
      }
    }

    // Send task resume notification to supervisor
    try {
      if (assignment.supervisorId) {
        await TaskNotificationService.notifyTaskStatusChange(
          assignment, 
          previousStatus, 
          'in_progress', 
          assignment.supervisorId
        );
        console.log(`✅ Task resume notification sent to supervisor ${assignment.supervisorId}`);
      }
    } catch (notificationError) {
      console.error("❌ Error sending task resume notification:", notificationError);
      // Don't fail the request if notifications fail
    }

    return res.json({
      success: true,
      message: "Task resumed successfully",
      data: {
        assignmentId: assignment.id,
        status: "in_progress",
        resumedAt: resumedAt,
        previousStatus: previousStatus
      }
    });

  } catch (err) {
    console.error("❌ resumeWorkerTask:", err);
    
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: "INTERNAL_SERVER_ERROR"
    });
  }
};
```

### Step 2: Add Route for Resume Endpoint

**File: `backend/src/modules/worker/workerRoutes.js`**

Add the import at the top:
```javascript
import {
  // ... existing imports
  pauseWorkerTask,
  resumeWorkerTask, // ADD THIS
  // ... other imports
} from './workerController.js';
```

Add the route after the pause route:
```javascript
// Resume a paused task
router.post(
  "/tasks/:taskId/resume",
  verifyToken,
  resumeWorkerTask
);
```

### Step 3: Update Frontend API Service

**File: `ConstructionERPMobile/src/services/api/workerApiService.ts`**

Add the resume method after the pause method:

```typescript
async resumeTask(taskId: number, location: GeoLocation): Promise<ApiResponse<{
  assignmentId: number;
  status: string;
  resumedAt: string;
  previousStatus: string;
}>> {
  return apiClient.post(`/worker/tasks/${taskId}/resume`, {
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
    },
  });
}
```

### Step 4: Update TaskProgressScreen to Use Resume

**File: `ConstructionERPMobile/src/screens/worker/TaskProgressScreen.tsx`**

Replace the auto-start logic with resume logic:

```typescript
// Auto-resume paused task or start pending task
const autoStartOrResumeTask = useCallback(async () => {
  if (!task || !currentLocation) return;
  
  // Check if task needs to be started or resumed
  if (task.status === 'pending') {
    try {
      console.log('🚀 Auto-starting task...');
      const startResponse = await workerApiService.startTask(
        task.assignmentId, 
        currentLocation
      );
      
      if (startResponse.success) {
        console.log('✅ Task auto-started successfully');
        await loadTaskDetails();
      } else {
        Alert.alert(
          'Cannot Update Progress',
          startResponse.message || 'Task must be started first.',
          [{ text: 'Go Back', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      console.error('❌ Error auto-starting task:', error);
      Alert.alert(
        'Cannot Update Progress',
        'Failed to start task. Please go back and start the task manually.',
        [{ text: 'Go Back', onPress: () => navigation.goBack() }]
      );
    }
  }
}, [task, currentLocation, loadTaskDetails, navigation]);

// Call auto-start/resume after loading task details
useEffect(() => {
  if (task && currentLocation) {
    autoStartOrResumeTask();
  }
}, [task, currentLocation, autoStartOrResumeTask]);
```

## Alternative Quick Fix (Without Backend Changes)

If you can't modify the backend immediately, update the TaskProgressScreen to call startTask for paused tasks:

```typescript
// Auto-start task if it's in pending status (handles both new and paused tasks)
const autoStartTaskIfNeeded = useCallback(async () => {
  if (!task || !currentLocation) return;
  
  // If task is pending (includes paused tasks), we need to start/resume it
  if (task.status === 'pending') {
    try {
      console.log('🚀 Auto-starting/resuming task before progress update...');
      
      // For paused tasks, startTask will work because backend allows restarting
      const startResponse = await workerApiService.startTask(
        task.assignmentId, 
        currentLocation
      );
      
      if (startResponse.success) {
        console.log('✅ Task started/resumed successfully');
        // Reload task details to get updated status
        await loadTaskDetails();
      } else {
        Alert.alert(
          'Cannot Update Progress',
          startResponse.message || 'Task must be started first. Please go back and start the task.',
          [
            {
              text: 'Go Back',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Error auto-starting task:', error);
      Alert.alert(
        'Cannot Update Progress',
        'Failed to start task. Please go back and start the task manually.',
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  }
}, [task, currentLocation, loadTaskDetails, navigation]);
```

## Testing Steps

After applying the fix:

1. **Start a task** - Status becomes `'in_progress'`
2. **Pause the task** - Status becomes `'queued'` (paused)
3. **Click "Resume Task"** button
4. **Verify**: Task should auto-resume to `'in_progress'`
5. **Enter progress details** and click "Update Progress"
6. **Expected**: Progress updates successfully

## Status

- ✅ **Root Cause Identified**: Paused tasks have status `'queued'`
- ✅ **Solution Designed**: Add resume endpoint + auto-resume logic
- ⏳ **Implementation Needed**: Apply backend and frontend changes
- ⏳ **Testing Required**: Verify pause → resume → update progress flow

## Files to Modify

### Backend:
1. `backend/src/modules/worker/workerController.js` - Add `resumeWorkerTask` function
2. `backend/src/modules/worker/workerRoutes.js` - Add resume route

### Frontend:
3. `ConstructionERPMobile/src/services/api/workerApiService.ts` - Add `resumeTask` method
4. `ConstructionERPMobile/src/screens/worker/TaskProgressScreen.tsx` - Update auto-start logic
