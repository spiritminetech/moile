# Approval Queue Count Investigation

## Issue
Dashboard shows 1 approval (1 tool request), but Approvals screen shows 5 approvals.

## Investigation Results

### Diagnostic Script Findings

Ran `check-approval-count-debug.js` which revealed:

**Supervisor Info:**
- ID: 4
- Name: kawaja
- Projects: 1003, 1002, 1001, 1014, 101 (6 projects, with 1002 appearing twice)

**Employee Query Patterns:**
- Pattern 1 (`currentProject.id`): 6 employees
- Pattern 2 (`currentProjectId`): 0 employees  
- Pattern 3 (`$or` combined): 6 employees

**Approval Counts:**
Both patterns return the same counts:
- Leave: 3
- Advance: 1
- Material: 1
- Tool: 0
- **Total: 5**

**Key Finding - Tool Request Issue:**
There is 1 pending tool request in the database:
- Request ID: 1770044161085
- Project ID: 1
- Item: spanner
- Status: PENDING
- **Problem: Project 1 is NOT in supervisor 4's projects!**

### Root Cause

The tool request (ID: 1770044161085) is for Project 1, which is NOT assigned to supervisor 4. The correct tool count for this supervisor should be **0**, not 1.

This means:
- **Expected dashboard count: 5 approvals** (3 leave + 1 advance + 1 material + 0 tool)
- **Expected approvals screen count: 5 approvals** (same breakdown)
- **Current dashboard showing: 1 approval** (incorrectly showing 1 tool request)

## Next Steps

1. **Restart backend server** to apply the debug logging added to `supervisorController.js`
2. **Check backend console** when dashboard loads to see:
   - What `projectIds` are being used in the query
   - What `allEmployeeIds` are being used
   - What the actual counts are (leaveCount, advanceCount, materialCount, toolCount)
   - What tool requests are actually being found
3. **Identify why** the dashboard is showing 1 tool request when the query should return 0

## Debug Logging Added

Added comprehensive logging to `getDashboardData` function:
- Log query parameters (allEmployeeIds, projectIds)
- Log approval counts (leaveCount, advanceCount, materialCount, toolCount)
- Log actual tool requests found with their project IDs

## Expected Behavior

Both dashboard and approvals screen should show:
- Leave Requests: 3
- Advance Payments: 1
- Material Requests: 1
- Tool Requests: 0
- **Total: 5 approvals**
