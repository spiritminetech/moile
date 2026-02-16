// Script to remove duplicate "Continue Working" tasks
// Based on the log: GET /worker/tasks/today for Employee ID: 2, Date: 2026-02-15

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function removeContinueWorkingTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const employeeId = 2; // Ravi Smith
    const date = '2026-02-15';

    console.log('\n' + '='.repeat(80));
    console.log('🔍 Analyzing tasks for Employee ID:', employeeId);
    console.log('   Date:', date);
    console.log('='.repeat(80));

    // Get all assignments for this employee and date
    const assignments = await WorkerTaskAssignment.find({
      employeeId: employeeId,
      date: date
    }).sort({ sequence: 1 });

    console.log('\n📋 Found', assignments.length, 'total assignments');

    if (assignments.length === 0) {
      console.log('❌ No assignments found');
      await mongoose.disconnect();
      return;
    }

    // Group by status
    const byStatus = {
      queued: [],
      in_progress: [],
      paused: [],
      completed: [],
      cancelled: [],
      other: []
    };

    assignments.forEach(a => {
      const status = a.status || 'other';
      if (byStatus[status]) {
        byStatus[status].push(a);
      } else {
        byStatus.other.push(a);
      }
    });

    console.log('\n📊 Tasks by status:');
    console.log('   Queued:', byStatus.queued.length);
    console.log('   In Progress:', byStatus.in_progress.length);
    console.log('   Paused:', byStatus.paused.length);
    console.log('   Completed:', byStatus.completed.length);
    console.log('   Cancelled:', byStatus.cancelled.length);
    console.log('   Other:', byStatus.other.length);

    // The issue: Multiple "in_progress" tasks create duplicate "Continue Working" buttons
    if (byStatus.in_progress.length > 1) {
      console.log('\n⚠️  ISSUE FOUND: Multiple tasks in "in_progress" status!');
      console.log('   This causes duplicate "Continue Working" buttons in the mobile app');
      
      console.log('\n📝 In-progress tasks:');
      byStatus.in_progress.forEach((task, index) => {
        console.log(`   ${index + 1}. Assignment ID: ${task.id}`);
        console.log(`      Task ID: ${task.taskId}`);
        console.log(`      Task Name: ${task.taskName || 'N/A'}`);
        console.log(`      Sequence: ${task.sequence}`);
        console.log(`      Progress: ${task.progressPercent || 0}%`);
        console.log(`      Start Time: ${task.startTime || 'N/A'}`);
        console.log('');
      });

      // Strategy: Keep the most recently started task, reset others to queued
      const sortedByStartTime = [...byStatus.in_progress].sort((a, b) => {
        const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
        const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
        return timeB - timeA; // Most recent first
      });

      const taskToKeep = sortedByStartTime[0];
      const tasksToReset = sortedByStartTime.slice(1);

      console.log('\n✅ Solution:');
      console.log(`   Keep in progress: Assignment ${taskToKeep.id} - ${taskToKeep.taskName}`);
      console.log(`   Reset to queued: ${tasksToReset.length} task(s)`);

      // Reset the other tasks to queued
      for (const task of tasksToReset) {
        console.log(`\n   Resetting Assignment ${task.id}...`);
        
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
        
        console.log(`   ✅ Reset Assignment ${task.id} to queued`);
      }

      console.log('\n✅ Fixed! Only one task remains in "in_progress" status');
      
    } else if (byStatus.in_progress.length === 1) {
      console.log('\n✅ Good! Only one task in "in_progress" status');
      const task = byStatus.in_progress[0];
      console.log(`   Assignment ID: ${task.id}`);
      console.log(`   Task Name: ${task.taskName || 'N/A'}`);
      console.log(`   Progress: ${task.progressPercent || 0}%`);
      
    } else {
      console.log('\n✅ No tasks in "in_progress" status');
    }

    // Also check for paused tasks (these also show "Continue Working")
    if (byStatus.paused.length > 0) {
      console.log('\n📝 Paused tasks (also show "Continue Working"):');
      byStatus.paused.forEach((task, index) => {
        console.log(`   ${index + 1}. Assignment ID: ${task.id}`);
        console.log(`      Task Name: ${task.taskName || 'N/A'}`);
        console.log(`      Progress: ${task.progressPercent || 0}%`);
      });
    }

    // Verify the fix
    console.log('\n' + '='.repeat(80));
    console.log('🔍 Verification - Current state after fix:');
    console.log('='.repeat(80));

    const updatedAssignments = await WorkerTaskAssignment.find({
      employeeId: employeeId,
      date: date
    }).sort({ sequence: 1 });

    const updatedByStatus = {
      queued: 0,
      in_progress: 0,
      paused: 0,
      completed: 0,
      cancelled: 0
    };

    updatedAssignments.forEach(a => {
      const status = a.status || 'other';
      if (updatedByStatus[status] !== undefined) {
        updatedByStatus[status]++;
      }
    });

    console.log('\n📊 Updated task counts:');
    console.log('   Queued:', updatedByStatus.queued);
    console.log('   In Progress:', updatedByStatus.in_progress);
    console.log('   Paused:', updatedByStatus.paused);
    console.log('   Completed:', updatedByStatus.completed);
    console.log('   Cancelled:', updatedByStatus.cancelled);

    const continueWorkingCount = updatedByStatus.in_progress + updatedByStatus.paused;
    console.log('\n📱 Mobile app will show:');
    console.log(`   "Continue Working" buttons: ${continueWorkingCount}`);
    console.log(`   "Start Task" buttons: ${updatedByStatus.queued}`);

    if (continueWorkingCount <= 1) {
      console.log('\n✅ SUCCESS! No duplicate "Continue Working" buttons');
    } else {
      console.log('\n⚠️  WARNING: Still have multiple "Continue Working" buttons');
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

removeContinueWorkingTasks();
