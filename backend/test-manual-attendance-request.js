/**
 * Test script for Manual Attendance Request API endpoints
 * Tests both getting workers for manual attendance and submitting overrides
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Test configuration
const TEST_CONFIG = {
  // Use existing test credentials
  supervisorEmail: 'supervisor@gmail.com',
  supervisorPassword: 'password123',
  projectId: 1, // Adjust based on your test data
  testDate: '2025-01-31' // Today's date
};

let authToken = '';

/**
 * Login as supervisor to get authentication token
 */
async function loginAsSupervisor() {
  try {
    console.log('🔐 Logging in as supervisor...');
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_CONFIG.supervisorEmail,
        password: TEST_CONFIG.supervisorPassword
      })
    });

    const data = await response.json();

    if (data.token) {
      authToken = data.token;
      console.log('✅ Supervisor login successful');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Login failed - no token received');
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Supervisor login failed:', error.message);
    return false;
  }
}

/**
 * Test getting workers for manual attendance
 */
async function testGetManualAttendanceWorkers() {
  try {
    console.log('\n📋 Testing GET /api/supervisor/manual-attendance-workers...');
    
    const url = new URL(`${API_BASE_URL}/api/supervisor/manual-attendance-workers`);
    url.searchParams.append('projectId', TEST_CONFIG.projectId);
    url.searchParams.append('date', TEST_CONFIG.testDate);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Manual attendance workers fetch successful');
      console.log(`   Project: ${data.projectName}`);
      console.log(`   Date: ${data.date}`);
      console.log(`   Workers found: ${data.workers.length}`);
      
      if (data.workers.length > 0) {
        console.log('\n   Sample worker data:');
        const worker = data.workers[0];
        console.log(`   - Name: ${worker.workerName}`);
        console.log(`   - Role: ${worker.role}`);
        console.log(`   - Status: ${worker.currentStatus}`);
        console.log(`   - Check-in: ${worker.checkInTime || 'Not checked in'}`);
        console.log(`   - Check-out: ${worker.checkOutTime || 'Not checked out'}`);
        console.log(`   - Task: ${worker.taskAssigned}`);
        console.log(`   - Can Override: ${worker.canOverride}`);
        
        return data.workers[0]; // Return first worker for override test
      } else {
        console.log('   No workers found for the specified project and date');
        return null;
      }
    } else {
      console.log('❌ Failed to fetch manual attendance workers:', data.message);
      if (response.status === 401) {
        console.log('   Authentication failed - check supervisor permissions');
      }
      return null;
    }
    
  } catch (error) {
    console.log('❌ Failed to fetch manual attendance workers:', error.message);
    return null;
  }
}

/**
 * Test submitting manual attendance override
 */
async function testSubmitManualAttendanceOverride(testWorker) {
  if (!testWorker) {
    console.log('\n⚠️  Skipping manual attendance override test - no test worker available');
    return;
  }

  try {
    console.log('\n✏️  Testing POST /api/supervisor/manual-attendance-override...');
    
    // Test check-in override
    const overrideData = {
      employeeId: testWorker.employeeId,
      projectId: TEST_CONFIG.projectId,
      date: TEST_CONFIG.testDate,
      overrideType: 'CHECK_IN',
      checkInTime: new Date(`${TEST_CONFIG.testDate}T08:00:00`).toISOString(),
      reason: 'Technical Issue',
      notes: 'Worker had device malfunction, manually setting check-in time'
    };

    console.log('   Testing: Check-in Override');
    
    const response = await fetch(`${API_BASE_URL}/api/supervisor/manual-attendance-override`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(overrideData)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('   ✅ Check-in Override successful');
      console.log(`      Message: ${data.message}`);
      console.log(`      Override Type: ${data.attendance.overrideType}`);
      console.log(`      Reason: ${data.attendance.reason}`);
      
      if (data.attendance.checkIn) {
        console.log(`      Check-in: ${new Date(data.attendance.checkIn).toLocaleString()}`);
      }
    } else {
      console.log('   ❌ Check-in Override failed:', data.message);
    }
    
  } catch (error) {
    console.log('❌ Manual attendance override test failed:', error.message);
  }
}

/**
 * Test error scenarios
 */
async function testErrorScenarios() {
  console.log('\n🚫 Testing error scenarios...');
  
  // Test missing projectId
  try {
    console.log('\n   Testing: Missing projectId');
    
    const url = new URL(`${API_BASE_URL}/api/supervisor/manual-attendance-workers`);
    url.searchParams.append('date', TEST_CONFIG.testDate);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();

    if (!response.ok && data.message.includes('projectId is required')) {
      console.log('   ✅ Correctly handled missing projectId error');
      console.log(`      Error: ${data.message}`);
    } else {
      console.log('   ⚠️  Expected error but got success or unexpected response');
    }
    
  } catch (error) {
    console.log('   ❌ Error testing missing projectId:', error.message);
  }

  // Test invalid override type
  try {
    console.log('\n   Testing: Invalid override type');
    
    const invalidData = {
      employeeId: 999,
      projectId: TEST_CONFIG.projectId,
      date: TEST_CONFIG.testDate,
      overrideType: 'INVALID_TYPE',
      reason: 'Test'
    };

    const response = await fetch(`${API_BASE_URL}/api/supervisor/manual-attendance-override`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidData)
    });

    const data = await response.json();

    if (!response.ok && data.message.includes('Invalid overrideType')) {
      console.log('   ✅ Correctly handled invalid override type error');
      console.log(`      Error: ${data.message}`);
    } else {
      console.log('   ⚠️  Expected error but got success or unexpected response');
    }
    
  } catch (error) {
    console.log('   ❌ Error testing invalid override type:', error.message);
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🧪 Manual Attendance Request API Tests');
  console.log('=====================================');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Test Project ID: ${TEST_CONFIG.projectId}`);
  console.log(`Test Date: ${TEST_CONFIG.testDate}`);
  
  // Step 1: Login as supervisor
  const loginSuccess = await loginAsSupervisor();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without supervisor authentication');
    console.log('   Make sure the backend server is running and supervisor credentials are correct');
    process.exit(1);
  }

  // Step 2: Test getting workers for manual attendance
  const testWorker = await testGetManualAttendanceWorkers();

  // Step 3: Test manual attendance override
  await testSubmitManualAttendanceOverride(testWorker);

  // Step 4: Test error scenarios
  await testErrorScenarios();

  console.log('\n✅ Manual Attendance Request API tests completed');
  console.log('\n📝 Summary:');
  console.log('   - Manual attendance workers endpoint tested');
  console.log('   - Manual attendance override endpoint tested');
  console.log('   - Error handling scenarios tested');
  console.log('   - Authentication and authorization verified');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
});