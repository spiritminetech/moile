import axios from 'axios';

const BASE_URL = 'http://localhost:5002';

async function debugAttendanceEndpoint() {
  console.log('🔍 Debugging Attendance Endpoint');
  console.log('================================');

  try {
    // Step 1: Login
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'worker1@gmail.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful');
    console.log(`   Employee ID: ${loginResponse.data.employee.id}`);

    // Step 2: Test different attendance endpoints
    console.log('\n2️⃣ Testing attendance endpoints...');
    
    const projectId = 1014;
    const latitude = 12.9716;
    const longitude = 77.5946;

    // Test 1: Check if attendance endpoint exists
    console.log('\n   Testing /api/attendance/checkin...');
    try {
      const response1 = await axios.post(`${BASE_URL}/api/attendance/checkin`, {
        projectId: projectId,
        latitude: latitude,
        longitude: longitude,
        session: 'checkin'
      }, { headers });
      
      console.log('✅ /api/attendance/checkin responded:', response1.data);
    } catch (error1) {
      console.log('❌ /api/attendance/checkin failed:');
      console.log(`   Status: ${error1.response?.status}`);
      console.log(`   Message: ${error1.response?.data?.message || error1.message}`);
      console.log(`   Full response:`, error1.response?.data);
    }

    // Test 2: Try worker attendance endpoint
    console.log('\n   Testing /api/worker/attendance/checkin...');
    try {
      const response2 = await axios.post(`${BASE_URL}/api/worker/attendance/checkin`, {
        projectId: projectId,
        latitude: latitude,
        longitude: longitude,
        session: 'checkin'
      }, { headers });
      
      console.log('✅ /api/worker/attendance/checkin responded:', response2.data);
    } catch (error2) {
      console.log('❌ /api/worker/attendance/checkin failed:');
      console.log(`   Status: ${error2.response?.status}`);
      console.log(`   Message: ${error2.response?.data?.message || error2.message}`);
      console.log(`   Full response:`, error2.response?.data);
    }

    // Test 3: Check attendance status first
    console.log('\n   Testing /api/worker/attendance/status...');
    try {
      const response3 = await axios.get(`${BASE_URL}/api/worker/attendance/status?projectId=${projectId}`, { headers });
      
      console.log('✅ /api/worker/attendance/status responded:', response3.data);
    } catch (error3) {
      console.log('❌ /api/worker/attendance/status failed:');
      console.log(`   Status: ${error3.response?.status}`);
      console.log(`   Message: ${error3.response?.data?.message || error3.message}`);
    }

    // Test 4: Try without session parameter
    console.log('\n   Testing /api/worker/attendance/checkin without session...');
    try {
      const response4 = await axios.post(`${BASE_URL}/api/worker/attendance/checkin`, {
        projectId: projectId,
        latitude: latitude,
        longitude: longitude
      }, { headers });
      
      console.log('✅ /api/worker/attendance/checkin (no session) responded:', response4.data);
    } catch (error4) {
      console.log('❌ /api/worker/attendance/checkin (no session) failed:');
      console.log(`   Status: ${error4.response?.status}`);
      console.log(`   Message: ${error4.response?.data?.message || error4.message}`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAttendanceEndpoint();