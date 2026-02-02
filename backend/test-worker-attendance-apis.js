// test-worker-attendance-apis.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImNvbXBhbnlJZCI6MSwidXNlcm5hbWUiOiJ3b3JrZXJAZ21haWwuY29tIiwiaWF0IjoxNzM4NTc5NTUxLCJleHAiOjE3Mzg2NjU5NTF9.Hs8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; // Replace with actual token

const PROJECT_ID = 1;
const TEST_LOCATION = {
  latitude: 1.3521,
  longitude: 103.8198,
  accuracy: 10
};

async function testWorkerAttendanceAPIs() {
  console.log('🧪 Testing Worker Attendance APIs...\n');

  try {
    // Test 1: Validate Location
    console.log('📍 Test 1: POST /worker/attendance/validate-location');
    try {
      const validateResponse = await axios.post(`${API_BASE_URL}/worker/attendance/validate-location`, {
        projectId: PROJECT_ID,
        latitude: TEST_LOCATION.latitude,
        longitude: TEST_LOCATION.longitude,
        accuracy: TEST_LOCATION.accuracy
      }, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
      console.log('✅ Location validation result:', validateResponse.data);
    } catch (error) {
      console.log('❌ Location validation error:', error.response?.data || error.message);
    }

    // Test 2: Get Current Status (before clock-in)
    console.log('\n📊 Test 2: GET /worker/attendance/status');
    try {
      const statusResponse = await axios.get(`${API_BASE_URL}/worker/attendance/status?projectId=${PROJECT_ID}`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
      console.log('✅ Current status:', statusResponse.data);
    } catch (error) {
      console.log('❌ Status error:', error.response?.data || error.message);
    }

    // Test 3: Clock In
    console.log('\n⏰ Test 3: POST /worker/attendance/clock-in');
    try {
      const clockInResponse = await axios.post(`${API_BASE_URL}/worker/attendance/clock-in`, {
        projectId: PROJECT_ID,
        latitude: TEST_LOCATION.latitude,
        longitude: TEST_LOCATION.longitude,
        accuracy: TEST_LOCATION.accuracy
      }, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
      console.log('✅ Clock-in result:', clockInResponse.data);
    } catch (error) {
      console.log('❌ Clock-in error:', error.response?.data || error.message);
    }

    // Test 4: Get Today's Attendance
    console.log('\n📅 Test 4: GET /worker/attendance/today');
    try {
      const todayResponse = await axios.get(`${API_BASE_URL}/worker/attendance/today?projectId=${PROJECT_ID}`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
      console.log('✅ Today\'s attendance:', todayResponse.data);
    } catch (error) {
      console.log('❌ Today\'s attendance error:', error.response?.data || error.message);
    }

    // Test 5: Start Lunch Break
    console.log('\n🍽️ Test 5: POST /worker/attendance/lunch-start');
    try {
      const lunchStartResponse = await axios.post(`${API_BASE_URL}/worker/attendance/lunch-start`, {
        projectId: PROJECT_ID,
        latitude: TEST_LOCATION.latitude,
        longitude: TEST_LOCATION.longitude,
        accuracy: TEST_LOCATION.accuracy
      }, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
      console.log('✅ Lunch start result:', lunchStartResponse.data);
    } catch (error) {
      console.log('❌ Lunch start error:', error.response?.data || error.message);
    }

    // Test 6: Get Status During Lunch
    console.log('\n📊 Test 6: GET /worker/attendance/status (during lunch)');
    try {
      const lunchStatusResponse = await axios.get(`${API_BASE_URL}/worker/attendance/status?projectId=${PROJECT_ID}`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
      console.log('✅ Status during lunch:', lunchStatusResponse.data);
    } catch (error) {
      console.log('❌ Lunch status error:', error.response?.data || error.message);
    }

    // Wait a moment to simulate lunch break
    console.log('\n⏳ Waiting 2 seconds to simulate lunch break...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 7: End Lunch Break
    console.log('\n🍽️ Test 7: POST /worker/attendance/lunch-end');
    try {
      const lunchEndResponse = await axios.post(`${API_BASE_URL}/worker/attendance/lunch-end`, {
        projectId: PROJECT_ID,
        latitude: TEST_LOCATION.latitude,
        longitude: TEST_LOCATION.longitude,
        accuracy: TEST_LOCATION.accuracy
      }, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
      console.log('✅ Lunch end result:', lunchEndResponse.data);
    } catch (error) {
      console.log('❌ Lunch end error:', error.response?.data || error.message);
    }

    // Test 8: Get Attendance History
    console.log('\n📚 Test 8: GET /worker/attendance/history');
    try {
      const historyResponse = await axios.get(`${API_BASE_URL}/worker/attendance/history?projectId=${PROJECT_ID}&limit=5`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
      console.log('✅ Attendance history:', historyResponse.data);
    } catch (error) {
      console.log('❌ History error:', error.response?.data || error.message);
    }

    // Test 9: Clock Out
    console.log('\n⏰ Test 9: POST /worker/attendance/clock-out');
    try {
      const clockOutResponse = await axios.post(`${API_BASE_URL}/worker/attendance/clock-out`, {
        projectId: PROJECT_ID,
        latitude: TEST_LOCATION.latitude,
        longitude: TEST_LOCATION.longitude,
        accuracy: TEST_LOCATION.accuracy
      }, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
      console.log('✅ Clock-out result:', clockOutResponse.data);
    } catch (error) {
      console.log('❌ Clock-out error:', error.response?.data || error.message);
    }

    // Test 10: Final Status Check
    console.log('\n📊 Test 10: GET /worker/attendance/status (after clock-out)');
    try {
      const finalStatusResponse = await axios.get(`${API_BASE_URL}/worker/attendance/status?projectId=${PROJECT_ID}`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
      console.log('✅ Final status:', finalStatusResponse.data);
    } catch (error) {
      console.log('❌ Final status error:', error.response?.data || error.message);
    }

    console.log('\n🎉 Worker Attendance API testing completed!');

  } catch (error) {
    console.error('❌ Test suite error:', error.message);
  }
}

// Error handling scenarios
async function testErrorScenarios() {
  console.log('\n🚨 Testing Error Scenarios...\n');

  try {
    // Test: Clock-in twice
    console.log('🔄 Test: Double clock-in attempt');
    try {
      await axios.post(`${API_BASE_URL}/worker/attendance/clock-in`, {
        projectId: PROJECT_ID,
        latitude: TEST_LOCATION.latitude,
        longitude: TEST_LOCATION.longitude
      }, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
    } catch (error) {
      console.log('✅ Expected error for double clock-in:', error.response?.data?.message);
    }

    // Test: Clock-out without clock-in (after clearing attendance)
    console.log('\n🔄 Test: Clock-out without clock-in');
    try {
      await axios.post(`${API_BASE_URL}/worker/attendance/clock-out`, {
        projectId: 999, // Non-existent project
        latitude: TEST_LOCATION.latitude,
        longitude: TEST_LOCATION.longitude
      }, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
    } catch (error) {
      console.log('✅ Expected error for invalid project:', error.response?.data?.message);
    }

    // Test: Outside geofence
    console.log('\n🌍 Test: Outside geofence validation');
    try {
      const outsideResponse = await axios.post(`${API_BASE_URL}/worker/attendance/validate-location`, {
        projectId: PROJECT_ID,
        latitude: 40.7128, // New York coordinates
        longitude: -74.0060,
        accuracy: 10
      }, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
      console.log('✅ Outside geofence result:', outsideResponse.data);
    } catch (error) {
      console.log('❌ Outside geofence error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Error scenario test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testWorkerAttendanceAPIs();
  await testErrorScenarios();
}

runAllTests();