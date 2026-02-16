import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

const testWorkerTasksAPI = async () => {
  try {
    console.log('\n🔐 Testing Worker Tasks API...\n');

    // Step 1: Login
    console.log('Step 1: Logging in as worker@gmail.com...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.userId;
    console.log(`✅ Login successful - User ID: ${userId}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Step 2: Get today's tasks
    console.log('\nStep 2: Fetching today\'s tasks...');
    const tasksResponse = await axios.get(`${API_BASE_URL}/worker/tasks/today`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`\n📋 Tasks Response:`);
    console.log(`   Status: ${tasksResponse.status}`);
    console.log(`   Total Tasks: ${tasksResponse.data.length || 0}`);
    
    if (tasksResponse.data.length > 0) {
      console.log('\n   Task Details:');
      tasksResponse.data.forEach((task, index) => {
        console.log(`\n   Task ${index + 1}:`);
        console.log(`     ID: ${task.id || task.taskId}`);
        console.log(`     Name: ${task.taskName || task.name}`);
        console.log(`     Status: ${task.status}`);
        console.log(`     Priority: ${task.priority || 'N/A'}`);
        console.log(`     Assignment ID: ${task.assignmentId || 'N/A'}`);
      });
    } else {
      console.log('\n   ⚠️  No tasks returned from API');
    }

    // Step 3: Try alternative endpoint
    console.log('\n\nStep 3: Trying alternative tasks endpoint...');
    try {
      const altResponse = await axios.get(`${API_BASE_URL}/worker/task-assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`   Alternative endpoint status: ${altResponse.status}`);
      console.log(`   Tasks count: ${altResponse.data.length || 0}`);
    } catch (err) {
      console.log(`   Alternative endpoint not available: ${err.response?.status || err.message}`);
    }

  } catch (error) {
    console.error('\n❌ Error testing API:', error.response?.data || error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
};

testWorkerTasksAPI();
