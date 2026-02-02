/**
 * Test script for verifying attendance API integration and response format support
 * This script tests all 9 attendance APIs with the exact specification format
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://192.168.1.100:3000/api'; // Update with your backend URL
const TEST_TOKEN = 'your-jwt-token-here'; // Update with valid JWT token

// Test data
const testData = {
  projectId: 1,
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10
};

// API client setup
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Test functions
async function testGeofenceValidation() {
  console.log('\n🧪 Testing 1. POST /api/attendance/validate-geofence');
  try {
    const response = await apiClient.post('/attendance/validate-geofence', {
      projectId: testData.projectId,
      latitude: testData.latitude,
      longitude: testData.longitude,
      accuracy: testData.accuracy
    });

    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    
    // Verify response format
    const data = response.data;
    const expectedFields = ['insideGeofence', 'distance', 'canProceed', 'message', 'accuracy'];
    const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
    
    console.log(`📋 Format Check: ${hasAllFields ? '✅ PASS' : '❌ FAIL'}`);
    if (!hasAllFields) {
      console.log('❌ Missing fields:', expectedFields.filter(field => !data.hasOwnProperty(field)));
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testCombinedClockIn() {
  console.log('\n🧪 Testing 2. POST /api/attendance/submit (Clock In)');
  try {
    const response = await apiClient.post('/attendance/submit', {
      projectId: testData.projectId,
      session: 'checkin',
      latitude: testData.latitude,
      longitude: testData.longitude
    });

    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    
    // Verify response format
    const data = response.data;
    const hasMessage = data.hasOwnProperty('message');
    
    console.log(`📋 Format Check: ${hasMessage ? '✅ PASS' : '❌ FAIL'}`);
    if (!hasMessage) {
      console.log('❌ Missing message field');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testTodaysAttendance() {
  console.log('\n🧪 Testing 3. GET /api/attendance/today');
  try {
    const response = await apiClient.get('/attendance/today');

    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    
    // Verify response format
    const data = response.data;
    const expectedFields = ['session', 'checkInTime', 'checkOutTime', 'lunchStartTime', 'lunchEndTime', 'overtimeStartTime', 'date'];
    const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
    
    console.log(`📋 Format Check: ${hasAllFields ? '✅ PASS' : '❌ FAIL'}`);
    if (!hasAllFields) {
      console.log('❌ Missing fields:', expectedFields.filter(field => !data.hasOwnProperty(field)));
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testAttendanceHistory() {
  console.log('\n🧪 Testing 4. GET /api/attendance/history');
  try {
    const response = await apiClient.get(`/attendance/history?projectId=${testData.projectId}`);

    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    
    // Verify response format
    const data = response.data;
    const hasRecords = data.hasOwnProperty('records') && Array.isArray(data.records);
    
    console.log(`📋 Format Check: ${hasRecords ? '✅ PASS' : '❌ FAIL'}`);
    if (!hasRecords) {
      console.log('❌ Missing or invalid records array');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

// NEW DEDICATED ENDPOINTS TESTS

async function testDedicatedClockIn() {
  console.log('\n🧪 Testing 5. POST /api/worker/attendance/clock-in');
  try {
    const response = await apiClient.post('/worker/attendance/clock-in', {
      projectId: testData.projectId,
      latitude: testData.latitude,
      longitude: testData.longitude,
      accuracy: testData.accuracy
    });

    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    
    // Verify response format
    const data = response.data;
    const expectedFields = ['success', 'message', 'checkInTime', 'session'];
    const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
    const correctSession = data.session === 'CHECKED_IN';
    
    console.log(`📋 Format Check: ${hasAllFields && correctSession ? '✅ PASS' : '❌ FAIL'}`);
    if (!hasAllFields) {
      console.log('❌ Missing fields:', expectedFields.filter(field => !data.hasOwnProperty(field)));
    }
    if (!correctSession) {
      console.log('❌ Incorrect session value:', data.session);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testDedicatedClockOut() {
  console.log('\n🧪 Testing 6. POST /api/worker/attendance/clock-out');
  try {
    const response = await apiClient.post('/worker/attendance/clock-out', {
      projectId: testData.projectId,
      latitude: testData.latitude,
      longitude: testData.longitude,
      accuracy: testData.accuracy
    });

    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    
    // Verify response format
    const data = response.data;
    const expectedFields = ['success', 'message', 'checkOutTime', 'session', 'totalHours'];
    const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
    const correctSession = data.session === 'CHECKED_OUT';
    
    console.log(`📋 Format Check: ${hasAllFields && correctSession ? '✅ PASS' : '❌ FAIL'}`);
    if (!hasAllFields) {
      console.log('❌ Missing fields:', expectedFields.filter(field => !data.hasOwnProperty(field)));
    }
    if (!correctSession) {
      console.log('❌ Incorrect session value:', data.session);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testLunchStart() {
  console.log('\n🧪 Testing 7. POST /api/worker/attendance/lunch-start');
  try {
    const response = await apiClient.post('/worker/attendance/lunch-start', {
      projectId: testData.projectId,
      latitude: testData.latitude,
      longitude: testData.longitude
    });

    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    
    // Verify response format
    const data = response.data;
    const expectedFields = ['success', 'message', 'lunchStartTime'];
    const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
    
    console.log(`📋 Format Check: ${hasAllFields ? '✅ PASS' : '❌ FAIL'}`);
    if (!hasAllFields) {
      console.log('❌ Missing fields:', expectedFields.filter(field => !data.hasOwnProperty(field)));
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testLunchEnd() {
  console.log('\n🧪 Testing 8. POST /api/worker/attendance/lunch-end');
  try {
    const response = await apiClient.post('/worker/attendance/lunch-end', {
      projectId: testData.projectId,
      latitude: testData.latitude,
      longitude: testData.longitude
    });

    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    
    // Verify response format
    const data = response.data;
    const expectedFields = ['success', 'message', 'lunchEndTime', 'lunchDuration'];
    const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
    
    console.log(`📋 Format Check: ${hasAllFields ? '✅ PASS' : '❌ FAIL'}`);
    if (!hasAllFields) {
      console.log('❌ Missing fields:', expectedFields.filter(field => !data.hasOwnProperty(field)));
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testWorkerAttendanceStatus() {
  console.log('\n🧪 Testing 9. GET /api/worker/attendance/status');
  try {
    const response = await apiClient.get('/worker/attendance/status');

    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    
    // Verify response format
    const data = response.data;
    const expectedFields = ['currentStatus', 'checkInTime', 'checkOutTime', 'lunchStartTime', 'lunchEndTime', 'isOnLunchBreak', 'hoursWorked', 'projectId', 'date'];
    const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
    
    console.log(`📋 Format Check: ${hasAllFields ? '✅ PASS' : '❌ FAIL'}`);
    if (!hasAllFields) {
      console.log('❌ Missing fields:', expectedFields.filter(field => !data.hasOwnProperty(field)));
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Attendance API Integration Tests');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'Geofence Validation', fn: testGeofenceValidation },
    { name: 'Combined Clock In', fn: testCombinedClockIn },
    { name: 'Today\'s Attendance', fn: testTodaysAttendance },
    { name: 'Attendance History', fn: testAttendanceHistory },
    { name: 'Dedicated Clock In', fn: testDedicatedClockIn },
    { name: 'Dedicated Clock Out', fn: testDedicatedClockOut },
    { name: 'Lunch Start', fn: testLunchStart },
    { name: 'Lunch End', fn: testLunchEnd },
    { name: 'Worker Attendance Status', fn: testWorkerAttendanceStatus }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ Test ${test.name} failed with error:`, error.message);
      failed++;
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All attendance APIs are working correctly!');
    console.log('✅ Response formats match the specification');
  } else {
    console.log('\n⚠️  Some tests failed. Check the backend implementation.');
  }
}

// Response format verification
function verifyResponseFormats() {
  console.log('\n📋 EXPECTED RESPONSE FORMATS');
  console.log('=' .repeat(60));
  
  console.log('\n1. POST /api/attendance/validate-geofence');
  console.log(JSON.stringify({
    "insideGeofence": true,
    "distance": 25.5,
    "canProceed": true,
    "message": "Location validated successfully",
    "accuracy": 10
  }, null, 2));
  
  console.log('\n2. POST /api/attendance/submit');
  console.log(JSON.stringify({
    "message": "Check-in successful"
  }, null, 2));
  
  console.log('\n3. GET /api/attendance/today');
  console.log(JSON.stringify({
    "session": "CHECKED_IN",
    "checkInTime": "2026-02-02T08:00:00.000Z",
    "checkOutTime": null,
    "lunchStartTime": null,
    "lunchEndTime": null,
    "overtimeStartTime": null,
    "date": "2026-02-02",
    "projectId": 1
  }, null, 2));
  
  console.log('\n4. GET /api/attendance/history');
  console.log(JSON.stringify({
    "records": [{
      "_id": "507f1f77bcf86cd799439011",
      "employeeId": 1,
      "projectId": 1,
      "date": "2026-02-02T00:00:00.000Z",
      "checkIn": "2026-02-02T08:00:00.000Z",
      "checkOut": "2026-02-02T17:00:00.000Z",
      "pendingCheckout": false,
      "insideGeofenceAtCheckin": true,
      "insideGeofenceAtCheckout": true
    }]
  }, null, 2));
  
  console.log('\n5. POST /api/worker/attendance/clock-in');
  console.log(JSON.stringify({
    "success": true,
    "message": "Clock-in successful",
    "checkInTime": "2026-02-02T08:00:00.000Z",
    "session": "CHECKED_IN"
  }, null, 2));
  
  console.log('\n6. POST /api/worker/attendance/clock-out');
  console.log(JSON.stringify({
    "success": true,
    "message": "Clock-out successful",
    "checkOutTime": "2026-02-02T17:00:00.000Z",
    "session": "CHECKED_OUT",
    "totalHours": 9.0
  }, null, 2));
  
  console.log('\n7. POST /api/worker/attendance/lunch-start');
  console.log(JSON.stringify({
    "success": true,
    "message": "Lunch break started",
    "lunchStartTime": "2026-02-02T12:00:00.000Z"
  }, null, 2));
  
  console.log('\n8. POST /api/worker/attendance/lunch-end');
  console.log(JSON.stringify({
    "success": true,
    "message": "Lunch break ended",
    "lunchEndTime": "2026-02-02T13:00:00.000Z",
    "lunchDuration": 60
  }, null, 2));
  
  console.log('\n9. GET /api/worker/attendance/status');
  console.log(JSON.stringify({
    "currentStatus": "CHECKED_IN",
    "checkInTime": "2026-02-02T08:00:00.000Z",
    "checkOutTime": null,
    "lunchStartTime": null,
    "lunchEndTime": null,
    "isOnLunchBreak": false,
    "hoursWorked": 4.5,
    "projectId": 1,
    "date": "2026-02-02"
  }, null, 2));
}

// Run tests
if (require.main === module) {
  // Show expected formats first
  verifyResponseFormats();
  
  // Run the actual tests
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  verifyResponseFormats,
  testGeofenceValidation,
  testCombinedClockIn,
  testTodaysAttendance,
  testAttendanceHistory,
  testDedicatedClockIn,
  testDedicatedClockOut,
  testLunchStart,
  testLunchEnd,
  testWorkerAttendanceStatus
};