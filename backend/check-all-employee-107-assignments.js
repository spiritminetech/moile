// Check ALL assignments for employee 107

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function checkAllEmployee107Assignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find ALL assignments for employee 107 (any date)
    const allAssignments = await WorkerTaskAssignment.find({ 
      employeeId: 107
    }).sort({ assignmentId: 1 });

    console.log(`📊 Total assignments for employee 107 (all dates): ${allAssignments.length}\n`);

    if (allAssignments.length > 0) {
      console.log('📋 ALL Assignments:\n');
      allAssignments.forEach(assignment => {
        console.log(`Assignment ${assignment.assignmentId}: ${assignment.taskName || 'UNNAMED'}`);
        console.log(`   Date: ${assignment.date}`);
        console.log(`   Status: ${assignment.status}`);
        if (assignment.dailyTarget) {
          console.log(`   Daily Target: ${assignment.dailyTarget.quantity || 0} ${assignment.dailyTarget.unit || 'units'}`);
        } else {
          console.log(`   Daily Target: MISSING`);
        }
        console.log('');
      });
    }

    // Find today's assignments
    const todayAssignments = await WorkerTaskAssignment.find({
      employeeId: 107,
      date: { $gte: today }
    }).sort({ assignmentId: 1 });

    console.log(`📅 Today's assignments (${today.toDateString()}): ${todayAssignments.length}\n`);

    if (todayAssignments.length > 0) {
      console.log('📋 TODAY\'S Assignments:\n');
      todayAssignments.forEach(assignment => {
        console.log(`Assignment ${assignment.assignmentId}: ${assignment.taskName || 'UNNAMED'}`);
        console.log(`   Status: ${assignment.status}`);
        if (assignment.dailyTarget) {
          console.log(`   Expected Output: ${assignment.dailyTarget.quantity || 0} ${assignment.dailyTarget.unit || 'units'}`);
        } else {
          console.log(`   Expected Output: MISSING`);
        }
        console.log('');
      });
    }

    // Check for assignments 7034-7043
    const oldAssignments = await WorkerTaskAssignment.find({
      employeeId: 107,
      assignmentId: { $gte: 7034, $lte: 7043 }
    });

    console.log(`🔍 Old assignments (7034-7043): ${oldAssignments.length}\n`);

    if (oldAssignments.length > 0) {
      console.log('⚠️ OLD ASSIGNMENTS STILL EXIST:\n');
      oldAssignments.forEach(assignment => {
        console.log(`   ${assignment.assignmentId}: ${assignment.taskName || 'UNNAMED'}`);
      });
      console.log('\n❌ These should be deleted!\n');
    }

    // Check for new assignments 9001-9003
    const newAssignments = await WorkerTaskAssignment.find({
      employeeId: 107,
      assignmentId: { $gte: 9001, $lte: 9003 }
    });

    console.log(`🔍 New assignments (9001-9003): ${newAssignments.length}\n`);

    if (newAssignments.length > 0) {
      console.log('✅ NEW ASSIGNMENTS EXIST:\n');
      newAssignments.forEach(assignment => {
        console.log(`   ${assignment.assignmentId}: ${assignment.taskName || 'UNNAMED'}`);
        if (assignment.dailyTarget) {
          console.log(`   Expected Output: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
        }
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllEmployee107Assignments();
