// Fix worker company assignment and JWT token issue
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

async function fixWorkerCompanyAssignment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Find the worker user
    const workerUser = await User.findOne({ email: 'worker1@gmail.com' });
    if (!workerUser) {
      console.log('❌ Worker user not found!');
      return;
    }
    console.log(`👤 Found worker user: ID ${workerUser.id}, Email: ${workerUser.email}`);

    // 2. Check CompanyUser record
    let companyUser = await CompanyUser.findOne({ userId: workerUser.id });
    console.log('\n🏢 CompanyUser record:');
    if (companyUser) {
      console.log(`  Company ID: ${companyUser.companyId}, Role: ${companyUser.role}`);
    } else {
      console.log('  ❌ No CompanyUser record found!');
    }

    // 3. Check Employee record
    const employee = await Employee.findOne({ userId: workerUser.id });
    console.log('\n👷 Employee record:');
    if (employee) {
      console.log(`  Employee ID: ${employee.id}, Company: ${employee.companyId}, Name: ${employee.fullName}`);
    } else {
      console.log('  ❌ No Employee record found!');
    }

    // 4. Fix CompanyUser record if missing or incorrect
    if (!companyUser && employee) {
      console.log('\n🔧 Creating missing CompanyUser record...');
      companyUser = new CompanyUser({
        userId: workerUser.id,
        companyId: employee.companyId,
        role: 'worker',
        status: 'active'
      });
      await companyUser.save();
      console.log(`✅ Created CompanyUser record: Company ${employee.companyId}, Role: worker`);
    } else if (companyUser && employee && companyUser.companyId !== employee.companyId) {
      console.log('\n🔧 Fixing CompanyUser company mismatch...');
      companyUser.companyId = employee.companyId;
      await companyUser.save();
      console.log(`✅ Updated CompanyUser company to ${employee.companyId}`);
    }

    // 5. Verify the fix
    console.log('\n✅ VERIFICATION:');
    const updatedCompanyUser = await CompanyUser.findOne({ userId: workerUser.id });
    const updatedEmployee = await Employee.findOne({ userId: workerUser.id });
    
    console.log(`User ID: ${workerUser.id}`);
    console.log(`CompanyUser: Company ${updatedCompanyUser?.companyId}, Role: ${updatedCompanyUser?.role}`);
    console.log(`Employee: Company ${updatedEmployee?.companyId}, Name: ${updatedEmployee?.fullName}`);
    
    if (updatedCompanyUser?.companyId === updatedEmployee?.companyId) {
      console.log('✅ Company IDs match! The worker should now be able to clock in.');
    } else {
      console.log('❌ Company IDs still don\'t match!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixWorkerCompanyAssignment();