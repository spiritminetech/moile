import axios from 'axios';

const API_BASE_URL = 'http://localhost:5002/api';

async function testAPI() {
  try {
    console.log('🔍 Testing API with correct date format...\n');

    // Step 1: Login
    console.log('1️⃣ Logging in as worker@gmail.com...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });

    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.token || loginResponse.data.data?.token;
    if (!token) {
      console.log('❌ No token in response');
      return;
    }
    console.log('✅ Login successful\n');

    // Step 2: Get today's tasks
    console.log('2️⃣ Fetching today\'s tasks...');
    console.log('   URL: /api/worker/tasks/today');
    console.log('   Date: 2026-02-15 (today)\n');

    const tasksResponse = await axios.get(`${API_BASE_URL}/worker/tasks/today`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Response status:', tasksResponse.status);
    console.log('Response data:', JSON.stringify(tasksResponse.data, null, 2));

    if (tasksResponse.data.success) {
      const tasks = tasksResponse.data.data;
      console.log(`\n✅ Found ${tasks.length} tasks`);
      
      if (tasks.length > 0) {
        const task7035 = tasks.find(t => t.assignmentId === 7035);
        if (task7035) {
          console.log('\n✅ Assignment 7035 found!');
          console.log('\nDaily Job Target Data:');
          if (task7035.dailyTarget) {
            console.log('  targetType:', task7035.dailyTarget.targetType);
            console.log('  quantity:', task7035.dailyTarget.quantity);
            console.log('  unit:', task7035.dailyTarget.unit);
            console.log('  areaLevel:', task7035.dailyTarget.areaLevel);
            console.log('  startTime:', task7035.dailyTarget.startTime);
            console.log('  expectedFinish:', task7035.dailyTarget.expectedFinish);
            console.log('  progressToday:', task7035.dailyTarget.progressToday);
          } else {
            console.log('  ❌ No dailyTarget data');
          }
        } else {
          console.log('\n❌ Assignment 7035 not found in response');
        }
      }
    } else {
      console.log('❌ API returned error:', tasksResponse.data.message);
    }

  } catch (error) {
    if (error.response) {
      console.log('\n❌ API Error:');
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('\n❌ Error:', error.message);
    }
  }
}

testAPI();
