# Multiple Active Tasks - Prevention Improvements

## Current Issue

You have TWO tasks with `status: "in_progress"`:
- Assignment 7040: "Repair Ceiling Tiles"
- Assignment 7041: "Install LED Lighting"

## Root Cause Analysis

The backend validation **IS working**, but the issue occurred because:

1. **Race Condition**: If two START requests arrive within milliseconds, both might pass the "check for active task" validation before either updates the database
2. **No Database Constraint**: MongoDB doesn't enforce "only one in_progress task per employee"
3. **No Transaction**: The check and update are separate operations, not atomic

## Immediate Fix

Run this command to fix the current data:

```bash
node backend/fix-multiple-active-tasks.js
```

This will:
- Keep the most recently started task as "in_progress"
- Change older active tasks to "paused" status

---

## Prevention Strategy: 3-Layer Defense

### Layer 1: Database-Level Safeguard (Recommended)

Add a unique partial index to prevent multiple "in_progress" tasks:

```javascript
// In WorkerTaskAssignment model
WorkerTaskAssignmentSchema.index(
  { employeeId: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'in_progress' },
    name: 'unique_active_task_per_employee'
  }
);
```

This ensures MongoDB itself rejects any attempt to create a second "in_progress" task.

### Layer 2: Backend Transaction (Best Practice)

Use MongoDB transactions to make check + update atomic:

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Check for active task within transaction
  const activeTask = await WorkerTaskAssignment.findOne({
    employeeId: employee.id,
    status: 'in_progress'
  }).session(session);

  if (activeTask) {
    await session.abortTransaction();
    return res.status(400).json({
      error: 'ANOTHER_TASK_ACTIVE',
      // ...
    });
  }

  // Update task status within same transaction
  await WorkerTaskAssignment.updateOne(
    { id: taskId },
    { $set: { status: 'in_progress', startTime: new Date() } }
  ).session(session);

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### Layer 3: Frontend Validation (User Experience)

Add a check in the mobile app to detect and warn about multiple active tasks:

```typescript
// In TodaysTasksScreen.tsx
useEffect(() => {
  const activeTasksCount = tasks.filter(t => t.status === 'in_progress').length;
  
  if (activeTasksCount > 1) {
    console.warn('⚠️ MULTIPLE ACTIVE TASKS DETECTED:', activeTasksCount);
    Alert.alert(
      'Data Inconsistency Detected',
      `You have ${activeTasksCount} active tasks. Only one task should be active at a time. Please contact support.`,
      [{ text: 'OK' }]
    );
  }
}, [tasks]);
```

---

## Implementation Priority

1. **IMMEDIATE**: Run `fix-multiple-active-tasks.js` to fix current data
2. **HIGH**: Add database partial index (Layer 1)
3. **MEDIUM**: Add transaction support (Layer 2)
4. **LOW**: Add frontend warning (Layer 3)

---

## Testing the Fix

After running the fix script:

1. Refresh the mobile app
2. You should see:
   - ONE task with "Continue Working" button (most recent)
   - Other task(s) with "Resume Task" button (paused)
3. Try starting a new task - should show pause dialog
4. Verify only ONE task can be "in_progress" at a time

---

## Long-Term Recommendation

Implement all three layers for defense-in-depth:
- **Database constraint** prevents the issue at storage level
- **Transaction** prevents race conditions at application level
- **Frontend check** provides immediate user feedback

This ensures the "only one active task" rule is enforced at every level.
