// ============================================
// MongoDB Commands to Add Supervisor Permissions
// ============================================
// Run these commands directly in MongoDB Compass or MongoDB Shell
// Database: construction_erp

// ============================================
// STEP 1: Insert New Permissions into 'permissions' collection
// ============================================

// Copy and paste these commands one by one in MongoDB Compass or Shell:

db.permissions.insertMany([
  {
    id: 65,
    module: "Supervisor",
    action: "View Team Management",
    code: "SUPERVISOR_TEAM_MANAGEMENT_VIEW",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 66,
    module: "Supervisor",
    action: "Manage Workers",
    code: "SUPERVISOR_WORKER_OVERSIGHT",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 67,
    module: "Supervisor",
    action: "Monitor Attendance",
    code: "SUPERVISOR_ATTENDANCE_MONITORING",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 68,
    module: "Supervisor",
    action: "Assign Tasks",
    code: "SUPERVISOR_TASK_ASSIGNMENT",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 69,
    module: "Supervisor",
    action: "Manage Tasks",
    code: "SUPERVISOR_TASK_MANAGEMENT",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 70,
    module: "Supervisor",
    action: "View Progress Reports",
    code: "SUPERVISOR_PROGRESS_REPORTING",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 71,
    module: "Supervisor",
    action: "Project Oversight",
    code: "SUPERVISOR_PROJECT_OVERSIGHT",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 72,
    module: "Supervisor",
    action: "Approve Requests",
    code: "SUPERVISOR_REQUEST_APPROVAL",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 73,
    module: "Supervisor",
    action: "Workflow Management",
    code: "SUPERVISOR_WORKFLOW_MANAGEMENT",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 74,
    module: "Supervisor",
    action: "Manage Materials",
    code: "SUPERVISOR_MATERIAL_MANAGEMENT",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 75,
    module: "Supervisor",
    action: "Allocate Tools",
    code: "SUPERVISOR_TOOL_ALLOCATION",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// ============================================
// STEP 2: Assign Permissions to Supervisor Role (roleId: 5)
// ============================================

db.rolePermissions.insertMany([
  {
    roleId: 5,
    permissionId: 65,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    roleId: 5,
    permissionId: 66,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    roleId: 5,
    permissionId: 67,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    roleId: 5,
    permissionId: 68,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    roleId: 5,
    permissionId: 69,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    roleId: 5,
    permissionId: 70,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    roleId: 5,
    permissionId: 71,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    roleId: 5,
    permissionId: 72,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    roleId: 5,
    permissionId: 73,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    roleId: 5,
    permissionId: 74,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    roleId: 5,
    permissionId: 75,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// ============================================
// STEP 3: Verify the Permissions Were Added
// ============================================

// Check all permissions for supervisor role
db.rolePermissions.find({ roleId: 5 });

// Get permission details
db.permissions.find({ 
  id: { $in: [32, 28, 31, 34, 33, 40, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75] } 
}).sort({ id: 1 });

// Count total permissions for supervisor
db.rolePermissions.countDocuments({ roleId: 5 });
// Should return: 19 (8 existing + 11 new)

// ============================================
// STEP 4: Check if Permissions Already Exist (Optional)
// ============================================

// Before inserting, check if permissions already exist:
db.permissions.find({ id: { $gte: 65, $lte: 75 } });

// If they exist, you can skip STEP 1 and only run STEP 2

// ============================================
// STEP 5: Remove Duplicates if Needed (Optional)
// ============================================

// If you accidentally inserted duplicates, remove them:
// db.permissions.deleteMany({ id: { $gte: 65, $lte: 75 } });
// db.rolePermissions.deleteMany({ roleId: 5, permissionId: { $gte: 65, $lte: 75 } });

// ============================================
// SUMMARY OF PERMISSIONS FOR SUPERVISOR (roleId: 5)
// ============================================

/*
Existing Permissions:
- 32: PROFILE_VIEW
- 28: SUPERVISOR_DASHBOARD_VIEW
- 31: SUPERVISOR_TASK_ASSIGN
- 34: SUPERVISOR_TASK_REVIEW
- 33: SUPERVISOR_PROGRESS_VIEW
- 40: LEAVE_PENDING_VIEW
- 63: SUPERVISOR_NOTIFICATION_MANAGE
- 64: SUPERVISOR_ATTENDANCE_VIEW

New Permissions Being Added:
- 65: SUPERVISOR_TEAM_MANAGEMENT_VIEW
- 66: SUPERVISOR_WORKER_OVERSIGHT
- 67: SUPERVISOR_ATTENDANCE_MONITORING
- 68: SUPERVISOR_TASK_ASSIGNMENT
- 69: SUPERVISOR_TASK_MANAGEMENT
- 70: SUPERVISOR_PROGRESS_REPORTING
- 71: SUPERVISOR_PROJECT_OVERSIGHT
- 72: SUPERVISOR_REQUEST_APPROVAL
- 73: SUPERVISOR_WORKFLOW_MANAGEMENT
- 74: SUPERVISOR_MATERIAL_MANAGEMENT
- 75: SUPERVISOR_TOOL_ALLOCATION

Total: 19 permissions
*/
