import axios from 'axios';

const BASE_URL = 'http://192.168.1.8:5002';

async function simpleLunchTest() {
  console.log('🧪 Simple Lunch Test');
  console.log('===================');

  try {
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'worker1@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    const projectId = loginResponse.data.user.currentProject?.id || 1;

    console.log(`Using project ID: ${projectId}`);

    // Check status
    const statusResponse = await axios.get(`${BASE_URL}/api/worker/attendance/status?projectId=${projectId}`, { headers });
    console.log('Current status:', statusResponse.data.status);
    console.log('Is on lunch:', statusResponse.data.isOnLunchBreak);

    // If not clocked in, clock in first
    if (statusResponse.data.status === 'NOT_CLOCKED_IN') {
      console.log('Clocking in...');
      await axios.post(`${BASE_URL}/api/worker/attendance/clock-in`, {
        projectId: projectId,
        latitude: 12.9716,
        longitude: 77.5946
      }, { headers });
      console.log('Clocked in successfully');
    }

    // Try lunch start
    console.log('Starting lunch...');
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

simpleLunchTest();