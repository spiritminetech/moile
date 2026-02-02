// test-worker-attendance-simple.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5002/api';

async function testWorkerAttendanceSimple() {
  try {
    console.log('🔐 Step 1: Login to get token...');
    
    // Login first
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'worker@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');

    // Test validate location endpoint
    console.log('\n📍 Step 2: Testing validate-location endpoint...');
    
    const validateResponse = await axios.post(`${API_BASE_URL}/worker/attendance/validate-location`, {
      projectId: 1,
      latitude: 1.3521,
      longitude: 103.8198,
      accuracy: 10
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Validate location successful:', validateResponse.data);

    // Test status endpoint
    console.log('\n📊 Step 3: Testing status endpoint...');
    
    const statusResponse = await axios.get(`${API_BASE_URL}/worker/attendance/status?projectId=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Status check successful:', statusResponse.data);

    // Test clock-in endpoint
    console.log('\n⏰ Step 4: Testing clock-in endpoint...');
    
    try {
      const clockInResponse = await axios.post(`${API_BASE_URL}/worker/attendance/clock-in`, {
        projectId: 1,
        latitude: 1.3521,
        longitude: 103.8198,
        accuracy: 10
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Clock-in successful:', clockInResponse.data);
    } catch (error) {
      console.log('ℹ️ Clock-in result:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Basic worker attendance API test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testWorkerAttendanceSimple();