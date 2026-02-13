// MongoDB Script to Add Supervisor Permissions
// Run this in MongoDB Compass or mongosh

// Use your database
use('construction_erp');

// Supervisor role ID
const SUPERVISOR_ROLE_ID = 5;

// New permissions to add
const newPermissions = [
  // Team Management permissions
  { id: 65, module: 'Supervisor', action: 'View Team Management', code: 'SUPERVISOR_TEAM_MANAGEMENT_VIEW', isActive: true },
  { id: 66, module: 'Supervisor', action: 'Manage Workers', code: 'SUPERVISOR_WORKER_OVERSIGHT', isActive: true },
  
  // Attendance Monitoring permissions
  { id: 67, module: 'Supervisor', action: 'Monitor Attendance', code: 'SUPERVISOR_ATTENDANCE_MONITORING', isActive: true },
  
  // Task Management permissions
  { id: 68, module: 'Supervisor', action: 'Assign Tasks', code: 'SUPERVISOR_TASK_ASSIGNMENT', isActive: true },
  { id: 69, module: 'Supervisor', action: 'Manage Tasks', code: 'SUPERVISOR_TASK_MANAGEMENT', isActive: true },
  
  // Progress Reporting permissions
  { id: 70, module: 'Supervisor', action: 'View Progress Reports', code: 'SUPERVISOR_PROGRESS_REPORTING', isActive: true },
  { id: 71, module: 'Supervisor', action: 'Project Oversight', code: 'SUPERVISOR_PROJECT_OVERSIGHT', isActive: true },
  
  // Approvals permissions
  { id: 72, module: 'Supervisor', action: 'Approve Requests', code: 'SUPERVISOR_REQUEST_APPROVAL', isActive: true },
  { id: 73, module: 'Supervisor', action: 'Workflow Management', code: 'SUPERVISOR_WORKFLOW_MANAGEMENT', isActive: true },
  
  // Materials & Tools permissions
  { id: 74, module: 'Supervisor', action: 'Manage Materials', code: 'SUPERVISOR_MATERIAL_MANAGEMENT', isActive: true },
  { id: 75, module: 'Supervisor', action: 'Allocate Tools', code: 'SUPERVISOR_TOOL_ALLOCATION', isActive: true },
];

print('=== Adding Supervisor Permissions ===\n');

// Step 1: Insert permissions
newPermissions.forEach(perm => {
  const existing = db.permissions.findOne({ id: perm.id });
  if (existing) {
    print(`✓ Permission ${perm.code} (ID: ${perm.id}) already exists`);
  } else {
    db.permissions.insertOne({
      ...perm,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    print(`✓ Created permission: ${perm.code} (ID: ${perm.id})`);
  }
});

print('\n=== Assigning Permissions to Supervisor Role ===\n');

// Step 2: Assign permissions to supervisor role
newPermissions.forEach(perm => {
  const existing = db.rolePermissions.findOne({
    roleId: SUPERVISOR_ROLE_ID,
    permissionId: perm.id
  });
  
  if (existing) {
    print(`✓ Role permission already exists for ${perm.code}`);
  } else {
    db.rolePermissions.insertOne({
      roleId: SUPERVISOR_ROLE_ID,
      permissionId: perm.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    print(`✓ Assigned ${perm.code} to Supervisor role`);
  }
});

print('\n=== Verifying Supervisor Permissions ===\n');

// Step 3: Verify all supervisor permissions
const supervisorPermissions = db.rolePermissions.find({ roleId: SUPERVISOR_ROLE_ID }).toArray();
const permissionIds = supervisorPermissions.map(rp => rp.permissionId);
const permissions = db.permissions.find({ id: { $in: permissionIds } }).toArray();

print(`Total permissions for Supervisor role: ${permissions.length}\n`);
print('Permission codes:');
permissions.forEach(p => {
  print(`  - ${p.code} (ID: ${p.id})`);
});

print('\n=== Summary ===');
print('✅ All supervisor permissions have been added successfully!');
print('\nNext steps:');
print('1. Restart your backend server');
print('2. Login as supervisor (supervisor@gmail.com / password123)');
print('3. The Team Management screen should now work without permission errors');
