// Check what employee ID is linked to worker@gmail.com

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function checkWorkerGmailEmployee() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user with worker@gmail.com
    const user = await User.findOne({ email: 'worker@gmail.com' });
    if (user) {
      console.log('👤 User Account (worker@gmail.com):');
      console.log(`   User ID: ${user._id}`);
      console.log(`   Employee ID: ${user.employeeId}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}\n`);

      // Find the employee record
      if (user.employeeId) {
        const employee = await Employee.findOne({ employeeId: user.employeeId });
        if (employee) {
          console.log('👤 Employee Record:');
          console.log(`   Employee ID: ${employee.employeeId}`);
          console.log(`   Name: ${employee.name}`);
          console.log(`   Email: ${employee.email}`);
          console.log(`   Role: ${employee.role}\n`);
        } else {
          console.log(`❌ No employee record found for employeeId: ${user.employeeId}\n`);
        }

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find ALL assignments for this employee
        const allAssignments = await WorkerTaskAssignment.find({ 
          employeeId: user.employeeId 
        }).sort({ assignmentId: 1 });
        
        console.log(`📊 Total assignments for employee ${user.employeeId}: ${allAssignments.length}\n`);

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
          employeeId: user.employeeId,
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
      } else {
        console.log('❌ User has no employeeId linked\n');
      }
    } else {
      console.log('❌ No user found with email: worker@gmail.com\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkWorkerGmailEmployee();
