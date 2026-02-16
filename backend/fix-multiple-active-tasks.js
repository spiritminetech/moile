// Fix multiple active tasks issue
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

async function fixMultipleActiveTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the worker user
    const workerUser = await User.findOne({ email: 'worker@gmail.com' });
    if (!workerUser) {
      console.log('❌ Worker user not found');
      return;
    }

    const employee = await Employee.findOne({ id: workerUser.employeeId });
    if (!employee) {
      console.log('❌ Employee not found');
      return;
    }

    console.log('👤 Fixing tasks for Employee ID:', employee.id);
    console.log('');

    // Find all tasks with "in_progress" status
    const activeTasks = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      status: 'in_progress'
    }).sort({ startedAt: -1 }); // Most recently started first

    console.log('🔍 FOUND ACTIVE TASKS:');
    console.log('='.repeat(80));
    
    if (activeTasks.length === 0) {
      console.log('✅ No active tasks found - nothing to fix!');
      return;
    } else if (activeTasks.length === 1) {
      console.log('✅ Only ONE active task found - this is correct!');
      console.log(`   Task: ${activeTasks[0].taskName}`);
      console.log(`   Assignment ID: ${activeTasks[0].id}`);
      return;
    }

    console.log(`❌ PROBLEM: ${activeTasks.length} active tasks found!\n`);
    
    activeTasks.forEach((task, index) => {
      console.log(`Task ${index + 1}:`);
      console.log(`  Assignment ID: ${task.id}`);
      console.log(`  Task Name: ${task.taskName}`);
      console.log(`  Started At: ${task.startedAt}`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('');

    // Strategy: Keep the MOST RECENTLY started task active, pause the others
    const mostRecentTask = activeTasks[0]; // Already sorted by startedAt desc
    const tasksToPause = activeTasks.slice(1);

    console.log('🔧 FIX STRATEGY:');
    console.log('='.repeat(80));
    console.log('✅ KEEP ACTIVE:');
    console.log(`   ${mostRecentTask.taskName} (Assignment ${mostRecentTask.id})`);
    console.log(`   Started: ${mostRecentTask.startedAt}`);
    console.log('');
    console.log('⏸️ PAUSE THESE:');
    tasksToPause.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.taskName} (Assignment ${task.id})`);
      console.log(`      Started: ${task.startedAt}`);
    });
    console.log('='.repeat(80));
    console.log('');

    // Pause the older tasks
    const now = new Date();
    for (const task of tasksToPause) {
      console.log(`⏸️ Pausing: ${task.taskName} (Assignment ${task.id})`);
      
      await WorkerTaskAssignment.updateOne(
        { id: task.id },
        {
          $set: {
            status: 'paused',
            pauseTime: now,
            updatedAt: now
          }
        }
      );
      
      console.log(`   ✅ Status changed to "paused"`);
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('✅ FIX COMPLETE!');
    console.log('='.repeat(80));
    console.log('');
    console.log('📊 RESULT:');
    console.log(`   Active Tasks: 1 (${mostRecentTask.taskName})`);
    console.log(`   Paused Tasks: ${tasksToPause.length}`);
    console.log('');
    console.log('🔄 NEXT STEPS:');
    console.log('   1. Refresh the mobile app');
    console.log('   2. You should now see only ONE "Continue Working" button');
    console.log('   3. The other task(s) will show "Resume Task" button');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

fixMultipleActiveTasks();
