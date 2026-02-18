import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function fixEmployee2TodayTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-02-16

    console.log(`📅 Today's date: ${todayStr}\n`);

    // Find tasks for employee 2 today
    const todayTasks = await WorkerTaskAssignment.find({ 
      employeeId: 2,
      date: todayStr
    }).sort({ id: 1 });

    console.log(`📋 TASKS FOR EMPLOYEE 2 TODAY: ${todayTasks.length}`);
    console.log('==========================================');
    todayTasks.forEach(task => {
      const statusEmoji = task.status === 'in_progress' ? '🟢' : 
                         task.status === 'paused' ? '🟠' : 
                         task.status === 'completed' ? '✅' : '🔵';
      console.log(`${statusEmoji} Task ${task.id}: ${task.taskName || 'Unnamed'}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   ProjectId: ${task.projectId}`);
      console.log(`   TaskId: ${task.taskId || 'NULL ⚠️'}`);
      console.log(`   Date: ${task.date}\n`);
    });

    // Find tasks with null taskId
    const invalidTasks = todayTasks.filter(task => !task.taskId);
    
    if (invalidTasks.length > 0) {
      console.log(`\n⚠️  FOUND ${invalidTasks.length} TASKS WITH NULL TASKID:`);
      invalidTasks.forEach(task => {
        console.log(`   ❌ Task ${task.id}: ProjectId ${task.projectId}, TaskId: ${task.taskId}`);
      });

      console.log('\n🔧 FIXING STRATEGY:');
      console.log('==========================================');
      console.log('Option 1: Delete tasks with null taskId (RECOMMENDED)');
      console.log('Option 2: Keep only Task 7059 (has valid taskId 84408)');
      console.log('Option 3: Delete ALL today tasks and recreate with proper data\n');

      console.log('💡 EXECUTING: Delete tasks with null taskId\n');

      // Delete tasks with null taskId
      for (const task of invalidTasks) {
        await WorkerTaskAssignment.deleteOne({ id: task.id });
        console.log(`   ✅ Deleted Task ${task.id} (ProjectId: ${task.projectId}, TaskId: null)`);
      }

      console.log('\n✅ CLEANUP COMPLETE!\n');
    } else {
      console.log('\n✅ All tasks have valid taskId. No cleanup needed.\n');
    }

    // Verify remaining tasks
    const remainingTasks = await WorkerTaskAssignment.find({ 
      employeeId: 2,
      date: todayStr
    }).sort({ id: 1 });

    console.log(`📋 REMAINING TASKS FOR TODAY: ${remainingTasks.length}`);
    console.log('==========================================');
    remainingTasks.forEach(task => {
      const statusEmoji = task.status === 'in_progress' ? '🟢' : 
                         task.status === 'paused' ? '🟠' : 
                         task.status === 'completed' ? '✅' : '🔵';
      console.log(`${statusEmoji} Task ${task.id}: ${task.taskName || 'Unnamed'}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   ProjectId: ${task.projectId}`);
      console.log(`   TaskId: ${task.taskId}`);
      console.log(`   Date: ${task.date}\n`);
    });

    if (remainingTasks.length === 0) {
      console.log('⚠️  NO TASKS REMAINING FOR TODAY!');
      console.log('💡 Run add-two-tasks-employee-2.js to create new tasks.\n');
    } else {
      console.log('✅ Employee 2 now has clean task assignments for today.');
      console.log('🔄 Restart the backend and try clock-in again.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

fixEmployee2TodayTasks();
