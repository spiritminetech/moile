import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/auth/User.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

async function fixSupervisorEmployeeLink() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find supervisor user
    const supervisorUser = await User.findOne({ email: 'supervisor@gmail.com' });
    if (!supervisorUser) {
      console.error('❌ Supervisor user not found');
      return;
    }

    console.log('✅ Found Supervisor User:');
    console.log(`   User ID: ${supervisorUser.id}`);
    console.log(`   Email: ${supervisorUser.email}`);
    console.log(`   Role: ${supervisorUser.role}`);

    // Find employee with this userId
    let employee = await Employee.findOne({ userId: supervisorUser.id });
    
    if (!employee) {
      console.log('\n⚠️  No employee found with userId, searching by ID...');
      employee = await Employee.findOne({ id: supervisorUser.id });
    }

    if (!employee) {
      console.error('\n❌ No employee record found for this supervisor');
      console.log('\n📋 All employees:');
      const allEmployees = await Employee.find({}).limit(10);
      allEmployees.forEach(e => {
        console.log(`   ID: ${e.id}, Name: ${e.fullName}, UserId: ${e.userId}`);
      });
      return;
    }

    console.log('\n✅ Found Employee:');
    console.log(`   Employee ID: ${employee.id}`);
    console.log(`   Name: ${employee.fullName}`);
    console.log(`   UserId: ${employee.userId}`);
    console.log(`   Current Project: ${employee.currentProjectId}`);

    // Update employee to link to user
    if (employee.userId !== supervisorUser.id) {
      console.log('\n🔧 Updating employee userId...');
      await Employee.findOneAndUpdate(
        { id: employee.id },
        { userId: supervisorUser.id },
        { new: true }
      );
      console.log('✅ Updated employee userId');
    }

    // Verify the link
    const verifyEmployee = await Employee.findOne({ userId: supervisorUser.id });
    if (verifyEmployee) {
      console.log('\n✅ Verification Successful:');
      console.log(`   User ID ${supervisorUser.id} → Employee ID ${verifyEmployee.id}`);
      console.log(`   Employee Name: ${verifyEmployee.fullName}`);
    } else {
      console.error('\n❌ Verification failed - employee not found by userId');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

fixSupervisorEmployeeLink();
