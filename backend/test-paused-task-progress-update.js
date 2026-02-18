import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function testPausedTaskProgressUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all tasks for employee 107
    const allTasks = await WorkerTaskAssignment.find({ employeeId: 107 })
      .select('id taskName status progressPercent')
      .sort({ id: 1 });

    console.log('📋 ALL TASKS FOR EMPLOYEE 107:');
    console.log('================================');
    allTasks.forEach(task => {
      const statusEmoji = task.status === 'in_progress' ? '🟢' : 
                         task.status === 'paused' ? '🟠' : 
                         task.status === 'completed' ? '✅' : '🔵';
      console.log(`${statusEmoji} Task ${task.id}: ${task.taskName}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Progress: ${task.progressPercent || 0}%\n`);
    });

    // Find paused task 7037
    const pausedTask = await WorkerTaskAssignment.findOne({ id: 7037 });
    
    if (!pausedTask) {
      console.log('❌ Task 7037 not found');
      return;
    }

    console.log('\n🎯 TESTING SCENARIO:');
    console.log('===================');
    console.log(`Task 7037 current status: ${pausedTask.status}`);
    console.log(`Task 7037 current progress: ${pausedTask.progressPercent || 0}%`);
    
    // Check if there's an active task
    const activeTask = await WorkerTaskAssignment.findOne({
      employeeId: 107,
      status: 'in_progress'
    });

    if (activeTask) {
      console.log(`\n⚠️  Currently active task: ${activeTask.id} (${activeTask.taskName})`);
      console.log('   This task should be auto-paused when updating progress on task 7037');
    } else {
      console.log('\n✅ No currently active tasks');
    }

    console.log('\n📝 EXPECTED BEHAVIOR:');
    console.log('====================');
    console.log('When you update progress on task 7037 (paused):');
    console.log('1. Task 7037 should change from "paused" to "in_progress"');
    if (activeTask) {
      console.log(`2. Task ${activeTask.id} should change from "in_progress" to "paused"`);
    }
    console.log('3. Only ONE task should have status "in_progress"');
    console.log('4. API response should show taskStatus: "in_progress"');

    console.log('\n🧪 TEST THIS:');
    console.log('=============');
    console.log('1. Update progress on task 7037 using the mobile app');
    console.log('2. Check the API response - taskStatus should be "in_progress"');
    console.log('3. Run this script again to verify the database state');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testPausedTaskProgressUpdate();
