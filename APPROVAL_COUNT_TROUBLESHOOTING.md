# Approval Count Troubleshooting Guide

## Issue
Dashboard approval queue and approvals screen show different counts.

## What We've Fixed
1. ✅ Both endpoints now use the same query logic (employee-based)
2. ✅ Both use uppercase 'PENDING' status
3. ✅ Both query the same collections (LeaveRequest, PaymentRequest, MaterialRequest)

## How to Diagnose the Difference

### Step 1: Check the Actual Numbers
When you see the difference, note down:

**Dashboard Approval Queue:**
- Leave Requests: ?
- Material Requests: ?
- Tool Requests: ?
- Urgent: ?
- **Total: ?**

**Approvals Screen:**
- Leave: ?
- Advance Payment: ?
- Material: ?
- Tool: ?
- Reimbursement: ?
- Urgent: ?
- **Total: ?**

### Step 2: Check the API Responses

#### Dashboard API
Look for this in your logs:
```
GET http://192.168.1.8:5002/api/supervisor/dashboard
```

The response should show:
```json
{
  "pendingApprovals": {
    "leaveRequests": X,
    "materialRequests": Y,
    "toolRequests": Z,
    "urgent": A,
    "total": B
  }
}
```

#### Approvals API
Look for this in your logs:
```
GET http://192.168.1.8:5002/api/supervisor/approvals/pending
```

The response should show:
```json
{
  "summary": {
    "totalPending": X,
    "urgentCount": Y,
    "byType": {
      "leave": A,
      "material": B,
      "tool": C,
      "advance_payment": D,
      "reimbursement": E
    }
  }
}
```

### Step 3: Common Causes of Mismatch

#### Cause 1: Cached Data
**Symptom**: Dashboard shows old count, approvals screen shows current count
**Solution**: Pull to refresh on dashboard

#### Cause 2: Different Supervisor Context
**Symptom**: Counts are completely different
**Check**: Are you logged in as the same supervisor in both views?

#### Cause 3: Timing Issue
**Symptom**: Counts differ by 1-2
**Reason**: Someone approved/rejected between dashboard load and approvals screen load

#### Cause 4: Status Field Variations
**Symptom**: Dashboard shows 0, approvals screen shows many
**Check**: Database might have mixed case statuses ('pending' vs 'PENDING')

**Fix**: Run this query in MongoDB:
```javascript
// Check for mixed case statuses
db.leaverequests.find({ status: { $regex: /pending/i } }).forEach(doc => {
  print(`ID: ${doc.id}, Status: "${doc.status}"`);
});

// Fix mixed case (if needed)
db.leaverequests.updateMany(
  { status: { $regex: /^pending$/i } },
  { $set: { status: 'PENDING' } }
);
```

#### Cause 5: Employee Assignment Issue
**Symptom**: Dashboard shows fewer than approvals screen
**Check**: Employees might not be properly linked to projects

**Verify**:
```javascript
// Check employee-project links
db.employees.find({ 
  'currentProject.id': { $exists: true } 
}).forEach(emp => {
  print(`Employee ${emp.id}: Project ${emp.currentProject.id}`);
});
```

### Step 4: Force Sync

If counts still don't match, try this:

1. **Clear app cache** (in mobile app settings)
2. **Restart backend server**
3. **Pull to refresh** on dashboard
4. **Navigate to approvals screen**
5. **Compare counts again**

### Step 5: Debug Logging

Add this to see what's being counted:

In `backend/src/modules/supervisor/supervisorController.js`, after line 2016, add:
```javascript
console.log('📊 Dashboard Approval Counts:', {
  supervisorId: supervisorId,
  employeeIds: employeeIds.length,
  projectIds: projectIds.length,
  leaveCount,
  advanceCount,
  materialCount,
  toolCount,
  total: leaveCount + advanceCount + materialCount + toolCount
});
```

In `backend/src/modules/supervisor/supervisorRequestController.js`, after line 2678, add:
```javascript
console.log('📊 Approvals Screen Counts:', {
  supervisorId: supervisor.id,
  employeeIds: employeeIds.length,
  projectIds: projectIds.length,
  leaveCount,
  advanceCount,
  materialCount,
  toolCount,
  total: leaveCount + advanceCount + materialCount + toolCount
});
```

Then check your backend console logs when loading both screens.

## Expected Behavior

Both should show **exactly the same total** because:
- Both query by `employeeId: { $in: employeeIds }`
- Both query by `projectId: { $in: projectIds }`
- Both use `status: 'PENDING'`
- Both count the same collections

## If Counts Still Don't Match

Please provide:
1. Dashboard count (from API response log)
2. Approvals screen count (from API response log)
3. Backend console logs (if you added debug logging)
4. Are you using the same supervisor account in both views?

This will help identify the exact cause of the mismatch.
