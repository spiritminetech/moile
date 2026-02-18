import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignmentSchema = new mongoose.Schema({
  id: Number,
  employeeId: Number,
  status: String,
  taskName: String,
  startTime: Date,
  date: String
}, { collection: 'workerTaskAssignment' });

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

async function checkTaskStatuses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const today = new Date().toISOString().split('T')[0];
    console.log('\n📅 Checking tasks for date:', today);

    const tasks = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: today
    }).sort({ id: 1 });

    console.log('\n📋 TASK STATUS SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total tasks found: ${tasks.length}`);
    console.log('='.repeat(80));

    tasks.forEach(task => {
      console.log(`\nTask ID: ${task.id}`);
      console.log(`  Name: ${task.taskName}`);
      console.log(`  Status: ${task.status}`);
      console.log(`  Started: ${task.startTime ? 'Yes' : 'No'}`);
      if (task.startTime) {
        console.log(`  Start Time: ${task.startTime}`);
      }
    });

    // Count by status
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 STATUS BREAKDOWN');
    console.log('='.repeat(80));
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Check for multiple in_progress
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    if (inProgressTasks.length > 1) {
      console.log('\n⚠️  WARNING: Multiple tasks with in_progress status!');
      inProgressTasks.forEach(t => {
        console.log(`  - Task ${t.id}: ${t.taskName}`);
      });
    } else if (inProgressTasks.length === 1) {
      console.log('\n✅ Good: Only ONE task is in_progress');
      console.log(`  - Task ${inProgressTasks[0].id}: ${inProgressTasks[0].taskName}`);
    } else {
      console.log('\n✅ No tasks currently in_progress');
    }

    // Check for paused tasks
    const pausedTasks = tasks.filter(t => t.status === 'paused');
    if (pausedTasks.length > 0) {
      console.log('\n⏸️  PAUSED TASKS:');
      pausedTasks.forEach(t => {
        console.log(`  - Task ${t.id}: ${t.taskName}`);
      });
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkTaskStatuses();
