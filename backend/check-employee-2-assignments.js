// Check assignments for employee ID 2

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function checkEmployee2Assignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find employee 2
    const employee = await Employee.findOne({ employeeId: 2 });
    if (employee) {
      console.log('👤 Employee 2:');
      console.log(`   Name: ${employee.name}`);
      console.log(`   Email: ${employee.email}`);
      console.log(`   Role: ${employee.role}\n`);
    } else {
      console.log('❌ Employee 2 not found\n');
    }

    // Find user for employee 2
    const user = await User.findOne({ employeeId: 2 });
    if (user) {
      console.log('👤 User Account:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}\n`);
    } else {
      console.log('❌ No user account found for employee 2\n');
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find ALL assignments for employee 2
    const allAssignments = await WorkerTaskAssignment.find({ employeeId: 2 }).sort({ assignmentId: 1 });
    console.log(`📊 Total assignments for employee 2: ${allAssignments.length}\n`);

    if (allAssignments.length > 0) {
      console.log('📋 ALL Assignments:\n');
      allAssignments.forEach(assignment => {
        console.log(`Assignment ${assignment.assignmentId}: ${assignment.taskName}`);
        console.log(`   Status: ${assignment.status}`);
        console.log(`   Date: ${assignment.date}`);
        console.log(`   Daily Target:`);
        if (assignment.dailyTarget) {
          console.log(`     Quantity: ${assignment.dailyTarget.quantity || 'MISSING'} ${assignment.dailyTarget.unit || ''}`);
          console.log(`     Description: ${assignment.dailyTarget.description || 'MISSING'}`);
        } else {
          console.log(`     ❌ NO DAILY TARGET`);
        }
        console.log('');
      });
    }

    // Find today's assignments
    const todayAssignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: { $gte: today }
    }).sort({ sequence: 1 });

    console.log(`📅 Today's assignments: ${todayAssignments.length}\n`);

    if (todayAssignments.length > 0) {
      console.log('📋 TODAY\'S Assignments:\n');
      todayAssignments.forEach(assignment => {
        console.log(`${assignment.sequence}. ${assignment.taskName} (ID: ${assignment.assignmentId})`);
        console.log(`   Status: ${assignment.status}`);
        console.log(`   Expected Output: ${assignment.dailyTarget?.quantity || 0} ${assignment.dailyTarget?.unit || 'units'}`);
        console.log(`   Actual Output: ${assignment.actualOutput || 0} ${assignment.dailyTarget?.unit || 'units'}`);
        console.log('');
      });
    } else {
      console.log('❌ No assignments for today\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkEmployee2Assignments();
