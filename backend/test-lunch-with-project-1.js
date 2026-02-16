import axios from 'axios';

const BASE_URL = 'http://192.168.1.6:5002';

async function testLunchWithProject1() {
  console.log('🧪 Testing Lunch with Project 1');
  console.log('===============================');

  try {
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'worker1@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Use project ID 1 (which matches the attendance record)
    const projectId = 1;
    console.log(`Using project ID: ${projectId}`);

    // Check status
    const statusResponse = await axios.get(`${BASE_URL}/api/worker/attendance/status?projectId=${projectId}`, { headers });
    console.log('Current status:', statusResponse.data.status);
    console.log('Is on lunch:', statusResponse.data.isOnLunchBreak);

    // Try lunch start with project 1
    console.log('Starting lunch with project 1...');
    const lunchResponse = await axios.post(`${BASE_URL}/api/worker/attendance/lunch-start`, {
      projectId: projectId,
      latitude: 12.9716,
      longitude: 77.5946
    }, { headers });

    console.log('✅ Lunch started successfully!');
    console.log('Response:', lunchResponse.data);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLunchWithProject1();