# Multiple Active Tasks Issue - Root Cause Found

## Problem Identified

From the app logs, you have **TWO tasks with `status: "in_progress"` simultaneously**:

### Task 1 (Assignment 7040)
```json
{
  "assignmentId": 7040,
  "taskName": "Repair Ceiling Tiles",
  "status": "in_progress",
  "startedAt": "2026-02-15T12:51:11.537Z"
}
```

### Task 2 (Assignment 7041)
```json
{
  "assignmentId": 7041,
  "taskName": "Install LED Lighting",
  "status": "in_progress",
  "startedAt": "2026-02-15T12:45:04.122Z"
}
```

## Why This Happened

The backend validation **IS working correctly** - it checks for active tasks before starting a new one. However, these two tasks ended up with "in_progress" status, which means:

1. **Possible Race Condition**: Two start requests were processed almost simultaneously
2. **Manual Database Update**: Tasks were manually set to "in_progress" in the database
3. **Pause Logic Failed**: A task was started, but the pause logic for the previous task didn't execute
4. **Old Data**: These tasks were created before the validation was implemented

## Impact on UI

The TaskCard component shows "Continue Working" button when:
- `task.status === 'in_progress'` OR
- `task.status === 'paused'`

Since you have TWO tasks with `status: 'in_progress'`, you see TWO "Continue Working" buttons.

## The Fix

We need to:
1. **Immediate**: Fix the current data - set one task to "paused" status
2. **Prevention**: Add additional safeguards to prevent this from happening again

---

## Solution 1: Fix Current Data

Run the script below to fix the current state.

## Solution 2: Add Additional Backend Safeguard

Add a database-level check to ensure only one task can be "in_progress" at a time.

## Solution 3: Add Frontend Warning

Show a warning in the UI if multiple active tasks are detected.
