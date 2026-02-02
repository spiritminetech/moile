import mongoose from 'mongoose';
import User from './src/modules/user/User.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';
import Role from './src/modules/role/Role.js';
import Permission from './src/modules/permission/Permission.js';
import RolePermission from './src/modules/rolePermission/RolePermission.js';

async function checkUserPermissions() {
  try {
    await mongoose.connect('mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp');
    console.log('✅ Connected to MongoDB');
    
    // Check supervisor user
    const supervisorUser = await User.findOne({ email: 'supervisor@gmail.com' });
    if (supervisorUser) {
      console.log('\n👤 Supervisor User:', supervisorUser.email, 'ID:', supervisorUser.id);
      
      // Get company user info
      const companyUser = await CompanyUser.findOne({ userId: supervisorUser.id });
      if (companyUser) {
        console.log('🏢 Company User - Role ID:', companyUser.roleId);
        
        // Get role info - FIXED: Use findOne with custom id field
        const role = await Role.findOne({ id: companyUser.roleId });
        if (role) {
          console.log('👔 Role:', role.name);
          
          // Get role permissions
          const rolePermissions = await RolePermission.find({ roleId: role.id });
          console.log('🔑 Role has', rolePermissions.length, 'permissions');
          
          // Get permission details - FIXED: Use findOne with custom id field
          for (const rp of rolePermissions) {
            const permission = await Permission.findOne({ id: rp.permissionId });
            if (permission) {
              console.log('   -', permission.code);
            }
          }
        }
      }
    } else {
      console.log('❌ Supervisor user not found');
    }
    
    // Check dashboard.worker user
    const dashboardWorker = await User.findOne({ email: 'dashboard.worker@company.com' });
    if (dashboardWorker) {
      console.log('\n👤 Dashboard Worker User:', dashboardWorker.email, 'ID:', dashboardWorker.id);
      
      // Get company user info
      const companyUser = await CompanyUser.findOne({ userId: dashboardWorker.id });
      if (companyUser) {
        console.log('🏢 Company User - Role ID:', companyUser.roleId);
        
        // Get role info - FIXED: Use findOne with custom id field
        const role = await Role.findOne({ id: companyUser.roleId });
        if (role) {
          console.log('👔 Role:', role.name);
          
          // Get role permissions
          const rolePermissions = await RolePermission.find({ roleId: role.id });
          console.log('🔑 Role has', rolePermissions.length, 'permissions');
          
          // Get permission details - FIXED: Use findOne with custom id field
          for (const rp of rolePermissions) {
            const permission = await Permission.findOne({ id: rp.permissionId });
            if (permission) {
              console.log('   -', permission.code);
            }
          }
        }
      }
    }
    
    // List all available permissions
    console.log('\n📋 All Available Permissions:');
    const allPermissions = await Permission.find({});
    allPermissions.forEach(p => {
      console.log('   -', p.code, '(ID:', p.id + ')');
    });
    
    // List all roles
    console.log('\n👥 All Available Roles:');
    const allRoles = await Role.find({});
    allRoles.forEach(r => {
      console.log('   -', r.name, '(ID:', r.id + ')');
    });
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUserPermissions();