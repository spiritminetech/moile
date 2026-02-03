// Script to find login credentials for employee 107
// This will help you log in as the correct user

import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function findEmployee107Login() {
  console.log('🔍 Finding Login Credentials for Employee 107');
  console.log('==============================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Get employee 107 details
    console.log('\n1️⃣ Employee 107 Details...');
    const employee107 = await Employee.findOne({ id: 107 });
    
    if (!employee107) {
      console.log('❌ Employee 107 not found');
      return;
    }

    console.log('✅ Employee 107 found:');
    console.log('   Employee ID:', employee107.id);
    console.log('   User ID:', employee107.userId);
    console.log('   Name:', employee107.fullName);
    console.log('   Employee Code:', employee107.employeeCode);
    console.log('   Phone:', employee107.phone);

    // 2. Get the corresponding user record
    console.log('\n2️⃣ User Record for Employee 107...');
    const user = await User.findOne({ id: employee107.userId });
    
    if (!user) {
      console.log('❌ User record not found for userId:', employee107.userId);
      return;
    }

    console.log('✅ User record found:');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Status:', user.status);

    // 3. Check current logged-in user (employee 27)
    console.log('\n3️⃣ Current Logged-in User (Employee 27)...');
    const currentEmployee = await Employee.findOne({ id: 27 });
    
    if (currentEmployee) {
      console.log('Current employee details:');
      console.log('   Employee ID:', currentEmployee.id);
      console.log('   User ID:', currentEmployee.userId);
      console.log('   Name:', currentEmployee.fullName);
      
      const currentUser = await User.findOne({ id: currentEmployee.userId });
      if (currentUser) {
        console.log('   Email:', currentUser.email);
      }
    }

    // 4. Provide login instructions
    console.log('\n4️⃣ Login Instructions...');
    console.log('🔑 To log in as Employee 107:');
    console.log(`   Email: ${user.email}`);
    console.log('   Password: [You need to know the password]');
    console.log('');
    console.log('📱 Steps to fix the issue:');
    console.log('1. Open your mobile app');
    console.log('2. Log out from current session');
    console.log(`3. Log in using email: ${user.email}`);
    console.log('4. Enter the correct password for this user');
    console.log('5. Try submitting the leave request again');

    // 5. Alternative: Check if there are multiple users
    console.log('\n5️⃣ All Available Users...');
    const allUsers = await User.find({}).limit(10);
    console.log('Available user accounts:');
    
    for (const u of allUsers) {
      const emp = await Employee.findOne({ userId: u.id });
      console.log(`   - Email: ${u.email}, User ID: ${u.id}, Employee: ${emp ? `${emp.id} (${emp.fullName})` : 'No employee'}`);
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

console.log('💡 This script will:');
console.log('1. Find the login email for employee 107');
console.log('2. Show current vs target user details');
console.log('3. Provide instructions to log in correctly');
console.log('\nRun: node find-employee-107-login.js\n');

findEmployee107Login();