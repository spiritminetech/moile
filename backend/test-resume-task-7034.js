import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5002/api';
const MONGODB_URI = process.env.MONGODB_URI;

async function testResumeTask7034() {
  try {
    console.log('🔍 Testing Resume Task 7034...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('workerTaskAssignment');

    // Check current state
    console.log('1️⃣ Checking current task statuses...\n');
    
    const task7034 = await collection.findOne({ id: 7034 });
    const task7037 = await collection.findOne({ id: 7037 });
    const task7040 = await collection.findOne({ id: 7040 });

    console.log(`  Task 7034: ${task7034.status}`);
    console.log(`  Task 7037: ${task7037.status}`);
    console.log(`  Task 7040: ${task7040.status}\n`);

    if (task7034.status !== 'paused') {
      console.log(`⚠️  Task 7034 is not paused (status: ${task7034.status})`);
      await mongoose.disconnect();
      return;
    }

    if (task7040.status !== 'in_progress') {
      console.log(`⚠️  Task 7040 is not in_progress (status: ${task7040.status})`);
      await mongoose.disconnect();
      return;
    }

    console.log('📝 Test Plan:');
    console.log('  - Resume: Task 7034 (currently paused)');
    console.log('  - Should auto-pause: Task 7040 (currently in_progress)\n');

    // Login
    console.log('2️⃣ Logging in as worker@gmail.com...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Resume task 7034
    console.log('3️⃣ Resuming task 7034...');
    
    try {
      const resumeResponse = await axios.post(
        `${API_BASE_URL}/worker/tasks/7034/resume`,
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
      console.error(`   ${apiError.response?.data?.message || apiError.message}`);
      console.error(`   Error: ${apiError.response?.data?.error || ''}\n`);
      await mongoose.disconnect();
      return;
    }

    // Wait for DB to update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check database after resume
    console.log('4️⃣ Checking database after resume...\n');
    
    const task7034After = await collection.findOne({ id: 7034 });
    const task7040After = await collection.findOne({ id: 7040 });

    console.log('📊 Results:');
    console.log(`  Task 7034: ${task7034After.status} (was paused)`);
    console.log(`  Task 7040: ${task7040After.status} (was in_progress)\n`);

    // Count active tasks
    const activeTasks = await collection.find({
      employeeId: 2,
      status: 'in_progress'
    }).toArray();

    console.log('5️⃣ Verification:');
    console.log(`  Active tasks: ${activeTasks.length}\n`);

    if (activeTasks.length === 1 && activeTasks[0].id === 7034) {
      console.log('✅ SUCCESS: Auto-pause logic is working!');
      console.log('  - Task 7034 is now in_progress');
      console.log('  - Task 7040 was auto-paused');
      console.log('  - Only ONE task is active\n');
    } else if (activeTasks.length > 1) {
      console.log('❌ FAILURE: Multiple tasks are still active!');
      activeTasks.forEach(task => {
        console.log(`  - Task ${task.id}: ${task.status}`);
      });
      console.log('');
    } else if (task7034After.status !== 'in_progress') {
      console.log('❌ FAILURE: Task 7034 is not in_progress!');
      console.log(`  - Task 7034 status: ${task7034After.status}\n`);
    }

    console.log('='.repeat(70));
    console.log('\n📱 MOBILE APP INSTRUCTIONS:');
    console.log('  1. Close the mobile app completely');
    console.log('  2. Reopen the app and login');
    console.log('  3. Navigate to Today\'s Tasks');
    console.log('  4. You should see:');
    console.log('     - Task 7034: "Continue Working" button (green)');
    console.log('     - Task 7040: "Resume Task" button (orange)');
    console.log('     - Only ONE green "Continue Working" button');

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

testResumeTask7034();
