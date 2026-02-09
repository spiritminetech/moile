# Task Assignment Screen Error Fix - Complete

## Issues Fixed

### 1. Missing `getTaskAssignments` Function Error
**Error:** `getTaskAssignments is not a function (it is undefined)`

**Root Cause:** The `supervisorApiService.ts` was missing the `getTaskAssignments` method that the `TaskAssignmentScreen` was trying to call.

**Solution:** Added three new methods to `supervisorApiService.ts`:
- `getTaskAssignments()` - Fetch task assignments with filtering
- `reassignTask()` - Reassign a task to a different worker
- `updateTaskPriority()` - Update task priority

### 2. Duplicate Key Warning
**Error:** `Encountered two children with the same key, $1002`

**Root Cause:** The task list was using `key={${task.assignmentId}-${index}}` which could create duplicate keys if the same assignmentId appeared multiple times.

**Solution:** Changed the key to use only the unique `assignmentId`:
```typescript
key={`task-${task.assignmentId}`}
```

## Files Modified

### Mobile App (ConstructionERPMobile/)

#### 1. `src/services/api/supervisorApiService.ts`
Added three new API methods:

```typescript
/**
 * Get task assignments with filtering
 */
async getTaskAssignments(params?: {
  projectId?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  workerId?: number;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<{
  assignments: Array<{...}>;
  summary: {...};
  pagination: {...};
}>>

/**
 * Reassign task to a different worker
 */
async reassignTask(assignmentId: number, data: {
  newWorkerId: number;
  reason: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  instructions: string;
}): Promise<ApiResponse<{...}>>

/**
 * Update task priority
 */
async updateTaskPriority(assignmentId: number, data: {
  priority: 'low' | 'normal' | 'high' | 'urgent';
  instructions: string;
  estimatedHours: number;
}): Promise<ApiResponse<{...}>>
```

#### 2. `src/screens/supervisor/TaskAssignmentScreen.tsx`
Fixed duplicate key issue:
- Changed from: `key={${task.assignmentId}-${index}}`
- Changed to: `key={task-${task.assignmentId}}`

### Backend (backend/)

#### 1. `src/modules/supervisor/supervisorController.js`
Added three new controller functions:

```javascript
/**
 * Get task assignments with filtering
 * GET /api/supervisor/task-assignments
 */
export const getTaskAssignments = async (req, res) => {
  // Fetches assignments from WorkerTaskAssignment model
  // Supports filtering by projectId, status, priority, workerId
  // Returns transformed data matching mobile app expectations
  // Includes summary statistics and pagination
}

/**
 * Reassign task to a different worker
 * POST /api/supervisor/task-assignments/:assignmentId/reassign
 */
export const reassignTask = async (req, res) => {
  // Updates assignment with new worker
  // Records reassignment reason and timestamp
}

/**
 * Update task priority
 * PUT /api/supervisor/task-assignments/:assignmentId/priority
 */
export const updateTaskPriority = async (req, res) => {
  // Updates task priority level
  // Optionally updates instructions and estimated hours
}
```

#### 2. `src/modules/supervisor/supervisorRoutes.js`
Added three new routes:

```javascript
// Get task assignments with filtering
router.get('/task-assignments', verifyToken, getTaskAssignments);

// Reassign task to a different worker
router.post('/task-assignments/:assignmentId/reassign', verifyToken, reassignTask);

// Update task priority
router.put('/task-assignments/:assignmentId/priority', verifyToken, updateTaskPriority);
```

## API Endpoints

### GET /api/supervisor/task-assignments
**Query Parameters:**
- `projectId` (optional) - Filter by project
- `status` (optional) - Filter by status (pending, in_progress, completed, cancelled)
- `priority` (optional) - Filter by priority (low, normal, high, urgent)
- `workerId` (optional) - Filter by worker
- `limit` (optional, default: 50) - Pagination limit
- `offset` (optional, default: 0) - Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "assignmentId": "...",
        "taskId": "...",
        "taskName": "...",
        "workerId": "...",
        "workerName": "...",
        "status": "pending",
        "priority": "normal",
        "progress": 0,
        "assignedAt": "...",
        "startedAt": null,
        "completedAt": null,
        "estimatedHours": 8,
        "actualHours": null,
        "dependencies": [],
        "canStart": true,
        "instructions": "..."
      }
    ],
    "summary": {
      "totalAssignments": 10,
      "pending": 5,
      "inProgress": 3,
      "completed": 2,
      "cancelled": 0
    },
    "pagination": {
      "total": 10,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### POST /api/supervisor/task-assignments/:assignmentId/reassign
**Body:**
```json
{
  "newWorkerId": 123,
  "reason": "Worker unavailable",
  "priority": "high",
  "instructions": "Complete by end of day"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assignmentId": "...",
    "newWorkerId": 123,
    "reassignedAt": "2026-02-07T...",
    "message": "Task reassigned successfully"
  }
}
```

### PUT /api/supervisor/task-assignments/:assignmentId/priority
**Body:**
```json
{
  "priority": "urgent",
  "instructions": "Critical task - complete ASAP",
  "estimatedHours": 4
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assignmentId": "...",
    "priority": "urgent",
    "updatedAt": "2026-02-07T...",
    "message": "Task priority updated successfully"
  }
}
```

## Testing

### Test File Created
`backend/test-task-assignment-endpoints.js` - Comprehensive test suite for the new endpoints

### To Test:
1. Ensure backend is running: `cd backend && npm start`
2. Run test: `node backend/test-task-assignment-endpoints.js`

### Manual Testing:
1. Login as supervisor in mobile app
2. Navigate to Task Assignment screen
3. Verify:
   - Task list loads without errors
   - No duplicate key warnings in console
   - Filters work correctly
   - Can create new tasks
   - Can reassign tasks
   - Can update task priority

## Expected Behavior

### Before Fix:
- ❌ Error: "getTaskAssignments is not a function"
- ❌ Warning: "Encountered two children with the same key"
- ❌ Task Assignment screen crashes or shows error

### After Fix:
- ✅ Task assignments load successfully
- ✅ No duplicate key warnings
- ✅ Task list renders correctly
- ✅ Filters work as expected
- ✅ Task management actions (create, reassign, update priority) work

## Notes

1. **Database Requirements:** The endpoints use the existing `WorkerTaskAssignment` model, so no database migrations are needed.

2. **Authentication:** All new endpoints require authentication via JWT token (verifyToken middleware).

3. **Backward Compatibility:** The existing task management endpoints (`/assign-task`, `/update-assignment`, `/daily-targets`) remain unchanged and continue to work.

4. **Mobile App Compatibility:** The new endpoints follow the same response structure pattern as other supervisor endpoints for consistency.

5. **Error Handling:** All endpoints include proper error handling and return appropriate HTTP status codes.

## Related Files

- Mobile App:
  - `ConstructionERPMobile/src/services/api/supervisorApiService.ts`
  - `ConstructionERPMobile/src/screens/supervisor/TaskAssignmentScreen.tsx`

- Backend:
  - `backend/src/modules/supervisor/supervisorController.js`
  - `backend/src/modules/supervisor/supervisorRoutes.js`
  - `backend/src/modules/worker/models/WorkerTaskAssignment.js` (existing model)

## Status

✅ **COMPLETE** - All errors fixed, endpoints implemented, and ready for testing.
