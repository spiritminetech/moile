/**
 * Detailed test for attendance monitoring API with error logging
 */

import axios from 'axios';

const BASE_URL = 'http://192.168.1.6:5002/api';
const CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'password123'
};

async function testAttendanceMonitoringDetailed() {
  try {
    console.log('🔍 Testing Attendance Monitoring API with Detailed Logging...\n');

    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log(`Token: ${token.substring(0, 20)}...`);
    console.log('');

    // Step 2: Test attendance monitoring API with different parameters
    console.log('2️⃣ Testing attendance monitoring API...');
    const headers = { Authorization: `Bearer ${token}` };
    
    const testCases = [
      { params: '?projectId=1', description: 'Project 1' },
      { params: '?projectId=2', description: 'Project 2' },
      { params: '', description: 'All projects' },
      { params: '?projectId=1&date=2026-02-10', description: 'Project 1 with specific date' }
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Testing: ${testCase.description}`);
      console.log(`URL: ${BASE_URL}/supervisor/attendance-monitoring${testCase.params}`);
      
      try {
        const response = await axios.get(`${BASE_URL}/supervisor/attendance-monitoring${testCase.params}`, { headers });
        console.log('✅ Success!');
        console.log(`📊 Workers found: ${response.data.workers?.length || 0}`);
        console.log(`📈 Summary: Total=${response.data.summary?.totalWorkers || 0}, Present=${response.data.summary?.checkedIn || 0}, Absent=${response.data.summary?.absent || 0}`);
        
        if (response.data.workers && response.data.workers.length > 0) {
          console.log(`👤 First worker: ${response.data.workers[0].workerName} - ${response.data.workers[0].status}`);
        }
      } catch (error) {
        console.log('❌ Failed:');
        if (error.response) {
          console.log(`Status: ${error.response.status}`);
          console.log(`Error: ${error.response.data.message || error.response.data.error || 'Unknown error'}`);
          if (error.response.data.stack) {
            console.log(`Stack trace:`);
            console.log(error.response.data.stack);
          }
        } else {
          console.log(`Network Error: ${error.message}`);
        }
      }
    }

    console.log('\n✅ All tests completed');

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

testAttendanceMonitoringDetailed();