import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function debugDateIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all assignments for employee 2
    const allAssignments = await WorkerTaskAssignment.find({ employeeId: 2 })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log(`📊 Found ${allAssignments.length} assignments for Employee 2:\n`);

    allAssignments.forEach((task, index) => {
      console.log(`${index + 1}. ${task.taskName || 'Unnamed'}`);
      console.log(`   Assignment ID: ${task.id}`);
      console.log(`   Task ID: ${task.taskId}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Date field: ${task.date}`);
      console.log(`   Date type: ${typeof task.date}`);
      console.log(`   Created: ${task.createdAt}`);
      console.log('');
    });

    // Check the most recent 5 assignments (IDs 7034-7038)
    console.log('=' .repeat(70));
    console.log('🔍 Checking specific assignment IDs 7034-7038:\n');

    for (let id = 7034; id <= 7038; id++) {
      const assignment = await WorkerTaskAssignment.findOne({ id }).lean();
      if (assignment) {
        console.log(`✅ Assignment ${id}: ${assignment.taskName}`);
        console.log(`   Date: ${assignment.date}`);
        console.log(`   Status: ${assignment.status}`);
        console.log(`   Employee: ${assignment.employeeId}`);
      } else {
        console.log(`❌ Assignment ${id}: Not found`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

debugDateIssue();
