// Test Driver Dynamic Data Service
// Run this script to verify dynamic data fetching works correctly

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://192.168.1.6:5002/api'; // Update with your backend URL
const DRIVER_CREDENTIALS = {
  email: 'driver1@gmail.com',
  password: 'Anbu24@',
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logSection(message) {
  console.log('\n' + '='.repeat(60));
  log(message, colors.bright + colors.blue);
  console.log('='.repeat(60));
}

// Test Functions
let authToken = null;
let driverId = null;
let employeeId = null;

async function testLogin() {
  logSection('1. Testing Driver Login');
  
  try {
    logInfo(`Attempting login with: ${DRIVER_CREDENTIALS.email}`);
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, DRIVER_CREDENTIALS);
    
    if (response.data && response.data.token) {
      authToken = response.data.token;
      driverId = response.data.user?.id;
      employeeId = response.data.employeeId || response.data.user?.id;
      
      logSuccess('Login successful!');
      logInfo(`Driver ID: ${driverId}`);
      logInfo(`Employee ID: ${employeeId}`);
      logInfo(`Token: ${authToken.substring(0, 20)}...`);
      
      return true;
    } else {
      logError('Login failed: No token received');
      return false;
    }
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.status === 404) {
      logWarning('Backend endpoint not found. Is the server running?');
    }
    return false;
  }
}

async function testDashboardData() {
  logSection('2. Testing Dashboard Data');
  
  try {
    logInfo('Fetching dashboard summary...');
    
    const response = await axios.get(`${API_BASE_URL}/driver/dashboard/summary`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.data) {
      logSuccess('Dashboard data fetched successfully!');
      
      const summary = response.data.summary || response.data;
      
      console.log('\n📊 Dashboard Summary:');
      console.log(`   Completed Trips: ${summary.completedTrips || 0}`);
      console.log(`   Pending Tasks: ${summary.pendingTasks || 0}`);
      console.log(`   Current Vehicle: ${summary.currentVehicle?.registrationNo || 'N/A'}`);
      
      return true;
    }
  } catch (error) {
    logError(`Dashboard fetch failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testTransportTasks() {
  logSection('3. Testing Transport Tasks');
  
  try {
    logInfo('Fetching transport tasks...');
    
    const response = await axios.get(`${API_BASE_URL}/driver/transport-tasks`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.data) {
      const tasks = Array.isArray(response.data) ? response.data : response.data.data || [];
      
      logSuccess(`Transport tasks fetched successfully! (${tasks.length} tasks)`);
      
      if (tasks.length > 0) {
        console.log('\n🚛 Transport Tasks:');
        tasks.forEach((task, index) => {
          console.log(`   ${index + 1}. ${task.pickupLocation} → ${task.dropLocation}`);
          console.log(`      Status: ${task.status}, Passengers: ${task.passengers || 0}`);
        });
      } else {
        logWarning('No transport tasks found');
      }
      
      return true;
    }
  } catch (error) {
    logError(`Transport tasks fetch failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testVehicleInfo() {
  logSection('4. Testing Vehicle Info');
  
  try {
    logInfo('Fetching assigned vehicle...');
    
    const response = await axios.get(`${API_BASE_URL}/driver/vehicle`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.data) {
      const vehicle = response.data.data || response.data;
      
      logSuccess('Vehicle info fetched successfully!');
      
      console.log('\n🚗 Vehicle Details:');
      console.log(`   Registration: ${vehicle.registrationNo || 'N/A'}`);
      console.log(`   Type: ${vehicle.vehicleType || 'N/A'}`);
      console.log(`   Model: ${vehicle.model || 'N/A'}`);
      console.log(`   Capacity: ${vehicle.capacity || 0}`);
      
      return true;
    }
  } catch (error) {
    logError(`Vehicle info fetch failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testDriverProfile() {
  logSection('5. Testing Driver Profile');
  
  try {
    logInfo('Fetching driver profile...');
    
    const response = await axios.get(`${API_BASE_URL}/driver/profile`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.data) {
      const profile = response.data.data || response.data;
      
      logSuccess('Driver profile fetched successfully!');
      
      console.log('\n👤 Driver Profile:');
      console.log(`   Name: ${profile.user?.name || 'N/A'}`);
      console.log(`   Email: ${profile.user?.email || 'N/A'}`);
      console.log(`   Employee ID: ${profile.user?.employeeId || 'N/A'}`);
      console.log(`   License: ${profile.driverInfo?.licenseNumber || 'N/A'}`);
      console.log(`   Experience: ${profile.driverInfo?.yearsOfExperience || 0} years`);
      
      return true;
    }
  } catch (error) {
    logError(`Driver profile fetch failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testAttendance() {
  logSection('6. Testing Attendance Data');
  
  try {
    logInfo('Fetching attendance summary...');
    
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    const response = await axios.get(`${API_BASE_URL}/driver/attendance/summary`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { month, year },
    });
    
    if (response.data) {
      const attendance = response.data.data || response.data;
      
      logSuccess('Attendance data fetched successfully!');
      
      console.log('\n⏰ Attendance Summary:');
      console.log(`   Total Days: ${attendance.totalDays || 0}`);
      console.log(`   Present Days: ${attendance.presentDays || 0}`);
      console.log(`   Total Hours: ${attendance.totalHours || 0}`);
      
      return true;
    }
  } catch (error) {
    logError(`Attendance fetch failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testTripHistory() {
  logSection('7. Testing Trip History');
  
  try {
    logInfo('Fetching trip history...');
    
    const response = await axios.get(`${API_BASE_URL}/driver/trips/history`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { limit: 10 },
    });
    
    if (response.data) {
      const trips = response.data.trips || response.data.data || [];
      
      logSuccess(`Trip history fetched successfully! (${trips.length} trips)`);
      
      if (trips.length > 0) {
        console.log('\n🗺️  Recent Trips:');
        trips.slice(0, 5).forEach((trip, index) => {
          console.log(`   ${index + 1}. ${trip.route || 'N/A'} - ${trip.status || 'N/A'}`);
        });
      } else {
        logWarning('No trip history found');
      }
      
      return true;
    }
  } catch (error) {
    logError(`Trip history fetch failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Main Test Runner
async function runAllTests() {
  console.log('\n');
  log('🧪 DRIVER DYNAMIC DATA SERVICE TEST SUITE', colors.bright + colors.cyan);
  log(`📡 API Base URL: ${API_BASE_URL}`, colors.cyan);
  log(`👤 Driver Email: ${DRIVER_CREDENTIALS.email}`, colors.cyan);
  console.log('\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };
  
  // Test 1: Login
  results.total++;
  const loginSuccess = await testLogin();
  if (loginSuccess) {
    results.passed++;
  } else {
    results.failed++;
    logError('Login failed. Cannot proceed with other tests.');
    printSummary(results);
    return;
  }
  
  // Test 2: Dashboard
  results.total++;
  if (await testDashboardData()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 3: Transport Tasks
  results.total++;
  if (await testTransportTasks()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 4: Vehicle Info
  results.total++;
  if (await testVehicleInfo()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 5: Driver Profile
  results.total++;
  if (await testDriverProfile()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 6: Attendance
  results.total++;
  if (await testAttendance()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 7: Trip History
  results.total++;
  if (await testTripHistory()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Print Summary
  printSummary(results);
}

function printSummary(results) {
  logSection('TEST SUMMARY');
  
  console.log(`\n📊 Results:`);
  console.log(`   Total Tests: ${results.total}`);
  logSuccess(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  }
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`   Success Rate: ${successRate}%`);
  
  if (results.passed === results.total) {
    console.log('\n');
    logSuccess('🎉 All tests passed! Dynamic data fetching is working correctly!');
    console.log('\n');
    logInfo('Next Steps:');
    console.log('   1. Update your driver screens to use DriverDynamicDataService');
    console.log('   2. Test the mobile app with these credentials');
    console.log('   3. Verify data displays correctly in all screens');
  } else {
    console.log('\n');
    logWarning('⚠️  Some tests failed. Please check the errors above.');
    console.log('\n');
    logInfo('Troubleshooting:');
    console.log('   1. Ensure backend server is running');
    console.log('   2. Verify MongoDB has the seeded data');
    console.log('   3. Check API endpoints are correctly implemented');
    console.log('   4. Verify network connectivity');
  }
  
  console.log('\n');
}

// Run tests
runAllTests().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});
