// Script to check all employees in the database
import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function debugAllEmployees() {
  console.log('🔍 Checking All Employees in Database');
  console.log('====================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all employees
    const employees = await Employee.find({}).sort({ id: 1 });
    console.log(`\n📊 Found ${employees.length} employees:`);
    
    for (const emp of employees) {
      console.log(`\n👤 Employee ID: ${emp.id}`);
      console.log(`   Name: ${emp.fullName}`);
      console.log(`   User ID: ${emp.userId}`);
      console.log(`   Employee Code: ${emp.employeeCode}`);
      console.log(`   Status: ${emp.status}`);
      
      // Get corresponding user
      const user = await User.findOne({ id: emp.userId });
      if (user) {
        console.log(`   Email: ${user.email}`);
      } else {
        console.log(`   Email: [User not found for userId ${emp.userId}]`);
      }
    }

    // Check if there's an employee with fullName containing "Gaiwad"
    console.log('\n🔍 Searching for "Gaiwad singh"...');
    const gaiwadEmployee = await Employee.findOne({ 
      fullName: { $regex: /gaiwad/i } 
    });
    
    if (gaiwadEmployee) {
      console.log('✅ Found Gaiwad employee:');
      console.log(`   Employee ID: ${gaiwadEmployee.id}`);
      console.log(`   Name: ${gaiwadEmployee.fullName}`);
      console.log(`   User ID: ${gaiwadEmployee.userId}`);
    } else {
      console.log('❌ No employee with name containing "Gaiwad" found');
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugAllEmployees();