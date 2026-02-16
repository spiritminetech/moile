import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function checkTasksStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check all 5 tasks for employee 2 on 2026-02-15
    const today = '2026-02-15';
    const todayStart = new Date(today + 'T00:00:00.000Z');
    const todayEnd = new Date(today + 'T23:59:59.999Z');

    console.log('📅 Checking tasks for: 2026-02-15');
    console.log('👤 Employee: 2 (Ravi Smith / worker@gmail.com)');
    console.log('=' .repeat(70) + '\n');

    const assignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: { $gte: todayStart, $lte: todayEnd }
    })
    .sort({ id: 1 })
    .lean();

    console.log(`📊 Found ${assignments.length} task assignments:\n`);

    if (assignments.length === 0) {
      console.log('⚠️  No tasks found for today!');
    } else {
      assignments.forEach((task, index) => {
        console.log(`${index + 1}. ${task.taskName || 'Unnamed Task'}`);
        console.log(`   Assignment ID: ${task.id}`);
        console.log(`   Task ID: ${task.taskId}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Project ID: ${task.projectId}`);
        console.log(`   Supervisor ID: ${task.supervisorId}`);
        if (task.startTime) {
          console.log(`   ⏰ Started: ${new Date(task.startTime).toLocaleString()}`);
        }
        if (task.endTime) {
          console.log(`   ✅ Completed: ${new Date(task.endTime).toLocaleString()}`);
        }
        console.log('');
      });

      // Summary
      const statusCounts = assignments.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});

      console.log('=' .repeat(70));
      console.log('📈 Status Summary:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

checkTasksStatus();
