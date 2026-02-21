/**
 * Debug Script for Attendance Issues
 * This script helps identify and fix attendance-related problems
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

// Enhanced logging with colors (if supported)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const colorMap = {
    info: colors.blue,
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    debug: colors.cyan
  };
  
  const color = colorMap[level] || colors.reset;
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    debug: '🔍'
  }[level] || '📋';
  
  console.log(`${color}${prefix} [${timestamp}] ${message}${colors.reset}`);
  if (data) {
    console.log(`${color}${JSON.stringify(data, null, 2)}${colors.reset}`);
  }
};

// API client with detailed logging
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Add request/response interceptors for debugging
apiClient.interceptors.request.use(
  (config) => {
    log('debug', `🚀 Making ${config.method?.toUpperCase()} request to: ${config.url}`, {
      headers: config.headers,
      data: config.data,
      params: config.params
    });
    return config;
  },
  (error) => {
    log('error', '❌ Request setup failed:', error.message);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    log('success', `✅ Response received (${response.status}):`, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });
    return response;
  },
  (error) => {
    log('error', '❌ Response error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });
    return Promise.reject(error);
  }
);

// Diagnostic functions
async function checkBackendHealth() {
  log('info', '🏥 Checking backend health...');
  try {
    const healthUrl = BASE_URL.replace('/api', '/health');
    const response = await axios.get(healthUrl, { timeout: 5000 });
    log('success', '✅ Backend is healthy:', response.data);
    return true;
  } catch (error) {
    log('error', '❌ Backend health check failed:', error.message);
    return false;
  }
}

async function checkAuthentication() {
  log('info', '🔐 Checking authentication...');
  try {
    // Try to access a protected endpoint
    const response = await apiClient.get('/worker/profile');
    log('success', '✅ Authentication is working');
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      log('error', '❌ Authentication failed - Token is invalid or expired');
      log('warning', '⚠️  Please update the TEST_TOKEN in this script');
    } else {
      log('error', '❌ Authentication check failed:', error.message);
    }
    return false;
  }
}

async function checkProjectAssignment() {
  log('info', '🏗️ Checking project assignment...');
  try {
    const response = await apiClient.get('/worker/profile');
    const profile = response.data;
    
    if (profile && profile.profile) {
      log('success', '✅ User profile retrieved:', {
        id: profile.profile.id,
        name: profile.profile.name,
        email: profile.profile.email
      });
      
      // Check if user has project assignment
      if (profile.profile.currentProject) {
        log('success', '✅ User has project assignment:', profile.profile.currentProject);
        return profile.profile.currentProject.id;
      } else {
        log('warning', '⚠️  User does not have a current project assigned');
        log('info', '💡 This might be why attendance actions are failing');
        return null;
      }
    } else {
      log('error', '❌ Invalid profile response format');
      return null;
    }
  } catch (error) {
    log('error', '❌ Failed to check project assignment:', error.message);
    return null;
  }
}

async function testGeofenceValidation() {
  log('info', '📍 Testing geofence validation...');
  try {
    const response = await apiClient.post('/worker/attendance/validate-location', {
      projectId: testData.projectId,
      latitude: testData.latitude,
      longitude: testData.longitude,
      accuracy: testData.accuracy
    });
    
    log('success', '✅ Geofence validation successful:', response.data);
    return response.data;
  } catch (error) {
    log('error', '❌ Geofence validation failed:', error.message);
    if (error.response?.status === 404) {
      log('warning', '⚠️  Endpoint not found - Check if your backend implements this endpoint');
    }
    return null;
  }
}

async function testClockInOut() {
  log('info', '⏰ Testing clock in/out functionality...');
  
  // Test Clock In
  try {
    log('info', '🔄 Testing clock in...');
    const clockInResponse = await apiClient.post('/worker/attendance/clock-in', {
      projectId: testData.projectId,
      latitude: testData.latitude,
      longitude: testData.longitude,
      accuracy: testData.accuracy
    });
    
    log('success', '✅ Clock in successful:', clockInResponse.data);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test Clock Out
    log('info', '🔄 Testing clock out...');
    const clockOutResponse = await apiClient.post('/worker/attendance/clock-out', {
      projectId: testData.projectId,
      latitude: testData.latitude,
      longitude: testData.longitude,
      accuracy: testData.accuracy
    });
    
    log('success', '✅ Clock out successful:', clockOutResponse.data);
    return true;
    
  } catch (error) {
    log('error', '❌ Clock in/out test failed:', error.message);
    
    if (error.response?.status === 400) {
      log('warning', '⚠️  Bad request - Check if you\'re already clocked in/out');
      log('info', '💡 Try checking attendance status first');
    } else if (error.response?.status === 404) {
      log('warning', '⚠️  Endpoint not found - Check if your backend implements these endpoints');
    }
    
    return false;
  }
}

async function checkAttendanceStatus() {
  log('info', '📊 Checking current attendance status...');
  try {
    const response = await apiClient.get('/worker/attendance/status');
    log('success', '✅ Attendance status retrieved:', response.data);
    return response.data;
  } catch (error) {
    log('error', '❌ Failed to get attendance status:', error.message);
    return null;
  }
}

async function checkTodaysAttendance() {
  log('info', '📅 Checking today\'s attendance...');
  try {
    const response = await apiClient.get('/worker/attendance/today');
    log('success', '✅ Today\'s attendance retrieved:', response.data);
    return response.data;
  } catch (error) {
    log('error', '❌ Failed to get today\'s attendance:', error.message);
    return null;
  }
}

// Network diagnostics
async function checkNetworkConnectivity() {
  log('info', '🌐 Checking network connectivity...');
  
  const testUrls = [
    BASE_URL.replace('/api', '/health'),
    BASE_URL.replace('/api', ''),
    'https://google.com',
    'https://httpbin.org/get'
  ];
  
  for (const url of testUrls) {
    try {
      const response = await axios.get(url, { timeout: 5000 });
      log('success', `✅ ${url} - Reachable (${response.status})`);
    } catch (error) {
      log('error', `❌ ${url} - Not reachable: ${error.message}`);
    }
  }
}

// Main diagnostic function
async function runDiagnostics() {
  log('info', '🔧 Starting Attendance Issue Diagnostics');
  log('info', '=' .repeat(80));
  log('info', `Base URL: ${BASE_URL}`);
  log('info', `Test Token: ${TEST_TOKEN.substring(0, 20)}...`);
  log('info', '=' .repeat(80));
  
  const results = {
    backendHealth: false,
    authentication: false,
    projectAssignment: null,
    geofenceValidation: null,
    clockInOut: false,
    attendanceStatus: null,
    todaysAttendance: null
  };
  
  // Step 1: Check network connectivity
  await checkNetworkConnectivity();
  
  // Step 2: Check backend health
  results.backendHealth = await checkBackendHealth();
  if (!results.backendHealth) {
    log('error', '❌ Cannot proceed - Backend is not accessible');
    return results;
  }
  
  // Step 3: Check authentication
  results.authentication = await checkAuthentication();
  if (!results.authentication) {
    log('error', '❌ Cannot proceed - Authentication failed');
    return results;
  }
  
  // Step 4: Check project assignment
  results.projectAssignment = await checkProjectAssignment();
  
  // Step 5: Check attendance status
  results.attendanceStatus = await checkAttendanceStatus();
  
  // Step 6: Check today's attendance
  results.todaysAttendance = await checkTodaysAttendance();
  
  // Step 7: Test geofence validation
  results.geofenceValidation = await testGeofenceValidation();
  
  // Step 8: Test clock in/out (only if not already clocked in)
  if (results.attendanceStatus?.session !== 'CHECKED_IN') {
    results.clockInOut = await testClockInOut();
  } else {
    log('info', '⏰ Skipping clock in/out test - User is already clocked in');
  }
  
  // Generate diagnostic report
  log('info', '\n' + '=' .repeat(80));
  log('info', '📋 DIAGNOSTIC REPORT');
  log('info', '=' .repeat(80));
  
  log('info', `Backend Health: ${results.backendHealth ? '✅ OK' : '❌ FAIL'}`);
  log('info', `Authentication: ${results.authentication ? '✅ OK' : '❌ FAIL'}`);
  log('info', `Project Assignment: ${results.projectAssignment ? '✅ OK (ID: ' + results.projectAssignment + ')' : '⚠️  MISSING'}`);
  log('info', `Geofence Validation: ${results.geofenceValidation ? '✅ OK' : '❌ FAIL'}`);
  log('info', `Clock In/Out: ${results.clockInOut ? '✅ OK' : '❌ FAIL'}`);
  log('info', `Attendance Status: ${results.attendanceStatus ? '✅ OK' : '❌ FAIL'}`);
  log('info', `Today's Attendance: ${results.todaysAttendance ? '✅ OK' : '❌ FAIL'}`);
  
  // Provide recommendations
  log('info', '\n📝 RECOMMENDATIONS:');
  
  if (!results.backendHealth) {
    log('warning', '1. ⚠️  Start your backend server');
    log('warning', '2. ⚠️  Check if the BASE_URL is correct');
  }
  
  if (!results.authentication) {
    log('warning', '3. ⚠️  Update the TEST_TOKEN with a valid JWT token');
    log('warning', '4. ⚠️  Check if the token has expired');
  }
  
  if (!results.projectAssignment) {
    log('warning', '5. ⚠️  Assign a project to the user in your backend');
    log('warning', '6. ⚠️  Update the User model to include currentProject');
  }
  
  if (!results.geofenceValidation) {
    log('warning', '7. ⚠️  Implement the /worker/attendance/validate-location endpoint');
  }
  
  if (!results.clockInOut) {
    log('warning', '8. ⚠️  Implement the /worker/attendance/clock-in and /worker/attendance/clock-out endpoints');
  }
  
  if (results.backendHealth && results.authentication && results.projectAssignment) {
    log('success', '\n🎉 Core systems are working! The mobile app should be able to connect.');
  }
  
  return results;
}

// Run diagnostics
if (require.main === module) {
  runDiagnostics().catch(error => {
    log('error', '❌ Diagnostic failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runDiagnostics,
  checkBackendHealth,
  checkAuthentication,
  checkProjectAssignment,
  testGeofenceValidation,
  testClockInOut,
  checkAttendanceStatus,
  checkTodaysAttendance
};