import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test credentials - update with actual driver credentials
const DRIVER_CREDENTIALS = {
  email: 'driver@example.com',
  password: 'password123'
};

let authToken = '';
let testTaskId = null;

// Helper function to make authenticated requests
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
};

// Test functions
const testLogin = async () => {
  console.log('\n🔐 Testing Login...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, DRIVER_CREDENTIALS);
    authToken = response.data.token;
    console.log('✅ Login successful');
    console.log('   Token:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
};

const testDashboardSummary = async () => {
  console.log('\n📊 Testing Dashboard Summary...');
  const result = await apiCall('GET', '/driver/dashboard/summary');
  if (result.success) {
    console.log('✅ Dashboard summary retrieved');
    console.log('   Summary:', JSON.stringify(result.data.summary, null, 2));
  } else {
    console.error('❌ Dashboard summary failed:', result.error);
  }
};

const testVehicleDetails = async () => {
  console.log('\n🚗 Testing Vehicle Details...');
  const result = await apiCall('GET', '/driver/vehicle');
  if (result.success) {
    console.log('✅ Vehicle details retrieved');
    console.log('   Vehicle:', JSON.stringify(result.data.vehicle, null, 2));
  } else {
    console.error('❌ Vehicle details failed:', result.error);
  }
};

const testTodaysTasks = async () => {
  console.log('\n📋 Testing Today\'s Tasks...');
  const result = await apiCall('GET', '/driver/tasks/today');
  if (result.success) {
    console.log('✅ Today\'s tasks retrieved');
    console.log(`   Found ${result.data.tasks.length} tasks`);
    if (result.data.tasks.length > 0) {
      testTaskId = result.data.tasks[0].taskId;
      console.log('   Using task ID for further tests:', testTaskId);
    }
  } else {
    console.error('❌ Today\'s tasks failed:', result.error);
  }
};

const testDelayReport = async () => {
  if (!testTaskId) {
    console.log('\n⏰ Skipping Delay Report (no task ID available)');
    return;
  }
  
  console.log('\n⏰ Testing Delay Report...');
  const delayData = {
    delayReason: 'Heavy traffic on highway',
    estimatedDelay: 30,
    currentLocation: {
      latitude: 1.3521,
      longitude: 103.8198,
      address: 'Orchard Road, Singapore'
    }
  };
  
  const result = await apiCall('POST', `/driver/tasks/${testTaskId}/delay`, delayData);
  if (result.success) {
    console.log('✅ Delay reported successfully');
    console.log('   Incident:', JSON.stringify(result.data.incident, null, 2));
  } else {
    console.error('❌ Delay report failed:', result.error);
  }
};

const testBreakdownReport = async () => {
  if (!testTaskId) {
    console.log('\n🔧 Skipping Breakdown Report (no task ID available)');
    return;
  }
  
  console.log('\n🔧 Testing Breakdown Report...');
  const breakdownData = {
    breakdownType: 'Engine Overheating',
    description: 'Engine temperature gauge showing red, need immediate assistance',
    location: {
      latitude: 1.3521,
      longitude: 103.8198,
      address: 'Orchard Road, Singapore'
    },
    requiresAssistance: true
  };
  
  const result = await apiCall('POST', `/driver/tasks/${testTaskId}/breakdown`, breakdownData);
  if (result.success) {
    console.log('✅ Breakdown reported successfully');
    console.log('   Incident:', JSON.stringify(result.data.incident, null, 2));
  } else {
    console.error('❌ Breakdown report failed:', result.error);
  }
};

const testWorkerCountValidation = async () => {
  if (!testTaskId) {
    console.log('\n✅ Skipping Worker Count Validation (no task ID available)');
    return;
  }
  
  console.log('\n✅ Testing Worker Count Validation...');
  const countData = {
    expectedCount: 10,
    actualCount: 10
  };
  
  const result = await apiCall('POST', `/driver/tasks/${testTaskId}/validate-count`, countData);
  if (result.success) {
    console.log('✅ Worker count validated');
    console.log('   Validation:', JSON.stringify(result.data.validation, null, 2));
  } else {
    console.error('❌ Worker count validation failed:', result.error);
  }
};

const testLicenseDetails = async () => {
  console.log('\n📄 Testing License Details (GET)...');
  const result = await apiCall('GET', '/driver/profile/license');
  if (result.success) {
    console.log('✅ License details retrieved');
    console.log('   License:', JSON.stringify(result.data.license, null, 2));
  } else {
    console.error('❌ License details failed:', result.error);
  }
};

const testUpdateLicense = async () => {
  console.log('\n📝 Testing License Update...');
  const licenseData = {
    licenseNumber: 'DL123456789',
    licenseType: 'Class 3',
    licenseExpiry: '2026-12-31'
  };
  
  const result = await apiCall('PUT', '/driver/profile/license', licenseData);
  if (result.success) {
    console.log('✅ License updated successfully');
    console.log('   Updated License:', JSON.stringify(result.data.license, null, 2));
  } else {
    console.error('❌ License update failed:', result.error);
  }
};

const testTripHistory = async () => {
  console.log('\n📅 Testing Trip History...');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date();
  
  const result = await apiCall('GET', `/driver/trips/history?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`);
  if (result.success) {
    console.log('✅ Trip history retrieved');
    console.log(`   Found ${result.data.trips?.length || 0} trips`);
  } else {
    console.error('❌ Trip history failed:', result.error);
  }
};

const testLogout = async () => {
  console.log('\n👋 Testing Logout...');
  const result = await apiCall('POST', '/driver/attendance/logout');
  if (result.success) {
    console.log('✅ Logout successful');
    console.log('   Timestamp:', result.data.timestamp);
  } else {
    console.error('❌ Logout failed:', result.error);
  }
};

const testDriverProfile = async () => {
  console.log('\n👤 Testing Driver Profile...');
  const result = await apiCall('GET', '/driver/profile');
  if (result.success) {
    console.log('✅ Driver profile retrieved');
    console.log('   Profile:', JSON.stringify(result.data.profile, null, 2));
  } else {
    console.error('❌ Driver profile failed:', result.error);
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Driver API Tests...');
  console.log('=====================================');
  
  // Login first
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.error('\n❌ Cannot proceed without authentication');
    return;
  }
  
  // Run all tests
  await testDriverProfile();
  await testDashboardSummary();
  await testVehicleDetails();
  await testTodaysTasks();
  await testDelayReport();
  await testBreakdownReport();
  await testWorkerCountValidation();
  await testLicenseDetails();
  await testUpdateLicense();
  await testTripHistory();
  await testLogout();
  
  console.log('\n=====================================');
  console.log('✅ All tests completed!');
};

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
