import mongoose from 'mongoose';
import Permission from './src/modules/permission/Permission.js';
import RolePermission from './src/modules/rolePermission/RolePermission.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

// Supervisor role ID from your database
const SUPERVISOR_ROLE_ID = 5;

// Driver permission IDs to remove from supervisor (65-75 are driver permissions)
const DRIVER_PERMISSION_IDS = [65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75];

// New supervisor-specific permissions (using IDs 76-86)
const newPermissions = [
  // Dashboard
  { id: 76, module: 'Supervisor', action: 'View Dashboard', code: 'SUPERVISOR_DASHBOARD_ACCESS', isActive: true },
  
  // Team Management permissions
  { id: 77, module: 'Supervisor', action: 'View Team Management', code: 'SUPERVISOR_TEAM_MANAGEMENT_VIEW', isActive: true },
  { id: 78, module: 'Supervisor', action: 'Manage Workers', code: 'SUPERVISOR_WORKER_OVERSIGHT', isActive: true },
  
  // Attendance Monitoring permissions
  { id: 79, module: 'Supervisor', action: 'Monitor Attendance', code: 'SUPERVISOR_ATTENDANCE_MONITORING', isActive: true },
  
  // Task Management permissions
  { id: 80, module: 'Supervisor', action: 'Assign Tasks', code: 'SUPERVISOR_TASK_ASSIGNMENT', isActive: true },
  { id: 81, module: 'Supervisor', action: 'Manage Tasks', code: 'SUPERVISOR_TASK_MANAGEMENT', isActive: true },
  
  // Progress Reporting permissions
  { id: 82, module: 'Supervisor', action: 'View Progress Reports', code: 'SUPERVISOR_PROGRESS_REPORTING', isActive: true },
  { id: 83, module: 'Supervisor', action: 'Project Oversight', code: 'SUPERVISOR_PROJECT_OVERSIGHT', isActive: true },
  
  // Approvals permissions
  { id: 84, module: 'Supervisor', action: 'Approve Requests', code: 'SUPERVISOR_REQUEST_APPROVAL', isActive: true },
  { id: 85, module: 'Supervisor', action: 'Workflow Management', code: 'SUPERVISOR_WORKFLOW_MANAGEMENT', isActive: true },
  
  // Materials & Tools permissions
  { id: 86, module: 'Supervisor', action: 'Manage Materials', code: 'SUPERVISOR_MATERIAL_MANAGEMENT', isActive: true },
  { id: 87, module: 'Supervisor', action: 'Allocate Tools', code: 'SUPERVISOR_TOOL_ALLOCATION', isActive: true },
];

async function addSupervisorPermissions() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Step 1: Remove driver permissions from supervisor role
    console.log('\n=== Removing Driver Permissions from Supervisor Role ===');
    for (const permId of DRIVER_PERMISSION_IDS) {
      const deleted = await RolePermission.deleteMany({
        roleId: SUPERVISOR_ROLE_ID,
        permissionId: permId
      });
      if (deleted.deletedCount > 0) {
        console.log(`✓ Removed driver permission ID ${permId} from Supervisor role`);
      }
    }

    // Step 2: Add new supervisor permissions to the permissions collection
    console.log('\n=== Adding New Supervisor Permissions ===');
    for (const perm of newPermissions) {
      const existing = await Permission.findOne({ id: perm.id });
      if (existing) {
        console.log(`✓ Permission ${perm.code} (ID: ${perm.id}) already exists`);
      } else {
        await Permission.create(perm);
        console.log(`✓ Created permission: ${perm.code} (ID: ${perm.id})`);
      }
    }

    // Step 3: Assign all new permissions to supervisor role
    console.log('\n=== Assigning Permissions to Supervisor Role ===');
    for (const perm of newPermissions) {
      const existing = await RolePermission.findOne({
        roleId: SUPERVISOR_ROLE_ID,
        permissionId: perm.id
      });
      
      if (existing) {
        console.log(`✓ Role permission already exists for ${perm.code}`);
      } else {
        await RolePermission.create({
          roleId: SUPERVISOR_ROLE_ID,
          permissionId: perm.id
        });
        console.log(`✓ Assigned ${perm.code} to Supervisor role`);
      }
    }

    // Step 4: Verify supervisor permissions
    console.log('\n=== Verifying Supervisor Permissions ===');
    const supervisorPermissions = await RolePermission.find({ roleId: SUPERVISOR_ROLE_ID });
    const permissionIds = supervisorPermissions.map(rp => rp.permissionId);
    
    const permissions = await Permission.find({ id: { $in: permissionIds } });
    
    console.log(`\nTotal permissions for Supervisor role: ${permissions.length}`);
    console.log('\nPermission codes:');
    permissions.forEach(p => {
      console.log(`  - ${p.code} (ID: ${p.id}) - ${p.action}`);
    });
    
    // Check for any remaining driver permissions
    const driverPerms = permissions.filter(p => p.code.includes('DRIVER'));
    if (driverPerms.length > 0) {
      console.log('\n⚠️  Warning: Found driver permissions still assigned:');
      driverPerms.forEach(p => console.log(`  - ${p.code} (ID: ${p.id})`));
    } else {
      console.log('\n✅ No driver permissions found - Clean!');
    }
    
    console.log('\n=== Summary ===');
    console.log('✅ All supervisor permissions have been configured successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart your backend server');
    console.log('2. Login as supervisor (supervisor@gmail.com / password123)');
    console.log('3. Each screen will now check for specific permissions');

  } catch (error) {
    console.error('❌ Error adding supervisor permissions:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
addSupervisorPermissions()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
