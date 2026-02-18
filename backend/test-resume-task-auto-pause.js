import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5002/api';
const MONGODB_URI = process.env.MONGODB_URI;

async function testResumeTaskAutoPause() {
  let mongoConnection;
  
  try {
    console.log('🔍 Testing Resume Task Auto-Pause Logic...\n');

    // Connect to MongoDB to check database directly
    console.log('📦 Connecting to MongoDB...');
    mongoConnection = await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workerTaskAssignment' }));

    // Step 1: Check current state
    console.log('1️⃣ Checking current task statuses...');
    
    const allTasks = await WorkerTaskAssignment.find({
      employeeId: 2 // worker@gmail.com has employeeId 2, not 107
    }).select('id taskName status startTime date').sort({ id: 1 });

    console.log('\n📊 Current Status:');
    allTasks.forEach(task => {
      const displayId = task.id || task._id.toString().slice(-4);
      console.log(`   Task ${displayId}: ${task.taskName || 'Unnamed'} - ${task.status}`);
    });

    const pausedTasks = allTasks.filter(t => t.status === 'paused' && t.id); // Only tasks with numeric IDs
    const activeTasks = allTasks.filter(t => t.status === 'in_progress' && t.id);

    console.log(`\n   Paused: ${pausedTasks.length}, Active: ${activeTasks.length}`);

    if (pausedTasks.length === 0) {
      console.log('\n⚠️  No paused tasks found to test resume!');
      return;
    }

    if (activeTasks.length === 0) {
      console.log('\n⚠️  No active tasks found to test auto-pause!');
      return;
    }

    const taskToResume = pausedTasks[0];
    const currentActiveTask = activeTasks[0];

    console.log(`\n📝 Test Plan:`);
    console.log(`   - Resume: Task ${taskToResume.id} (currently paused)`);
    console.log(`   - Should auto-pause: Task ${currentActiveTask.id} (currently active)`);

    // Step 2: Login
    console.log('\n2️⃣ Logging in as worker@gmail.com...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 3: Resume the paused task
    console.log(`\n3️⃣ Resuming task ${taskToResume.id}...`);
    
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
      console.log('Response:', resumeResponse.data.message);
    } catch (apiError) {
      console.error('❌ Resume API call failed:', apiError.response?.data || apiError.message);
      return;
    }

    // Step 4: Check database after resume
    console.log('\n4️⃣ Checking database after resume...');
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for DB to update

    const resumedTask = await WorkerTaskAssignment.findOne({ id: taskToResume.id });
    const previouslyActiveTask = await WorkerTaskAssignment.findOne({ id: currentActiveTask.id });

    console.log('\n📊 After Resume:');
    console.log(`   Task ${resumedTask.id}: ${resumedTask.status} (was paused)`);
    console.log(`   Task ${previouslyActiveTask.id}: ${previouslyActiveTask.status} (was in_progress)`);

    // Step 5: Verify results
    console.log('\n5️⃣ Verification:');
    
    const allTasksAfter = await WorkerTaskAssignment.find({
      employeeId: 2
    }).select('id taskName status').sort({ id: 1 });

    const pausedAfter = allTasksAfter.filter(t => t.status === 'paused');
    const activeAfter = allTasksAfter.filter(t => t.status === 'in_progress');

    console.log(`   Paused tasks: ${pausedAfter.length}`);
    console.log(`   Active tasks: ${activeAfter.length}`);

    if (activeAfter.length === 1 && activeAfter[0].id === taskToResume.id) {
      console.log('\n✅ SUCCESS: Auto-pause logic is working!');
      console.log(`   - Task ${taskToResume.id} is now in_progress`);
      console.log(`   - Task ${currentActiveTask.id} was auto-paused`);
      console.log(`   - Only ONE task is active`);
    } else if (activeAfter.length > 1) {
      console.log('\n❌ FAILURE: Multiple tasks are still active!');
      activeAfter.forEach(task => {
        console.log(`   - Task ${task.id}: ${task.taskName}`);
      });
    } else if (resumedTask.status !== 'in_progress') {
      console.log('\n❌ FAILURE: Resumed task is not in_progress!');
      console.log(`   - Task ${taskToResume.id} status: ${resumedTask.status}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📱 MOBILE APP TEST:');
    console.log('   1. Close and reopen the mobile app');
    console.log('   2. Navigate to Today\'s Tasks');
    console.log('   3. You should see:');
    console.log(`      - Task ${taskToResume.id}: "Continue Working" button (green)`);
    console.log(`      - Task ${currentActiveTask.id}: "Resume Task" button (orange)`);
    console.log('      - Only ONE green "Continue Working" button total');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  } finally {
    if (mongoConnection) {
      await mongoose.disconnect();
      console.log('\n✅ Disconnected from MongoDB');
    }
  }
}

testResumeTaskAutoPause();
