// Check for multiple active tasks issue
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Import models
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));

async function checkMultipleActiveTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Find the worker user
    const workerUser = await User.findOne({ email: 'worker@gmail.com' });
    if (!workerUser) {
      console.log('❌ Worker user not found');
      return;
    }

    console.log('👤 Worker User:', {
      userId: workerUser.id,
      email: workerUser.email,
      employeeId: workerUser.employeeId
    });
    console.log('');

    // Find employee
    const employee = await Employee.findOne({ id: workerUser.employeeId });
    if (!employee) {
      console.log('❌ Employee not found');
      return;
    }

    console.log('👷 Employee:', {
      employeeId: employee.id,
      name: employee.name
    });
    console.log('');

    // Find ALL tasks for this employee
    const allTasks = await WorkerTaskAssignment.find({ 
      employeeId: employee.id 
    }).sort({ date: -1, sequence: 1 });

    console.log('📋 ALL TASKS FOR THIS EMPLOYEE:');
    console.log('='.repeat(80));
    allTasks.forEach((task, index) => {
      console.log(`\nTask ${index + 1}:`);
      console.log(`  Assignment ID: ${task.id}`);
      console.log(`  Task Name: ${task.taskName}`);
      console.log(`  Status: ${task.status}`);
      console.log(`  Date: ${task.date}`);
      console.log(`  Start Time: ${task.startTime || 'Not started'}`);
      console.log(`  End Time: ${task.endTime || 'Not ended'}`);
      console.log(`  Sequence: ${task.sequence}`);
    });
    console.log('='.repeat(80));
    console.log('');

    // Find tasks with "in_progress" status
    const activeTasks = allTasks.filter(t => t.status === 'in_progress');

    console.log('🔴 ACTIVE TASKS (status = "in_progress"):');
    console.log('='.repeat(80));
    if (activeTasks.length === 0) {
      console.log('✅ No active tasks found');
    } else if (activeTasks.length === 1) {
      console.log('✅ Exactly ONE active task (correct):');
      console.log(`  Assignment ID: ${activeTasks[0].id}`);
      console.log(`  Task Name: ${activeTasks[0].taskName}`);
      console.log(`  Started: ${activeTasks[0].startTime}`);
    } else {
      console.log(`❌ PROBLEM: ${activeTasks.length} ACTIVE TASKS FOUND!`);
      console.log('');
      activeTasks.forEach((task, index) => {
        console.log(`Active Task ${index + 1}:`);
        console.log(`  Assignment ID: ${task.id}`);
        console.log(`  Task Name: ${task.taskName}`);
        console.log(`  Started: ${task.startTime}`);
        console.log(`  Status: ${task.status}`);
      });
      console.log('');
      console.log('⚠️ THIS IS THE BUG - Only ONE task should be active at a time!');
    }
    console.log('='.repeat(80));
    console.log('');

    // Check for paused tasks
    const pausedTasks = allTasks.filter(t => t.status === 'paused');
    console.log('⏸️ PAUSED TASKS:');
    console.log('='.repeat(80));
    if (pausedTasks.length === 0) {
      console.log('No paused tasks');
    } else {
      pausedTasks.forEach((task, index) => {
        console.log(`Paused Task ${index + 1}:`);
        console.log(`  Assignment ID: ${task.id}`);
        console.log(`  Task Name: ${task.taskName}`);
        console.log(`  Paused At: ${task.pauseTime || 'Unknown'}`);
      });
    }
    console.log('='.repeat(80));
    console.log('');

    // Summary
    console.log('📊 SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Total Tasks: ${allTasks.length}`);
    console.log(`Active (in_progress): ${activeTasks.length}`);
    console.log(`Paused: ${pausedTasks.length}`);
    console.log(`Pending: ${allTasks.filter(t => t.status === 'pending').length}`);
    console.log(`Completed: ${allTasks.filter(t => t.status === 'completed').length}`);
    console.log('='.repeat(80));
    console.log('');

    if (activeTasks.length > 1) {
      console.log('🔧 RECOMMENDED FIX:');
      console.log('='.repeat(80));
      console.log('1. Decide which task should remain active');
      console.log('2. Set other active tasks to "paused" status');
      console.log('3. Or complete the tasks that are actually finished');
      console.log('');
      console.log('Would you like me to:');
      console.log('  A) Pause all but the most recently started task?');
      console.log('  B) Pause all active tasks (reset to clean state)?');
      console.log('  C) Show more details to decide manually?');
      console.log('='.repeat(80));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkMultipleActiveTasks();
