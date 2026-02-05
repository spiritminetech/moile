// Check credentials for employeeId 107
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkEmployee107() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find employee with ID 107
    console.log('\n🔍 Looking for employee with ID 107...');
    const employee = await Employee.findOne({ id: 107 });
    
    if (!employee) {
      console.log('❌ Employee with ID 107 not found');
      
      // Check all employees to see what IDs exist
      const allEmployees = await Employee.find({}).select('id fullName userId companyId status');
      console.log('\n📋 Available employees:');
      allEmployees.forEach(emp => {
        console.log(`   ID: ${emp.id}, Name: ${emp.fullName}, UserID: ${emp.userId}, CompanyID: ${emp.companyId}, Status: ${emp.status}`);
      });
      
      return;
    }

    console.log('✅ Employee found:', {
      id: employee.id,
      fullName: employee.fullName,
      userId: employee.userId,
      companyId: employee.companyId,
      status: employee.status,
      phone: employee.phone,
      employeeCode: employee.employeeCode
    });

    // Find associated user
    if (employee.userId) {
      console.log('\n🔍 Looking for associated user...');
      const user = await User.findOne({ id: employee.userId });
      
      if (user) {
        console.log('✅ User found:', {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          companyId: user.companyId
        });
        
        console.log('\n🔑 Login credentials for testing:');
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: [Use the password set for this user]`);
        console.log(`   Employee ID: ${employee.id}`);
      } else {
        console.log('❌ Associated user not found');
      }
    } else {
      console.log('❌ Employee has no associated userId');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkEmployee107();