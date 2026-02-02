import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const testAttendanceTodayAPI = async () => {
  try {
    console.log('\n🧪 TESTING /worker/attendance/today API\n');

    const baseURL = 'http://localhost:5002/api';

    // 1. Login first
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // 2. Test the /worker/attendance/today endpoint
    console.log('\n2. Testing /worker/attendance/today...');
    
    try {
      const todayResponse = await axios.get(
        `${baseURL}/worker/attendance/today`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ /worker/attendance/today successful!');
      console.log('Response:', JSON.stringify(todayResponse.data, null, 2));

    } catch (todayError) {
      if (todayError.response) {
        console.log('❌ /worker/attendance/today failed:');
        console.log('Status:', todayError.response.status);
        console.log('Data:', JSON.stringify(todayError.response.data, null, 2));
      } else {
        console.log('❌ Request failed:', todayError.message);
      }
    }

    // 3. Test alternative endpoints
    console.log('\n3. Testing alternative attendance endpoints...');
    
    const alternativeEndpoints = [
      '/worker/attendance/status',
      '/attendance/status',
      '/attendance/today'
    ];

    for (const endpoint of alternativeEndpoints) {
      console.log(`\n   Testing ${endpoint}...`);
      
      try {
        const response = await axios.get(
          `${baseURL}${endpoint}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`   ✅ ${endpoint} successful!`);
        console.log('   Response:', JSON.stringify(response.data, null, 2));

      } catch (error) {
        if (error.response) {
          console.log(`   ❌ ${endpoint} failed: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
        } else {
          console.log(`   ❌ ${endpoint} request failed: ${error.message}`);
        }
      }
    }

    // 4. Check what routes are actually available
    console.log('\n4. 🔍 DIAGNOSIS:');
    console.log('   The mobile app is calling /worker/attendance/today');
    console.log('   But this endpoint might not exist in the backend.');
    console.log('   ');
    console.log('   Available endpoints based on our tests:');
    console.log('   - /worker/attendance/status (if it worked)');
    console.log('   - /attendance/status (if it worked)');
    console.log('   ');
    console.log('   The mobile app needs to use the correct endpoint');
    console.log('   or the backend needs to implement /worker/attendance/today');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// Check if server is running first
const checkServer = async () => {
  try {
    const response = await axios.get('http://localhost:5002/api/health', { timeout: 5000 });
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the backend server first.');
    return false;
  }
};

const runTest = async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testAttendanceTodayAPI();
  }
};

runTest();