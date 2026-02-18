// Script to enforce "Only ONE task can be active at a time" rule
// Fixes any violations in the database

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function enforceSingleActiveTask() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const employeeId = 2; // Ravi Smith
    const date = '2026-02-15';

    console.log('\n' + '='.repeat(80));
    console.log('🔍 Enforcing: Only ONE task can be active at a time');
    console.log('   Employee ID:', employeeId);
    console.log('   Date:', date);
    console.log('='.repeat(80));

    // Get all assignments for this employee and date
    const assignments = await WorkerTaskAssignment.find({
      employeeId: employeeId,
      date: date
    }).sort({ startTime: -1, sequence: 1 }); // Sort by most recent start time first

    console.log('\n📋 Found', assignments.length, 'total assignments');

    // Find all tasks with "active" statuses (in_progress or paused)
    const activeTasks = assignments.filter(a => 
      a.status === 'in_progress' || a.status === 'paused'
    );

    console.log('\n⚠️  Active tasks found:', activeTasks.length);
    
    if (activeTasks.length === 0) {
      console.log('✅ No active tasks - nothing to fix');
      await mongoose.disconnect();
      return;
    }

    if (activeTasks.length === 1) {
      console.log('✅ Only one active task - system is correct');
      const task = activeTasks[0];
      console.log(`   Assignment ID: ${task.id}`);
      console.log(`   Task Name: ${task.taskName || 'N/A'}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Started: ${task.startTime || 'N/A'}`);
      await mongoose.disconnect();
      return;
    }

    // VIOLATION FOUND: Multiple active tasks
    console.log('\n❌ VIOLATION: Multiple tasks are active!');
    console.log('   This violates the "Only ONE task can be active at a time" rule');
    
    console.log('\n📝 Active tasks:');
    activeTasks.forEach((task, index) => {
      console.log(`\n   ${index + 1}. Assignment ID: ${task.id}`);
      console.log(`      Task Name: ${task.taskName || 'N/A'}`);
      console.log(`      Status: ${task.status}`);
      console.log(`      Started: ${task.startTime || 'N/A'}`);
      console.log(`      Progress: ${task.progressPercent || 0}%`);
      console.log(`      Sequence: ${task.sequence || 'N/A'}`);
    });

    // Strategy: Keep the most recently started task, reset others to queued
    console.log('\n🔧 Applying fix:');
    console.log('   Strategy: Keep most recently started task, reset others to queued');

    // Sort by start time (most recent first)
    const sortedActiveTasks = [...activeTasks].sort((a, b) => {
      const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return timeB - timeA;
    });

    const taskToKeep = sortedActiveTasks[0];
    const tasksToReset = sortedActiveTasks.slice(1);

    console.log(`\n   ✅ Keeping active: Assignment ${taskToKeep.id} - ${taskToKeep.taskName || 'N/A'}`);
    console.log(`      Status: ${taskToKeep.status}`);
    console.log(`      Started: ${taskToKeep.startTime}`);

    console.log(`\n   🔄 Resetting to queued: ${tasksToReset.length} task(s)`);

    // Reset the other tasks
    for (const task of tasksToReset) {
      console.log(`\n      Resetting Assignment ${task.id}...`);
      console.log(`      Previous status: ${task.status}`);
      console.log(`      Previous start time: ${task.startTime || 'N/A'}`);
      
      await WorkerTaskAssignment.updateOne(
        { id: task.id },
        {
          $set: {
            status: 'queued',
            startTime: null,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`      ✅ Reset to queued`);
    }

    // Verify the fix
    console.log('\n' + '='.repeat(80));
    console.log('🔍 Verification - Checking current state:');
    console.log('='.repeat(80));

    const updatedAssignments = await WorkerTaskAssignment.find({
      employeeId: employeeId,
      date: date
    }).sort({ sequence: 1 });

    const updatedActiveTasks = updatedAssignments.filter(a => 
      a.status === 'in_progress' || a.status === 'paused'
    );

    console.log('\n📊 Updated counts:');
    console.log('   Total assignments:', updatedAssignments.length);
    console.log('   Active tasks (in_progress + paused):', updatedActiveTasks.length);
    console.log('   Queued tasks:', updatedAssignments.filter(a => a.status === 'queued').length);
    console.log('   Completed tasks:', updatedAssignments.filter(a => a.status === 'completed').length);

    if (updatedActiveTasks.length === 1) {
      console.log('\n✅ SUCCESS! Only one task is now active');
      console.log(`   Active task: Assignment ${updatedActiveTasks[0].id} - ${updatedActiveTasks[0].taskName || 'N/A'}`);
      console.log(`   Status: ${updatedActiveTasks[0].status}`);
    } else if (updatedActiveTasks.length === 0) {
      console.log('\n✅ SUCCESS! No active tasks (all queued or completed)');
    } else {
      console.log('\n⚠️  WARNING: Still have multiple active tasks!');
      console.log('   This should not happen - manual investigation required');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Script completed');
    console.log('='.repeat(80));

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

enforceSingleActiveTask();
