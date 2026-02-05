import axios from 'axios';

const BASE_URL = 'http://192.168.1.8:5002';

async function testLunchEnd() {
  console.log('🧪 Testing Lunch End');
  console.log('===================');

  try {
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'worker1@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    const projectId = 1;

    console.log(`Using project ID: ${projectId}`);

    // Check current status
    const statusResponse = await axios.get(`${BASE_URL}/api/worker/attendance/status?projectId=${projectId}`, { headers });
    console.log('Current status:', statusResponse.data.status);
    console.log('Is on lunch:', statusResponse.data.isOnLunchBreak);

    if (statusResponse.data.isOnLunchBreak) {
      // End lunch break
      console.log('Ending lunch break...');
      const lunchEndResponse = await axios.post(`${BASE_URL}/api/worker/attendance/lunch-end`, {
        projectId: projectId,
        latitude: 12.9716,
        longitude: 77.5946
      }, { headers });

      console.log('✅ Lunch ended successfully!');
      console.log('Response:', lunchEndResponse.data);

      // Check status after ending lunch
      const finalStatusResponse = await axios.get(`${BASE_URL}/api/worker/attendance/status?projectId=${projectId}`, { headers });
      console.log('\nFinal status:', finalStatusResponse.data.status);
      console.log('Is on lunch:', finalStatusResponse.data.isOnLunchBreak);
    } else {
      console.log('Not currently on lunch break');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLunchEnd();