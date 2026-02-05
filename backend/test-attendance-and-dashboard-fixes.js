// Test script to verify attendance and dashboard fixes
// This script tests the worker's task assignment, attendance, and dashboard functionality

import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.8:5002/api';
const WORKER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjY0LCJjb21wYW55SWQiOjEsInJvbGVJZCI6NCwicm9sZSI6IldPUktFUiIsImVtYWlsIjoid29ya2VyMUBnbWFpbC5jb20iLCJwZXJtaXNzaW9ucyI6WyJBVFRFTkRBTkNFX1ZJRVciLCJDT01NT05fQVRURU5EQU5DRV9WSUVXIiwiUFJPRklMRV9WSUVXIiwiV09SS0VSX1RBU0tfVklFVyIsIldPUktFUl9UUklQX1ZJRVciLCJMRUFWRV9SRVFVRVNUX1ZJRVciLCJXT1JLRVJfVEFTS19VUERBVEUiLCJXT1JLRVJfQVRURU5EQU5DRV9WSUVXIiwiV09SS0VSX0FUVEVOREFOQ0VfVVBEQVRFIiwiV09SS0VSX0RBU0hCT0FSRF9WSUVXIiwiV09SS0VSX1BST0ZJTEVfVklFVyJdLCJpYXQiOjE3NzAwOTk4MjQsImV4cCI6MTc3MDEyODYyNH0.jF8eSf7z4CWh-lGZj5tHocw1RQXayz3lGlRtbmg0V34';

const headers = {
  'Authorization': `Bearer ${WORKER_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    console.log(`\n🚀 Testing ${method} ${endpoint}`);
    
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers,
      ...(data && { data })
    };
    
    const response = await axios(config);
    
    console.log(`✅ Success (${response.status}):`, {
      success: response.data.success,
      message: response.data.message,
      dataKeys: response.data ? Object.keys(response.data) : []
    });
    
    return response.data;
  } catch (error) {
    console.log(`❌ Error (${error.response?.status || 'Network'}):`, {
      message: error.response?.data?.message || error.message,
      error: error.response?.data?.error,
      success: error.response?.data?.success
    });
    
    return error.response?.data || { error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Starting Attendance and Dashboard Tests');
  console.log('=' .repeat(50));

  // Test 1: Check today's tasks (dashboard data)
  console.log('\n📋 Test 1: Dashboard Data (Today\'s Tasks)');
  const dashboardData = await testAPI('/worker/tasks/today');

  // Test 2: Check attendance status
  console.log('\n⏰ Test 2: Today\'s Attendance Status');
  const attendanceStatus = await testAPI('/worker/attendance/today');

  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Tests completed!');
  console.log('\n📝 Summary:');
  console.log('- Task assignment should be created for today');
  console.log('- Dashboard should load without "invalid task assignment" error');
  console.log('- Attendance APIs should work properly');
}

// Run the tests
runTests().catch(console.error);