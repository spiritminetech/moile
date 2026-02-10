// Test script to verify geofence coordinate fix
// This script tests both validation and clock-in APIs with the same coordinates

import axios from 'axios';

const API_BASE_URL = 'http://192.168.0.3:5002/api';
const WORKER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjY0LCJjb21wYW55SWQiOjEsInJvbGVJZCI6NCwicm9sZSI6IldPUktFUiIsImVtYWlsIjoid29ya2VyMUBnbWFpbC5jb20iLCJwZXJtaXNzaW9ucyI6WyJBVFRFTkRBTkNFX1ZJRVciLCJDT01NT05fQVRURU5EQU5DRV9WSUVXIiwiUFJPRklMRV9WSUVXIiwiV09SS0VSX1RBU0tfVklFVyIsIldPUktFUl9UUklQX1ZJRVciLCJMRUFWRV9SRVFVRVNUX1ZJRVciLCJXT1JLRVJfVEFTS19VUERBVEUiLCJXT1JLRVJfQVRURU5EQU5DRV9WSUVXIiwiV09SS0VSX0FUVEVOREFOQ0VfVVBEQVRFIiwiV09SS0VSX0RBU0hCT0FSRF9WSUVXIiwiV09SS0VSX1BST0ZJTEVfVklFVyJdLCJpYXQiOjE3NzAwOTk4MjQsImV4cCI6MTc3MDEyODYyNH0.jF8eSf7z4CWh-lGZj5tHocw1RQXayz3lGlRtbmg0V34';

const headers = {
  'Authorization': `Bearer ${WORKER_TOKEN}`,
  'Content-Type': 'application/json'
};

// Test coordinates - using Bangalore coordinates that match the geofence
const testLocation = {
  projectId: 1003,
  latitude: 12.9716,   // Bangalore - matches geofence center
  longitude: 77.5946,  // Bangalore - matches geofence center
  accuracy: 10
};

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    console.log(`\n🚀 Testing ${method} ${endpoint}`);
    if (data) {
      console.log('📤 Request data:', data);
    }
    
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
      distance: response.data.distance,
      maxDistance: response.data.maxDistance,
      insideGeofence: response.data.insideGeofence,
      canProceed: response.data.canProceed
    });
    
    return response.data;
  } catch (error) {
    console.log(`❌ Error (${error.response?.status || 'Network'}):`, {
      message: error.response?.data?.message || error.message,
      error: error.response?.data?.error,
      success: error.response?.data?.success,
      distance: error.response?.data?.distance,
      maxDistance: error.response?.data?.maxDistance
    });
    
    return error.response?.data || { error: error.message };
  }
}

async function runGeofenceTests() {
  console.log('🧪 Testing Geofence Coordinate Fix');
  console.log('=' .repeat(50));
  console.log('📍 Test Location (Bangalore):', testLocation);
  console.log('=' .repeat(50));

  // Test 1: Frontend validation API (should show valid)
  console.log('\n🔍 Test 1: Frontend Geofence Validation API');
  const frontendValidation = await testAPI('/worker/attendance/validate-location', 'POST', testLocation);

  // Test 2: Backend clock-in API (should now also show valid)
  console.log('\n🕐 Test 2: Backend Clock-In API (with geofence fix)');
  const clockInResult = await testAPI('/worker/attendance/clock-in', 'POST', testLocation);

  // Test 3: Compare results
  console.log('\n📊 Test 3: Results Comparison');
  console.log('=' .repeat(50));
  
  if (frontendValidation.insideGeofence !== undefined && clockInResult.success !== undefined) {
    const frontendValid = frontendValidation.insideGeofence || frontendValidation.canProceed;
    const backendValid = clockInResult.success;
    
    console.log('Frontend validation result:', frontendValid ? '✅ VALID' : '❌ INVALID');
    console.log('Backend clock-in result:', backendValid ? '✅ SUCCESS' : '❌ FAILED');
    
    if (frontendValid && backendValid) {
      console.log('🎉 SUCCESS: Both APIs now use the same coordinates!');
    } else if (frontendValid && !backendValid) {
      console.log('⚠️  ISSUE: Frontend shows valid but backend still fails');
      console.log('   Frontend distance:', frontendValidation.distance);
      console.log('   Backend distance:', clockInResult.distance);
    } else {
      console.log('❌ ISSUE: Both APIs show invalid (check coordinates)');
    }
  } else {
    console.log('⚠️  Could not compare results - check API responses');
  }

  // Test 4: Test with Singapore coordinates (should fail for both)
  console.log('\n🌏 Test 4: Testing with Singapore Coordinates (should fail)');
  const singaporeLocation = {
    projectId: 1003,
    latitude: 1.3521,    // Singapore - old project coordinates
    longitude: 103.8198, // Singapore - old project coordinates
    accuracy: 10
  };
  
  console.log('📍 Singapore Location:', singaporeLocation);
  
  const singaporeValidation = await testAPI('/worker/attendance/validate-location', 'POST', singaporeLocation);
  console.log('Singapore validation - should be INVALID due to distance');

  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Geofence Tests Completed!');
  console.log('\n📝 Expected Results:');
  console.log('- Bangalore coordinates (12.9716, 77.5946): ✅ VALID for both APIs');
  console.log('- Singapore coordinates (1.3521, 103.8198): ❌ INVALID for both APIs');
  console.log('- Distance should be consistent between frontend and backend');
}

// Run the tests
runGeofenceTests().catch(console.error);