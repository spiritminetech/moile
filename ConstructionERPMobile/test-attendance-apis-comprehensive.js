/**
 * Comprehensive Attendance API Test Script
 * Tests all 8 attendance APIs from your specification with proper error handling
 */

const axios = require('axios');

// Configuration - UPDATE THESE VALUES
const BASE_URL = 'http://192.168.1.6:5002/api'; // Update with your backend URL
const TEST_TOKEN = 'your-jwt-token-here'; // Update with valid JWT token

// Test data
const testData = {
  projectId: 1,
  latitude: 1.3521,
  longitude: 103.8198,
  accuracy: 10
};

// API client setup
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Enhanced logging
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    debug: '🔍'
  }[level] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

// Test functions for each API endpoint
async function test1_ValidateLocation() {
  log('info', 'Testing 1. POST /worker/attendance/validate-location');
  try {
    const response = await apiClient.post('/worker/attendance/validate-location', {
      projectId: testData.projectId,
      latitude: testData.latitude,
      longitude: testData.longitude,
      accuracy: testData.accuracy
    });

    log('success', 'Response received:', response.data);
    
    // Verify response format matches your specification
    const data = response.data;
    const expectedFields = ['valid', 'insideGeofence', 'distance', 'canProceed', 'message', 'accuracy'];
    const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
    
    if (hasAllFields) {
      log('success', 'Response format validation: PASS');
      return { success: true, data: response.data };
    } else {
      const missingFields = expectedFields.filter(field => !data.hasOwnProperty(field));
      log('error', 'Response format validation: FAIL - Missing fields:', missingFields);
      return { success: false, error: 'Missing fields: ' + missingFields.join(', ') };
    }
    
  } catch (error) {
    log('error', 'API call failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return { success: false, error: error.message };
  }
}

async function test2_ClockIn() {
  log('info', 'Testing 2. POST /worker/attendance/clock-in');
  try {
    const response = await apiClient.post('/worker/attendance/clock-in', {
      projectId: testData.projectId,
      latitude: testData.latitude,
      longitude: testData.longitude,
      accuracy: testData.accuracy
    });

    log('success', 'Response received:', response.data);
    
    // Verify response format
    const data = response.data;
    const expectedFields = ['message', 'checkInTime', 'projectId', 'location'];
    const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
    
    if (hasAllFields) {
      log('success', 'Response format validation: PASS');
      return { success: true, data: response.data };
    } else {
      const missingFields = expectedFields.filter(field => !data.hasOwnProperty(field));
      log('error', 'Response format validation: FAIL - Missing fields:', missingFields);
      return { success: false, error: 'Missing fields: ' + missingFields.join(', ') };
    }
    
  } catch (error) {
    log('error', 'API call failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return { success: false, error: error.message };
  }
}

async function test3_ClockOut() {
  log('info', 'Testing 3. POST /worker/attendance/clock-out');
  try {
    const response = await apiClient.post('/worker/attendance/clock-out', {
      projectId: testData.projectId,
      latitude: testData.latitude,
      longitude: testData.longitude,
      accuracy: testData.accuracy
    });

    log('success', 'Response received:', response.data);
    
    // Verify response format
    const data = response.data;
    const expectedFields = ['message', 'checkOutTime', 'checkInTime', 'workDuration', 'projectId', 'location'];
    const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
    
    if (hasAllFields) {
      log('success', 'Response format validation: PASS');
      return { success: true, data: response.data };
    } else {
      const missingFields = expectedFields.filter(field => !data.hasOwnProperty(field));
      log('error', 'Response format validation: FAIL - Missing fields:', missingFields);
      return { success: false, error: 'Missing fields: ' + missingFields.join(', ') };
    }
    
  } catch (error) {
    log('error', 'API call failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return { success: false, error: error.message };
  }
}

async function test4_TodayAttendance() {
  log('info', 'Testing 4. GET /worker/attendance/today');
  try {
    const response = await apiClient.get(`/worker/attendance/today?projectId=${testData.projectId}`);

    log('success', 'Response received:', response.data);
    
    // Verify response format
    const data = response.data;
    const expectedFields = ['session', 'checkInTime', 'checkOutTime', 'lunchStartTime', 'lunchEndTime', 'date', 'projectId'];
    const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
    
    if (hasAllFields) {
      log('success', 'Response format validation: PASS');
      return { success: true, data: response.data };
    } else {
      const missingFields = expectedFields.filter(field => !data.hasOwnProperty(field));
      log('error', 'Response format validation: FAIL - Missing fields:', missingFields);
      return { success: false, error: 'Missing fields: ' + missingFields.join(', ') };
    }
    
  } catch (error) {
    log('error', 'API call failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return { success: false, error: error.message };
  }
}

async function test5_LunchStart() {
  log('info', 'Testing 5. POST /worker/attendance/lunch-start');
  try {
    const response = await apiClient.post('/worker/attendance/lunch-start', {
      projectId: testData.projectId,
      latitude: testData.latitude,
      longitude: testData.longitude,
      accuracy: testData.accuracy
    });

    log('success', 'Response received:', response.data);
    
    // Verify response format
    const data = response.data;
    const expectedFields = ['message', 'lunchStartTime', 'projectId'];
    const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
    
    if (hasAllFields) {
      log('success', 'Response format validation: PASS');
      return { success: true, data: response.data };
    } else {
      const missingFields = expectedFields.filter(field => !data.hasOwnProperty(field));
      log('error', 'Response format validation: FAIL - Missing fields:', missingFields);
      return { success: false, error: 'Missing fields: ' + missingFields.join(', ') };
    }
    
  } catch (error) {
    log('error', 'API call failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return { success: false, error: error.message };
  }
}

async function test6_LunchEnd() {
  log('info', 'Testing 6. POST /worker/attendance/lunch-end');
  try {
    const response = await apiClient.post('/worker/attendance/lunch-end', {
      projectId: testData.projectId,
      latitude: testData.latitude,
      longitude: testData.longitude,
      accuracy: testData.accuracy
    });

    log('success', 'Response received:', response.data);
    
    // Verify response format
    const data = response.data;
    const expectedFields = ['message', 'lunchEndTime', 'lunchStartTime', 'lunchDuration', 'projectId'];
    const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
    
    if (hasAllFields) {
      log('success', 'Response format validation: PASS');
      return { success: true, data: response.data };
    } else {
      const missingFields = expectedFields.filter(field => !data.hasOwnProperty(field));
      log('error', 'Response format validation: FAIL - Missing fields:', missingFields);
      return { success: false, error: 'Missing fields: ' + missingFields.join(', ') };
    }
    
  } catch (error) {
    log('error', 'API call failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return { success: false, error: error.message };
  }
}

async function test7_AttendanceStatus() {
  log('info', 'Testing 7. GET /worker/attendance/status');
  try {
    const response = await apiClient.get(`/worker/attendance/status?projectId=${testData.projectId}`);

    log('success', 'Response received:', response.data);
    
    // Verify response format
    const data = response.data;
    const expectedFields = ['status', 'session', 'checkInTime', 'checkOutTime', 'date', 'projectId', 'workDuration'];
    const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
    
    if (hasAllFields) {
      log('success', 'Response format validation: PASS');
      return { success: true, data: response.data };
    } else {
      const missingFields = expectedFields.filter(field => !data.hasOwnProperty(field));
      log('error', 'Response format validation: FAIL - Missing fields:', missingFields);
      return { success: false, error: 'Missing fields: ' + missingFields.join(', ') };
    }
    
  } catch (error) {
    log('error', 'API call failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return { success: false, error: error.message };
  }
}

async function test8_AttendanceHistory() {
  log('info', 'Testing 8. GET /worker/attendance/history');
  try {
    const response = await apiClient.get(`/worker/attendance/history?projectId=${testData.projectId}&limit=30&page=1`);

    log('success', 'Response received:', response.data);
    
    // Verify response format
    const data = response.data;
    const expectedFields = ['records', 'pagination'];
    const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
    
    if (hasAllFields && Array.isArray(data.records)) {
      log('success', 'Response format validation: PASS');
      return { success: true, data: response.data };
    } else {
      const missingFields = expectedFields.filter(field => !data.hasOwnProperty(field));
      log('error', 'Response format validation: FAIL - Missing fields:', missingFields);
      return { success: false, error: 'Missing fields: ' + missingFields.join(', ') };
    }
    
  } catch (error) {
    log('error', 'API call failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runAllTests() {
  log('info', '🚀 Starting Comprehensive Attendance API Tests');
  log('info', '=' .repeat(80));
  log('info', `Base URL: ${BASE_URL}`);
  log('info', `Test Data: Project ID ${testData.projectId}, Location: ${testData.latitude}, ${testData.longitude}`);
  log('info', '=' .repeat(80));
  
  const tests = [
    { name: 'Validate Location', fn: test1_ValidateLocation },
    { name: 'Clock In', fn: test2_ClockIn },
    { name: 'Clock Out', fn: test3_ClockOut },
    { name: 'Today\'s Attendance', fn: test4_TodayAttendance },
    { name: 'Lunch Start', fn: test5_LunchStart },
    { name: 'Lunch End', fn: test6_LunchEnd },
    { name: 'Attendance Status', fn: test7_AttendanceStatus },
    { name: 'Attendance History', fn: test8_AttendanceHistory }
  ];
  
  const results = [];
  
  for (const test of tests) {
    log('info', `\n${'='.repeat(60)}`);
    log('info', `Running: ${test.name}`);
    log('info', '='.repeat(60));
    
    try {
      const result = await test.fn();
      results.push({
        name: test.name,
        success: result.success,
        error: result.error || null,
        data: result.data || null
      });
      
      if (result.success) {
        log('success', `✅ ${test.name}: PASSED`);
      } else {
        log('error', `❌ ${test.name}: FAILED - ${result.error}`);
      }
    } catch (error) {
      log('error', `❌ ${test.name}: EXCEPTION - ${error.message}`);
      results.push({
        name: test.name,
        success: false,
        error: error.message,
        data: null
      });
    }
    
    // Wait between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate summary report
  log('info', '\n' + '=' .repeat(80));
  log('info', '📊 TEST SUMMARY REPORT');
  log('info', '=' .repeat(80));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const successRate = ((passed / results.length) * 100).toFixed(1);
  
  log('info', `Total Tests: ${results.length}`);
  log('success', `Passed: ${passed}`);
  log('error', `Failed: ${failed}`);
  log('info', `Success Rate: ${successRate}%`);
  
  log('info', '\n📋 Detailed Results:');
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const error = result.error ? ` (${result.error})` : '';
    log('info', `${index + 1}. ${result.name}: ${status}${error}`);
  });
  
  if (failed === 0) {
    log('success', '\n🎉 All attendance APIs are working correctly!');
    log('success', '✅ Your backend is fully compatible with the mobile app');
  } else {
    log('warning', '\n⚠️  Some tests failed. Please check:');
    log('warning', '1. Backend server is running and accessible');
    log('warning', '2. JWT token is valid and not expired');
    log('warning', '3. API endpoints match the specification');
    log('warning', '4. Database is properly configured');
  }
  
  return results;
}

// Connection test
async function testConnection() {
  log('info', '🔍 Testing connection to backend...');
  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`, { timeout: 5000 });
    log('success', '✅ Backend connection successful');
    return true;
  } catch (error) {
    log('error', '❌ Backend connection failed:', error.message);
    log('warning', '⚠️  Please ensure:');
    log('warning', '1. Backend server is running');
    log('warning', '2. Base URL is correct');
    log('warning', '3. Network connectivity is available');
    return false;
  }
}

// Run tests
if (require.main === module) {
  (async () => {
    // Test connection first
    const isConnected = await testConnection();
    
    if (isConnected) {
      await runAllTests();
    } else {
      log('error', '❌ Cannot proceed with tests - backend not accessible');
      process.exit(1);
    }
  })().catch(error => {
    log('error', '❌ Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testConnection,
  test1_ValidateLocation,
  test2_ClockIn,
  test3_ClockOut,
  test4_TodayAttendance,
  test5_LunchStart,
  test6_LunchEnd,
  test7_AttendanceStatus,
  test8_AttendanceHistory
};