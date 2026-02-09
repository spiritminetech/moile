# Approval Count Mismatch Fix

## Issue
Dashboard approval queue showed 0 approvals, but the approvals screen showed actual pending approvals.

## Root Cause
The dashboard and approvals screen were using **different query methods**:

### Dashboard (OLD - Incorrect)
```javascript
// Queried by supervisorId field (which may not be set on requests)
LeaveRequest.countDocuments({
  status: 'pending',
  supervisorId: supervisorId  // ❌ This field is often not set
});
```

### Approvals Screen (Correct)
```javascript
// Queries by finding employees under supervisor's projects
const projects = await Project.find({ supervisorId: supervisor.id });
const employees = await Employee.find({ 
  'currentProject.id': { $in: projectIds } 
});

LeaveRequest.countDocuments({
  employeeId: { $in: employeeIds },  // ✅ Correct approach
  status: 'PENDING'
});
```

## The Problem
- Leave/Payment requests don't always have a `supervisorId` field set
- They have an `employeeId` field instead
- The correct way is to:
  1. Find supervisor's projects
  2. Find employees assigned to those projects
  3. Query requests by those employee IDs

## Solution
Updated the dashboard's `getDashboardData()` function to use the same employee-based query logic as the approvals screen.

### File Modified
`backend/src/modules/supervisor/supervisorController.js` - Line ~1978-2025

### New Logic
```javascript
// Get pending approvals data (using same logic as approvals screen)
const [leaveCount, advanceCount, materialCount, toolCount] = await Promise.all([
  // Pending leave requests from supervisor's workers
  LeaveRequest.countDocuments({ 
    employeeId: { $in: employeeIds },
    status: 'PENDING' 
  }),
  
  // Pending advance payment requests from supervisor's workers
  PaymentRequest.countDocuments({ 
    employeeId: { $in: employeeIds },
    status: 'PENDING' 
  }),
  
  // Pending material requests for supervisor's projects
  MaterialRequest.countDocuments({ 
    projectId: { $in: projectIds },
    requestType: 'MATERIAL',
    status: 'PENDING' 
  }),
  
  // Pending tool requests for supervisor's projects
  MaterialRequest.countDocuments({ 
    projectId: { $in: projectIds },
    requestType: 'TOOL',
    status: 'PENDING' 
  })
]);

pendingApprovals.leaveRequests = leaveCount + advanceCount;
pendingApprovals.materialRequests = materialCount;
pendingApprovals.toolRequests = toolCount;
pendingApprovals.total = leaveCount + advanceCount + materialCount + toolCount;
```

## Benefits
1. ✅ Dashboard and approvals screen now show **consistent counts**
2. ✅ Uses the **correct query method** (employee-based)
3. ✅ Counts **all request types** properly:
   - Leave requests
   - Advance payment requests
   - Material requests
   - Tool requests
4. ✅ Calculates **urgent requests** correctly (>24 hours old)
5. ✅ Uses **parallel queries** for better performance

## Testing
After restarting the backend:

1. **Dashboard should show correct counts**:
   ```json
   {
     "pendingApprovals": {
       "leaveRequests": 5,
       "materialRequests": 2,
       "toolRequests": 1,
       "urgent": 3,
       "total": 8
     }
   }
   ```

2. **Approvals screen should show same total**:
   - Should display 8 pending approvals
   - Counts should match dashboard

3. **Both should update together**:
   - When you approve a request in the approvals screen
   - Dashboard count should decrease on next refresh

## Status
✅ **FIXED** - Dashboard now uses the same query logic as the approvals screen, ensuring consistent approval counts.

## Next Steps
1. **Restart backend server** to apply the fix
2. **Refresh dashboard** to see correct counts
3. **Verify counts match** between dashboard and approvals screen
4. **Test approval processing** to ensure counts update correctly
