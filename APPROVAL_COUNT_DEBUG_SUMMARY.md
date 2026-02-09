# Approval Count Mismatch - Debug Summary

## Issue
Dashboard shows **1 approval** (1 tool request), but Approvals screen shows **5 approvals**.

## Investigation Completed

### 1. Employee Query Fix ✅
- **Fixed**: Dashboard now uses the same employee query pattern as approvals screen
- Both use `$or` query to check both `currentProject.id` and `currentProjectId` fields
- Both return **6 employees** for supervisor 4

### 2. Data Verification ✅
Ran comprehensive diagnostic scripts that revealed:

**Supervisor 4's Data:**
- Projects: 1003, 1002, 1001, 1014, 101
- Employees: 6 workers assigned to these projects

**Pending Requests:**
- Leave Requests: 3 (from employees 2, 10, 17)
- Advance Payments: 1 (from employee 10)
- Material Requests: 1 (for project 1003)
- Tool Requests: 1 (for project 1) ⚠️

**The Problem:**
The tool request (ID: 1770044161085) is for **Project 1**, which is **NOT** assigned to supervisor 4.

### 3. Query Verification ✅
Tested the MongoDB query directly:
```javascript
MaterialRequest.countDocuments({ 
  projectId: { $in: [1003, 1002, 1001, 1014, 101] },
  requestType: 'TOOL',
  status: 'PENDING' 
})
// Returns: 0 ✅ (correct!)
```

## Current Status

### Code Changes Made
1. ✅ Fixed employee query in dashboard to match approvals screen
2. ✅ Added comprehensive debug logging to track:
   - Project IDs being queried
   - Employee IDs being queried
   - Actual approval counts
   - Actual tool requests found

### Expected Behavior
Both dashboard and approvals screen should show:
- Leave Requests: 3
- Advance Payments: 1  
- Material Requests: 1
- Tool Requests: 0
- **Total: 5 approvals**

## Next Steps

### Required Action
**Restart the backend server** to apply the debug logging.

### Check Backend Console
When the dashboard loads, look for these debug messages:
1. `📊 Dashboard Approval Query Debug` - Shows projectIds and employeeIds
2. `🔍 Approval Count Query Parameters` - Shows query inputs
3. `📊 Approval Counts` - Shows actual counts (should be toolCount: 0)
4. `🔧 Actual Tool Requests Found` - Shows tool requests (should be empty array)

### Possible Causes if Still Showing 1
1. **Mobile app cache** - Old data cached on device
2. **Data type mismatch** - Project IDs stored as strings vs numbers
3. **Different supervisor** - Mobile app logged in as different supervisor
4. **Stale backend** - Backend not restarted after code changes

## Files Modified
- `backend/src/modules/supervisor/supervisorController.js` - Added debug logging and employee query fix

## Diagnostic Scripts Created
- `backend/check-approval-count-debug.js` - Comprehensive approval count analysis
- `backend/verify-dashboard-query.js` - Verify tool request query
- `backend/check-tool-request-data.js` - Check tool request data types
- `backend/find-supervisor-credentials.js` - Find supervisor login info

## Documentation Created
- `APPROVAL_QUEUE_INVESTIGATION.md` - Investigation findings
- `RESTART_BACKEND_TO_SEE_DEBUG_LOGS.md` - Instructions for next steps
- `APPROVAL_COUNT_DEBUG_SUMMARY.md` - This file
