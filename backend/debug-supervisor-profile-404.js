import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';
import User from './src/modules/user/User.js';
import Company from './src/modules/company/Company.js';

dotenv.config();

async function debugSupervisorProfile() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all supervisors in CompanyUser
    const supervisors = await CompanyUser.find({ role: 'supervisor' });
    console.log(`\n📊 Found ${supervisors.length} supervisor(s) in CompanyUser:`);
    
    for (const supervisor of supervisors) {
      console.log(`\n🔍 Checking Supervisor:`);
      console.log(`   - userId: ${supervisor.userId}`);
      console.log(`   - companyId: ${supervisor.companyId}`);
      console.log(`   - role: ${supervisor.role}`);

      // Find corresponding employee
      const employee = await Employee.findOne({ 
        userId: supervisor.userId, 
        companyId: supervisor.companyId,
        status: 'ACTIVE'
      });

      if (employee) {
        console.log(`   ✅ Employee found:`);
        console.log(`      - id: ${employee.id}`);
        console.log(`      - fullName: ${employee.fullName}`);
        console.log(`      - status: ${employee.status}`);
        console.log(`      - userId: ${employee.userId}`);
        console.log(`      - companyId: ${employee.companyId}`);
      } else {
        console.log(`   ❌ No ACTIVE employee found for this supervisor`);
        
        // Check if employee exists with different status
        const anyEmployee = await Employee.findOne({ 
          userId: supervisor.userId, 
          companyId: supervisor.companyId
        });
        
        if (anyEmployee) {
          console.log(`   ⚠️  Employee exists but with status: ${anyEmployee.status}`);
          console.log(`      - id: ${anyEmployee.id}`);
          console.log(`      - fullName: ${anyEmployee.fullName}`);
        } else {
          console.log(`   ❌ No employee record exists at all`);
        }
      }

      // Check User
      const user = await User.findOne({ id: supervisor.userId });
      if (user) {
        console.log(`   ✅ User found: ${user.email}`);
      } else {
        console.log(`   ❌ User not found`);
      }

      // Check Company
      const company = await Company.findOne({ id: supervisor.companyId });
      if (company) {
        console.log(`   ✅ Company found: ${company.name}`);
      } else {
        console.log(`   ❌ Company not found`);
      }
    }

    // Also check all employees to see if any should be supervisors
    console.log(`\n\n📋 All Employees:`);
    const allEmployees = await Employee.find().limit(10);
    for (const emp of allEmployees) {
      console.log(`   - id: ${emp.id}, name: ${emp.fullName}, userId: ${emp.userId}, status: ${emp.status}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugSupervisorProfile();
