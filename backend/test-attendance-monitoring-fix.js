/**
 * Test the attendance monitoring API fix
 */

import axios from 'axios';

const BASE_URL = 'http://192.168.1.6:5002/api';
const CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'password123'
};

async function testAttendanceMonitoringFix() {
  try {
    console.log('🔍 Testing Attendance Monitoring API Fix...\n');

    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Test attendance monitoring API
    console.log('2️⃣ Testing attendance monitoring API...');
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      const response = await axios.get(`${BASE_URL}/supervisor/attendance-monitoring?projectId=1`, { headers });
      console.log('✅ Attendance monitoring API working!');
      console.log(`📊 Response: ${response.data.workers?.length || 0} workers found`);
      console.log(`📈 Summary: ${JSON.stringify(response.data.summary, null, 2)}`);
    } catch (error) {
      console.log('❌ Attendance monitoring API failed:');
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Error: ${error.response.data.message || error.response.data.error || 'Unknown error'}`);
        if (error.response.data.stack) {
          console.log(`Stack: ${error.response.data.stack.split('\n')[0]}`);
        }
      } else {
        console.log(`Error: ${error.message}`);
      }
    }

    console.log('\n✅ Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAttendanceMonitoringFix();