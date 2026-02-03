// Fix worker role assignment in CompanyUser table
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';
import Role from './src/modules/role/Role.js';

dotenv.config();

async function fixWorkerRole() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Find the worker user
    const workerUser = await User.findOne({ email: 'worker1@gmail.com' });
    if (!workerUser) {
      console.log('❌ Worker user not found!');
      return;
    }
    console.log(`👤 Found worker user: ID ${workerUser.id}`);

    // 2. Find all available roles
    console.log('\n📋 Available roles:');
    const allRoles = await Role.find({});
    allRoles.forEach(role => {
      console.log(`  - ID: ${role.id}, Name: ${role.name}, Code: ${role.code}`);
    });

    // 3. Find worker role
    let workerRole = await Role.findOne({ 
      $or: [
        { name: { $regex: /worker/i } },
        { code: { $regex: /worker/i } }
      ]
    });

    if (!workerRole) {
      console.log('\n❌ No worker role found, creating one...');
      // Get next role ID
      const lastRole = await Role.findOne().sort({ id: -1 });
      const nextRoleId = lastRole ? lastRole.id + 1 : 1;
      
      workerRole = new Role({
        id: nextRoleId,
        name: 'Worker',
        code: 'WORKER',
        description: 'Construction Worker Role',
        isActive: true
      });
      await workerRole.save();
      console.log(`✅ Created worker role: ID ${workerRole.id}, Name: ${workerRole.name}`);
    } else {
      console.log(`\n✅ Found worker role: ID ${workerRole.id}, Name: ${workerRole.name}`);
    }

    // 4. Update CompanyUser record
    const companyUser = await CompanyUser.findOne({ userId: workerUser.id });
    if (companyUser) {
      console.log(`\n🔧 Updating CompanyUser record...`);
      console.log(`  Before: Company ${companyUser.companyId}, Role ID: ${companyUser.roleId}`);
      
      companyUser.roleId = workerRole.id;
      companyUser.role = workerRole.name; // Add role name if field exists
      companyUser.isActive = true;
      await companyUser.save();
      
      console.log(`  After: Company ${companyUser.companyId}, Role ID: ${companyUser.roleId}`);
      console.log('✅ CompanyUser record updated successfully');
    } else {
      console.log('\n❌ CompanyUser record not found!');
    }

    // 5. Verify the fix
    console.log('\n✅ VERIFICATION:');
    const updatedCompanyUser = await CompanyUser.findOne({ userId: workerUser.id });
    const verifyRole = await Role.findOne({ id: updatedCompanyUser?.roleId });
    
    console.log(`User: ${workerUser.email}`);
    console.log(`Company: ${updatedCompanyUser?.companyId}`);
    console.log(`Role ID: ${updatedCompanyUser?.roleId}`);
    console.log(`Role Name: ${verifyRole?.name}`);
    
    if (updatedCompanyUser?.roleId && verifyRole) {
      console.log('✅ Worker role assignment is now complete! Login should work.');
    } else {
      console.log('❌ Role assignment still has issues.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixWorkerRole();