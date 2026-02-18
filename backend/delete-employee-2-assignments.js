// Delete all assignments for employee 2 and verify employee 107 assignments

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));

async function deleteEmployee2Assignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check user account
    const user = await User.findOne({ email: 'worker@gmail.com' });
    console.log('👤 User Account (worker@gmail.com):');
    console.log(`   Employee ID: ${user.employeeId}\n`);

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find and delete all assignments for employee 2
    const employee2Assignments = await WorkerTaskAssignment.find({ 
      employeeId: 2,
      date: { $gte: today }
    });

    console.log(`📊 Found ${employee2Assignments.length} assignments for employee 2\n`);

    if (employee2Assignments.length > 0) {
      console.log('🗑️ Deleting assignments for employee 2...\n');
      const deleteResult = await WorkerTaskAssignment.deleteMany({ 
        employeeId: 2,
        date: { $gte: today }
      });
      console.log(`✅ Deleted ${deleteResult.deletedCount} assignments for employee 2\n`);
    }

    // Check assignments for employee 107
    const employee107Assignments = await WorkerTaskAssignment.find({ 
      employeeId: 107,
      date: { $gte: today }
    }).sort({ sequence: 1 });

    console.log(`📊 Found ${employee107Assignments.length} assignments for employee 107\n`);

    if (employee107Assignments.length > 0) {
      console.log('📋 Assignments for Employee 107:\n');
      employee107Assignments.forEach(assignment => {
        console.log(`${assignment.sequence}. ${assignment.taskName} (ID: ${assignment.assignmentId})`);
        console.log(`   Status: ${assignment.status}`);
        if (assignment.dailyTarget) {
          console.log(`   Expected Output: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
        } else {
          console.log(`   Expected Output: NO DAILY TARGET`);
        }
        console.log('');
      });
    } else {
      console.log('❌ No assignments found for employee 107\n');
    }

    console.log('✅ Done! Now restart the backend server.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

deleteEmployee2Assignments();
