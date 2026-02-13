# Supervisor Permissions Implementation

## Summary
Implemented screen-based permission checks for supervisor mobile app with proper database permissions.

## Changes Made

### 1. Backend Permission Script (`backend/add-supervisor-permissions.js`)

**Updated to:**
- Remove driver permissions (IDs 65-75) from supervisor role
- Create new supervisor-specific permissions (IDs 76-87)
- Assign proper permissions to supervisor role

**New Permission Codes:**
```javascript
SUPERVISOR_DASHBOARD_ACCESS          (ID: 76)  - Dashboard access
SUPERVISOR_TEAM_MANAGEMENT_VIEW      (ID: 77)  - Team Management screen
SUPERVISOR_WORKER_OVERSIGHT          (ID: 78)  - Worker management
SUPERVISOR_ATTENDANCE_MONITORING     (ID: 79)  - Attendance Monitoring screen
SUPERVISOR_TASK_ASSIGNMENT           (ID: 80)  - Task Assignment screen
SUPERVISOR_TASK_MANAGEMENT           (ID: 81)  - Task management
SUPERVISOR_PROGRESS_REPORTING        (ID: 82)  - Progress Reports screen
SUPERVISOR_PROJECT_OVERSIGHT         (ID: 83)  - Project oversight
SUPERVISOR_REQUEST_APPROVAL          (ID: 84)  - Approvals screen
SUPERVISOR_WORKFLOW_MANAGEMENT       (ID: 85)  - Workflow management
SUPERVISOR_MATERIAL_MANAGEMENT       (ID: 86)  - Materials & Tools screen
SUPERVISOR_TOOL_ALLOCATION           (ID: 87)  - Tool allocation
```

### 2. Frontend Navigation (`SupervisorNavigator.tsx`)

**Added:**
- `SCREEN_PERMISSIONS` constant mapping screens to permission codes
- Enhanced `checkAccess()` to show detailed permission error messages
- Permission checks on every screen's focus listener

**Screen Permission Mapping:**
- Dashboard → `SUPERVISOR_DASHBOARD_ACCESS`
- Team Management → `SUPERVISOR_TEAM_MANAGEMENT_VIEW`
- Attendance Monitoring → `SUPERVISOR_ATTENDANCE_MONITORING`
- Task Assignment → `SUPERVISOR_TASK_ASSIGNMENT`
- Progress Reports → `SUPERVISOR_PROGRESS_REPORTING`
- Approvals → `SUPERVISOR_REQUEST_APPROVAL`
- Materials & Tools → `SUPERVISOR_MATERIAL_MANAGEMENT`
- Profile → No specific permission (base supervisor role)

**Fixed:**
- Urgency comparison errors (changed 'urgent'/'high' to 'URGENT'/'HIGH')

## How It Works

1. **Permission Check Flow:**
   - User navigates to a screen
   - `focus` listener triggers `checkAccess()` with required permission
   - System checks if user has supervisor role
   - System checks if user has the specific permission code
   - If missing, shows alert: "You don't have permission to access this screen"

2. **Permission Storage:**
   - Backend returns permission codes as strings array
   - Stored in `authState.permissions`
   - Checked using `authState.permissions.includes(permissionCode)`

## Setup Instructions

### Step 1: Run Backend Script
```bash
cd moile/backend
node add-supervisor-permissions.js
```

This will:
- Remove driver permissions from supervisor role
- Create new supervisor permissions
- Assign permissions to supervisor role
- Verify the setup

### Step 2: Restart Backend Server
```bash
# Stop current server (Ctrl+C)
npm start
# or
node server.js
```

### Step 3: Test in Mobile App
1. Login as supervisor: `supervisor@gmail.com` / `password123`
2. Navigate to each screen
3. Verify no permission errors appear
4. Check that permissions are loaded correctly

### Step 4: Verify Permissions
Check the backend logs during login to see:
```
permissions: [
  'SUPERVISOR_DASHBOARD_ACCESS',
  'SUPERVISOR_TEAM_MANAGEMENT_VIEW',
  'SUPERVISOR_ATTENDANCE_MONITORING',
  ...
]
```

## Testing Permission Denial

To test permission denial:
1. Temporarily remove a permission from the database
2. Login as supervisor
3. Try to access that screen
4. Should see: "You don't have permission to access this screen"

## Database Structure

**Collections:**
- `permissions` - Stores all permission definitions
- `rolepermissions` - Maps roles to permissions
- `roles` - Supervisor role (ID: 5)

**Query to Check Supervisor Permissions:**
```javascript
// In MongoDB
db.rolepermissions.find({ roleId: 5 })
db.permissions.find({ id: { $in: [76,77,78,79,80,81,82,83,84,85,86,87] } })
```

## Troubleshooting

**Issue: "You don't have permission" on all screens**
- Check backend logs for permission codes returned during login
- Verify permissions exist in database
- Verify role_permissions mapping exists

**Issue: Driver permissions still showing**
- Re-run the backend script
- Check `rolepermissions` collection for driver permission IDs (65-75)
- Manually delete if needed

**Issue: Permissions not loading**
- Check AuthService.ts - permissions should be stored as string array
- Check AsyncStorage for PERMISSIONS key
- Verify backend returns permissions in login response

## Next Steps

1. Test all screens with supervisor login
2. Verify permission checks work correctly
3. Add similar permission checks for driver role if needed
4. Consider adding permission-based UI hiding (hide tabs user can't access)
