// Script to compare current user (employee 27) vs target user (employee 107)
import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function debugCurrentVsTargetUser() {
  console.log('🔍 Current User vs Target User Analysis');
  console.log('======================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check current user (employee 27)
    console.log('\n1️⃣ CURRENT USER (Employee 27)...');
    const currentEmployee = await Employee.findOne({ id: 27 });
    
    if (currentEmployee) {
      console.log('✅ Current Employee found:');
      console.log(`   Employee ID: ${currentEmployee.id}`);
      console.log(`   Name: ${currentEmployee.fullName}`);
      console.log(`   User ID: ${currentEmployee.userId}`);
      console.log(`   Employee Code: ${currentEmployee.employeeCode}`);
      console.log(`   Status: ${currentEmployee.status}`);
      
      if (currentEmployee.userId) {
        const currentUser = await User.findOne({ id: currentEmployee.userId });
        if (currentUser) {
          console.log(`   Email: ${currentUser.email}`);
        } else {
          console.log(`   Email: [User not found for userId ${currentEmployee.userId}]`);
        }
      } else {
        console.log('   Email: [No userId defined]');
      }
    } else {
      console.log('❌ Current employee (ID 27) not found');
    }

    // Check target user (employee 107)
    console.log('\n2️⃣ TARGET USER (Employee 107)...');
    const targetEmployee = await Employee.findOne({ id: 107 });
    
    if (targetEmployee) {
      console.log('✅ Target Employee found:');
      console.log(`   Employee ID: ${targetEmployee.id}`);
      console.log(`   Name: ${targetEmployee.fullName}`);
      console.log(`   User ID: ${targetEmployee.userId}`);
      console.log(`   Employee Code: ${targetEmployee.employeeCode}`);
      console.log(`   Status: ${targetEmployee.status}`);
      
      const targetUser = await User.findOne({ id: targetEmployee.userId });
      if (targetUser) {
        console.log(`   Email: ${targetUser.email}`);
      } else {
        console.log(`   Email: [User not found for userId ${targetEmployee.userId}]`);
      }
    } else {
      console.log('❌ Target employee (ID 107) not found');
    }

    // Provide solution
    console.log('\n3️⃣ SOLUTION...');
    if (currentEmployee && targetEmployee) {
      console.log('🔑 To fix the leave request issue:');
      console.log('');
      console.log('CURRENT PROBLEM:');
      console.log(`   - You are logged in as: ${currentEmployee.fullName} (Employee ID ${currentEmployee.id})`);
      console.log(`   - But you want to submit leave for: ${targetEmployee.fullName} (Employee ID ${targetEmployee.id})`);
      console.log('');
      console.log('SOLUTION:');
      console.log('1. Log out from the mobile app');
      console.log(`2. Log in using email: worker1@gmail.com`);
      console.log('3. Enter the correct password for Raj Kumar');
      console.log('4. Try submitting the leave request again');
      console.log('');
      console.log('ALTERNATIVE:');
      console.log('If you want to submit leave requests as the current user (Vijay Kumar),');
      console.log('the system will work correctly but the employeeId will be 27, not 107.');
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugCurrentVsTargetUser();