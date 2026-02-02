import axios from 'axios';
import appConfig from './src/config/app.config.js';

/**
 * Test script for attendance notification API endpoints
 */

const API_BASE_URL = `http://localhost:${appConfig.server.port}${appConfig.api.prefix}`;

// Mock authentication token (you would get this from login in real scenario)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImNvbXBhbnlJZCI6MSwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImlhdCI6MTczODI0NzI2NCwiZXhwIjoxNzM4MjUwODY0fQ.example'; // This would be a real token

async function testAttendanceNotificationAPIs() {
  console.log('🧪 Testing Attendance Notification API Endpoints');
  console.log('================================================');

  try {
    // Test lunch break reminder endpoint
    console.log('\n🍽️ Testing lunch break reminder API...');
    try {
      const lunchResponse = await axios.post(`${API_BASE_URL}/attendance/send-lunch-reminder`, {
        workerId: 1,
        projectId: 1
      }, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Lunch break reminder API response:', {
        status: lunchResponse.status,
        success: lunchResponse.data.success,
        message: lunchResponse.data.message
      });
    } catch (error) {
      console.log('⚠️ Lunch break reminder API test (expected to fail without valid auth):', {
        status: error.response?.status || 'No response',
        message: error.response?.data?.message || error.message
      });
    }

    // Test overtime alert endpoint
    console.log('\n⏰ Testing overtime alert API...');
    try {
      const overtimeResponse = await axios.post(`${API_BASE_URL}/attendance/send-overtime-alert`, {
        workerId: 1,
        overtimeInfo: {
          startTime: '6:00 PM',
          expectedDuration: '2 hours',
          reason: 'Project deadline',
          projectId: 1
        },
        overtimeType: 'START'
      }, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Overtime alert API response:', {
        status: overtimeResponse.status,
        success: overtimeResponse.data.success,
        message: overtimeResponse.data.message
      });
    } catch (error) {
      console.log('⚠️ Overtime alert API test (expected to fail without valid auth):', {
        status: error.response?.status || 'No response',
        message: error.response?.data?.message || error.message
      });
    }

    // Test attendance alerts check endpoint
    console.log('\n🔍 Testing attendance alerts check API...');
    try {
      const alertsResponse = await axios.post(`${API_BASE_URL}/attendance/check-alerts`, {}, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Attendance alerts check API response:', {
        status: alertsResponse.status,
        success: alertsResponse.data.success,
        message: alertsResponse.data.message
      });
    } catch (error) {
      console.log('⚠️ Attendance alerts check API test (expected to fail without valid auth):', {
        status: error.response?.status || 'No response',
        message: error.response?.data?.message || error.message
      });
    }

    // Test geofence validation with location logging (this should trigger geofence violation)
    console.log('\n🚨 Testing geofence violation trigger via location logging...');
    try {
      const locationResponse = await axios.post(`${API_BASE_URL}/attendance/log-location`, {
        projectId: 1,
        latitude: 1.3521, // Singapore coordinates (likely outside project geofence)
        longitude: 103.8198,
        accuracy: 10
      }, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Location logging API response:', {
        status: locationResponse.status,
        insideGeofence: locationResponse.data.insideGeofence
      });
    } catch (error) {
      console.log('⚠️ Location logging API test (expected to fail without valid auth):', {
        status: error.response?.status || 'No response',
        message: error.response?.data?.message || error.message
      });
    }

    console.log('\n✅ API endpoint tests completed');
    console.log('Note: Most tests expected to fail due to authentication requirements');
    console.log('In a real scenario, you would first login to get a valid JWT token');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Test if server is running first
async function checkServerStatus() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Server is running:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the backend server first.');
    console.log(`Expected server at: ${API_BASE_URL}`);
    return false;
  }
}

async function runAPITests() {
  const serverRunning = await checkServerStatus();
  if (serverRunning) {
    await testAttendanceNotificationAPIs();
  }
}

runAPITests();