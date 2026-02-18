import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5002/api';
const MONGODB_URI = process.env.MONGODB_URI;

async function testResumeWithNumericIds() {
  try {
    console.log('🔍 Testing Resume Task with Numeric IDs...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workerTaskAssignment' }));

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Date: ${today}\n`);

    // Find tasks with numeric IDs for employee 2
    const tasks = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: today,
      id: { $type: 'number' } // Only numeric IDs
    }).sort({ id: 1 });

    console.log(`Found ${tasks.length} tasks with numeric IDs:\n`);
    
    tasks.forEach(task => {
      console.log(`  Task ${task.id}: ${task.taskName || 'Unnamed'} - ${task.status}`);
    });

    const pausedTasks = tasks.filter(t => t.status === 'paused');
    const activeTasks = tasks.filter(t => t.status === 'in_progress');

    console.log(`\n  Paused: ${pausedTasks.length}, Active: ${activeTasks.length}\n`);

    if (pausedTasks.length === 0) {
      console.log('⚠️  No paused tasks to test!');
      await mongoose.disconnect();
      return;
    }

    if (activeTasks.length === 0) {
      console.log('⚠️  No active tasks to test auto-pause!');
      await mongoose.disconnect();
      return;
    }

    const taskToResume = pausedTasks[0];
    const currentActiveTask = activeTasks[0];

    console.log('📝 Test Plan:');
    console.log(`  - Resume: Task ${taskToResume.id} (currently paused)`);
    console.log(`  - Should auto-pause: Task ${currentActiveTask.id} (currently active)\n`);

    // Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Resume the paused task
    console.log(`2️⃣ Resuming task ${taskToResume.id}...`);
    
    try {
      const resumeResponse = await axios.post(
        `${API_BASE_URL}/worker/tasks/${taskToResume.id}/resume`,
        {
          location: {
            latitude: 1.3521,
            longitude: 103.8198,
            accuracy: 10,
            timestamp: new Date().toISOString()
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('✅ Resume API call successful');
      console.log(`   Message: ${resumeResponse.data.message}\n`);
    } catch (apiError) {
      console.error('❌ Resume API call failed:');
      console.error(`   ${apiError.response?.data?.message || apiError.message}\n`);
      await mongoose.disconnect();
      return;
    }

    // Wait for DB to update
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check database after resume
    console.log('3️⃣ Checking database after resume...\n');
    
    const resumedTask = await WorkerTaskAssignment.findOne({ id: taskToResume.id });
    const previouslyActiveTask = await WorkerTaskAssignment.findOne({ id: currentActiveTask.id });

    console.log('📊 Results:');
    console.log(`  Task ${resumedTask.id}: ${resumedTask.status} (was paused)`);
    console.log(`  Task ${previouslyActiveTask.id}: ${previouslyActiveTask.status} (was in_progress)\n`);

    // Verify
    const allTasksAfter = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: today,
      id: { $type: 'number' }
    });

    const pausedAfter = allTasksAfter.filter(t => t.status === 'paused');
    const activeAfter = allTasksAfter.filter(t => t.status === 'in_progress');

    console.log('4️⃣ Verification:');
    console.log(`  Paused tasks: ${pausedAfter.length}`);
    console.log(`  Active tasks: ${activeAfter.length}\n`);

    if (activeAfter.length === 1 && activeAfter[0].id === taskToResume.id) {
      console.log('✅ SUCCESS: Auto-pause logic is working!');
      console.log(`  - Task ${taskToResume.id} is now in_progress`);
      console.log(`  - Task ${currentActiveTask.id} was auto-paused`);
      console.log(`  - Only ONE task is active\n`);
    } else if (activeAfter.length > 1) {
      console.log('❌ FAILURE: Multiple tasks are still active!');
      activeAfter.forEach(task => {
        console.log(`  - Task ${task.id}: ${task.taskName}`);
      });
      console.log('');
    } else if (resumedTask.status !== 'in_progress') {
      console.log('❌ FAILURE: Resumed task is not in_progress!');
      console.log(`  - Task ${taskToResume.id} status: ${resumedTask.status}\n`);
    }

    console.log('='.repeat(70));
    console.log('\n📱 MOBILE APP: Close and reopen the app to see changes');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    await mongoose.disconnect();
  }
}

testResumeWithNumericIds();
