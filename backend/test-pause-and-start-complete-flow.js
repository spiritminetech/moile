// Test the complete pause and start flow
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/constructionERP';

async function testPauseAndStartFlow() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the employee (worker.gmail@example.com)
    const employee = await Employee.findOne({ 
      email: 'worker.gmail@example.com' 
    });

    if (!employee) {
      console.log('❌ Employee not found');
      return;
    }

    console.log('\n📋 Employee found:');
    console.log('   ID:', employee.id);
    console.log('   Name:', employee.fullName);
    console.log('   Email:', employee.email);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Find all tasks for today
    const allTasks = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    }).sort({ sequence: 1 });

    console.log('\n📊 All tasks for today:', allTasks.length);
    allTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.taskName} (ID: ${task.id}, Status: ${task.status})`);
    });

    // Find the active task
    const activeTask = allTasks.find(t => t.status === 'in_progress');
    
    if (!activeTask) {
      console.log('\n❌ No active task found');
      console.log('   Please start a task first before testing pause and start');
      return;
    }

    console.log('\n🎯 Active task found:');
    console.log('   ID:', activeTask.id);
    console.log('   Name:', activeTask.taskName);
    console.log('   Status:', activeTask.status);

    // Find a pending task to start
    const pendingTask = allTasks.find(t => t.status === 'pending' && t.id !== activeTask.id);
    
    if (!pendingTask) {
      console.log('\n❌ No pending task found to start');
      return;
    }

    console.log('\n📝 Pending task to start:');
    console.log('   ID:', pendingTask.id);
    console.log('   Name:', pendingTask.taskName);
    console.log('   Status:', pendingTask.status);

    // STEP 1: Pause the active task
    console.log('\n' + '='.repeat(80));
    console.log('STEP 1: Pausing active task...');
    console.log('='.repeat(80));

    const previousStatus = activeTask.status;
    activeTask.status = 'queued';
    
    if (!activeTask.pauseHistory) {
      activeTask.pauseHistory = [];
    }
    activeTask.pauseHistory.push({
      pausedAt: new Date(),
      pausedBy: employee.id
    });

    await activeTask.save();

    console.log('✅ Task paused successfully');
    console.log('   Previous status:', previousStatus);
    console.log('   New status:', activeTask.status);

    // Verify the pause
    const pausedTask = await WorkerTaskAssignment.findOne({ id: activeTask.id });
    console.log('\n🔍 Verification after pause:');
    console.log('   Task ID:', pausedTask.id);
    console.log('   Status:', pausedTask.status);
    console.log('   Pause history:', pausedTask.pauseHistory?.length || 0, 'entries');

    // STEP 2: Check if any other task is in progress
    console.log('\n' + '='.repeat(80));
    console.log('STEP 2: Checking for other active tasks...');
    console.log('='.repeat(80));

    const otherActiveTask = await WorkerTaskAssignment.findOne({
      employeeId: employee.id,
      status: 'in_progress',
      id: { $ne: pendingTask.id }
    });

    if (otherActiveTask) {
      console.log('❌ Another task is still in progress:');
      console.log('   ID:', otherActiveTask.id);
      console.log('   Name:', otherActiveTask.taskName);
      console.log('   Status:', otherActiveTask.status);
      console.log('\n⚠️ This will prevent starting the new task!');
      return;
    } else {
      console.log('✅ No other tasks in progress');
    }

    // STEP 3: Start the pending task
    console.log('\n' + '='.repeat(80));
    console.log('STEP 3: Starting pending task...');
    console.log('='.repeat(80));

    // Check current status
    const taskToStart = await WorkerTaskAssignment.findOne({ id: pendingTask.id });
    console.log('   Current status:', taskToStart.status);

    if (taskToStart.status === 'in_progress') {
      console.log('❌ Task is already in progress');
      return;
    }

    if (taskToStart.status === 'completed') {
      console.log('❌ Task is already completed');
      return;
    }

    // Start the task
    const startTime = new Date();
    taskToStart.status = 'in_progress';
    taskToStart.startTime = startTime;

    await taskToStart.save();

    console.log('✅ Task started successfully');
    console.log('   New status:', taskToStart.status);
    console.log('   Start time:', startTime);

    // STEP 4: Final verification
    console.log('\n' + '='.repeat(80));
    console.log('STEP 4: Final verification');
    console.log('='.repeat(80));

    const finalTasks = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    }).sort({ sequence: 1 });

    console.log('\n📊 Final task statuses:');
    finalTasks.forEach((task, index) => {
      const icon = task.status === 'in_progress' ? '▶️' : 
                   task.status === 'queued' ? '⏸️' : 
                   task.status === 'completed' ? '✅' : '⏹️';
      console.log(`   ${icon} ${task.taskName}`);
      console.log(`      ID: ${task.id}, Status: ${task.status}`);
    });

    const inProgressCount = finalTasks.filter(t => t.status === 'in_progress').length;
    const queuedCount = finalTasks.filter(t => t.status === 'queued').length;

    console.log('\n📈 Summary:');
    console.log('   In Progress:', inProgressCount);
    console.log('   Queued (Paused):', queuedCount);
    console.log('   Pending:', finalTasks.filter(t => t.status === 'pending').length);
    console.log('   Completed:', finalTasks.filter(t => t.status === 'completed').length);

    if (inProgressCount === 1 && queuedCount === 1) {
      console.log('\n✅ SUCCESS: Pause and start flow completed correctly!');
      console.log('   - Previous task is paused (queued)');
      console.log('   - New task is in progress');
    } else {
      console.log('\n❌ ISSUE: Unexpected task statuses');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testPauseAndStartFlow();
