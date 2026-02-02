// Script to add SUPERVISOR_ATTENDANCE_VIEW permission and assign it to supervisor role
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import Permission from './src/modules/permission/Permission.js';
import Role from './src/modules/role/Role.js';
import RolePermission from './src/modules/rolePermission/RolePermission.js';

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function addSupervisorAttendancePermission() {
  try {
    console.log('🔧 Adding SUPERVISOR_ATTENDANCE_VIEW permission...');

    // Check if permission already exists
    let permission = await Permission.findOne({ code: 'SUPERVISOR_ATTENDANCE_VIEW' });
    
    if (!permission) {
      // Get the next ID
      const lastPermission = await Permission.findOne().sort({ id: -1 });
      const nextId = lastPermission ? lastPermission.id + 1 : 1;

      // Create new permission
      permission = await Permission.create({
        id: nextId,
        module: 'SUPERVISOR',
        action: 'ATTENDANCE_VIEW',
        code: 'SUPERVISOR_ATTENDANCE_VIEW',
        isActive: true
      });
      
      console.log(`✅ Created permission: ${permission.code} (ID: ${permission.id})`);
    } else {
      console.log(`ℹ️ Permission already exists: ${permission.code} (ID: ${permission.id})`);
    }

    // Find supervisor role
    const supervisorRole = await Role.findOne({ name: 'SUPERVISOR' });
    if (!supervisorRole) {
      console.log('❌ SUPERVISOR role not found');
      return;
    }

    console.log(`📋 Found supervisor role: ${supervisorRole.name} (ID: ${supervisorRole.id})`);

    // Check if role-permission mapping already exists
    const existingRolePermission = await RolePermission.findOne({
      roleId: supervisorRole.id,
      permissionId: permission.id
    });

    if (!existingRolePermission) {
      // Get the next ID for RolePermission
      const lastRolePermission = await RolePermission.findOne().sort({ id: -1 });
      const nextRolePermissionId = lastRolePermission ? lastRolePermission.id + 1 : 1;

      // Create role-permission mapping
      await RolePermission.create({
        id: nextRolePermissionId,
        roleId: supervisorRole.id,
        permissionId: permission.id
      });

      console.log(`✅ Assigned permission ${permission.code} to role ${supervisorRole.name}`);
    } else {
      console.log(`ℹ️ Permission ${permission.code} already assigned to role ${supervisorRole.name}`);
    }

    // Verify the assignment
    const rolePermissions = await RolePermission.find({ roleId: supervisorRole.id });
    
    console.log(`\n📊 SUPERVISOR role now has ${rolePermissions.length} permissions:`);
    
    for (const rp of rolePermissions) {
      const permission = await Permission.findOne({ id: rp.permissionId });
      console.log(`   - ${permission?.code || 'Unknown permission'}`);
    }

    console.log('\n✅ Permission setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart the frontend application');
    console.log('2. The supervisor user should now have access to /supervisor/late-absent');
    console.log('3. You can optionally update the route to use SUPERVISOR_ATTENDANCE_VIEW permission');

  } catch (error) {
    console.error('❌ Error adding permission:', error);
  }
}

async function main() {
  console.log('🚀 Adding SUPERVISOR_ATTENDANCE_VIEW permission\n');
  
  await connectDB();
  await addSupervisorAttendancePermission();
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

main().catch(console.error);