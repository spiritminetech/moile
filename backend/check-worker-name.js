// Check the actual worker name in database

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));

async function checkWorkerName() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find worker user
    const workerUser = await User.findOne({ email: 'worker@gmail.com' });
    if (!workerUser) {
      console.log('❌ worker@gmail.com user not found');
      return;
    }

    console.log('👤 Worker User:');
    console.log(`   Email: ${workerUser.email}`);
    console.log(`   Name: ${workerUser.name}`);
    console.log(`   Employee ID: ${workerUser.employeeId}`);
    console.log(`   User ID: ${workerUser._id}\n`);

    // Find employee
    const employee = await Employee.findOne({ employeeId: workerUser.employeeId });
    if (employee) {
      console.log('👷 Employee Record:');
      console.log(`   Name: ${employee.name}`);
      console.log(`   Employee ID: ${employee.employeeId}`);
      console.log(`   Email: ${employee.email}`);
      console.log(`   Phone: ${employee.phone}`);
      console.log(`   Role: ${employee.role}\n`);
    } else {
      console.log('❌ No employee record found\n');
    }

    // Check all employees to see if there's a Ravi Smith
    const allEmployees = await Employee.find({});
    console.log(`📋 All Employees (${allEmployees.length} total):\n`);
    allEmployees.forEach(emp => {
      console.log(`   - ${emp.name} (ID: ${emp.employeeId}, Email: ${emp.email || 'N/A'})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkWorkerName();
