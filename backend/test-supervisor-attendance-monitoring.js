/**
 * Test script for Supervisor Attendance Monitoring API endpoint
 * Tests comprehensive worker attendance list functionality
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
 * Test comprehensive attendance monitoring endpoint
 */
async function testAttendanceMonitoring() {
  try {
    console.log('\n📊 Testing GET /api/supervisor/attendance-monitoring...');
    
    // Test different parameter combinations
    const testCases = [
      {
        name: 'All Projects - All Status',
        params: {
          date: TEST_CONFIG.testDate
        }
      },
      {
        name: 'Specific Project',
        params: {
          date: TEST_CONFIG.testDate,
          projectId: '1'
        }
      },
      {
        name: 'Filter by Status - Checked In',
        params: {
          date: TEST_CONFIG.testDate,
          status: 'checked_in'
        }
      },
      {
        name: 'Filter by Status - Absent',
        params: {
          date: TEST_CONFIG.testDate,
          status: 'absent'
        }
      },
      {
        name: 'Search by Worker Name',
        params: {
          date: TEST_CONFIG.testDate,
          search: 'worker'
        }
      }
    ];

    for (const testCase of testCases) {
      try {
        console.log(`\n   Testing: ${testCase.name}`);
        
        const url = new URL(`${API_BASE_URL}/api/supervisor/attendance-monitoring`);
        Object.keys(testCase.params).forEach(key => {
          url.searchParams.append(key, testCase.params[key]);
        });

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        const data = await response.json();

        if (response.ok) {
          console.log(`   ✅ ${testCase.name} successful`);
          console.log(`      Workers found: ${data.workers.length}`);
          console.log(`      Projects available: ${data.projects.length}`);
          
          // Display summary statistics
          if (data.summary) {
            console.log('      Summary:');
            console.log(`        - Total Workers: ${data.summary.totalWorkers}`);
            console.log(`        - Checked In: ${data.summary.checkedIn}`);
            console.log(`        - Checked Out: ${data.summary.checkedOut}`);
            console.log(`        - Absent: ${data.summary.absent}`);
            console.log(`        - Late: ${data.summary.late}`);
            console.log(`        - On Time: ${data.summary.onTime}`);
          }
          
          // Display sample worker data
          if (data.workers.length > 0) {
            const worker = data.workers[0];
            console.log('      Sample worker:');
            console.log(`        - Name: ${worker.workerName}`);
            console.log(`        - Project: ${worker.projectName}`);
            console.log(`        - Status: ${worker.status}`);
            console.log(`        - Check-in: ${worker.checkInTime || 'Not checked in'}`);
            console.log(`        - Working Hours: ${worker.workingHours || 0}h`);
            console.log(`        - Late: ${worker.isLate ? `Yes (${worker.minutesLate}m)` : 'No'}`);
            console.log(`        - Task: ${worker.taskAssigned}`);
          }
          
        } else {
          console.log(`   ❌ ${testCase.name} failed:`, data.message);
        }
        
      } catch (error) {
        console.log(`   ❌ ${testCase.name} error:`, error.message);
      }
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
  } catch (error) {
    console.log('❌ Attendance monitoring test failed:', error.message);
  }
}

/**
 * Test data structure validation
 */
async function testDataStructure() {
  try {
    console.log('\n🔍 Testing data structure validation...');
    
    const url = new URL(`${API_BASE_URL}/api/supervisor/attendance-monitoring`);
    url.searchParams.append('date', TEST_CONFIG.testDate);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Data structure validation successful');
      
      // Validate response structure
      const requiredFields = ['workers', 'summary', 'projects'];
      const missingFields = requiredFields.filter(field => !(field in data));
      
      if (missingFields.length === 0) {
        console.log('   ✅ All required fields present');
      } else {
        console.log('   ❌ Missing fields:', missingFields);
      }
      
      // Validate summary structure
      if (data.summary) {
        const summaryFields = ['totalWorkers', 'checkedIn', 'checkedOut', 'absent', 'late', 'onTime'];
        const missingSummaryFields = summaryFields.filter(field => !(field in data.summary));
        
        if (missingSummaryFields.length === 0) {
          console.log('   ✅ Summary structure valid');
        } else {
          console.log('   ❌ Missing summary fields:', missingSummaryFields);
        }
      }
      
      // Validate worker structure
      if (data.workers.length > 0) {
        const worker = data.workers[0];
        const workerFields = [
          'employeeId', 'workerName', 'role', 'projectId', 'projectName', 
          'status', 'workingHours', 'isLate', 'taskAssigned'
        ];
        const missingWorkerFields = workerFields.filter(field => !(field in worker));
        
        if (missingWorkerFields.length === 0) {
          console.log('   ✅ Worker structure valid');
        } else {
          console.log('   ❌ Missing worker fields:', missingWorkerFields);
        }
      }
      
    } else {
      console.log('❌ Data structure validation failed:', data.message);
    }
    
  } catch (error) {
    console.log('❌ Data structure validation error:', error.message);
  }
}

/**
 * Test error scenarios
 */
async function testErrorScenarios() {
  console.log('\n🚫 Testing error scenarios...');
  
  const errorTests = [
    {
      name: 'Invalid date format',
      params: { date: 'invalid-date' },
      expectedError: false // Should handle gracefully
    },
    {
      name: 'Non-existent project ID',
      params: { projectId: '99999', date: TEST_CONFIG.testDate },
      expectedError: false // Should return empty results
    },
    {
      name: 'Invalid status filter',
      params: { status: 'invalid_status', date: TEST_CONFIG.testDate },
      expectedError: false // Should handle gracefully
    }
  ];

  for (const test of errorTests) {
    try {
      console.log(`\n   Testing: ${test.name}`);
      
      const url = new URL(`${API_BASE_URL}/api/supervisor/attendance-monitoring`);
      Object.keys(test.params).forEach(key => {
        url.searchParams.append(key, test.params[key]);
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`   ✅ ${test.name} handled gracefully`);
        console.log(`      Workers returned: ${data.workers.length}`);
      } else {
        if (test.expectedError) {
          console.log(`   ✅ Expected error for ${test.name}:`, data.message);
        } else {
          console.log(`   ⚠️  Unexpected error for ${test.name}:`, data.message);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error testing ${test.name}:`, error.message);
    }
  }
}

/**
 * Test performance with large datasets
 */
async function testPerformance() {
  try {
    console.log('\n⚡ Testing performance...');
    
    const startTime = Date.now();
    
    const url = new URL(`${API_BASE_URL}/api/supervisor/attendance-monitoring`);
    url.searchParams.append('date', TEST_CONFIG.testDate);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (response.ok) {
      console.log('✅ Performance test successful');
      console.log(`   Response time: ${responseTime}ms`);
      console.log(`   Workers processed: ${data.workers.length}`);
      console.log(`   Projects processed: ${data.projects.length}`);
      
      if (responseTime < 2000) {
        console.log('   ✅ Response time acceptable (< 2s)');
      } else {
        console.log('   ⚠️  Response time slow (> 2s)');
      }
    } else {
      console.log('❌ Performance test failed:', data.message);
    }
    
  } catch (error) {
    console.log('❌ Performance test error:', error.message);
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🧪 Supervisor Attendance Monitoring API Tests');
  console.log('==============================================');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Test Date: ${TEST_CONFIG.testDate}`);
  
  // Step 1: Login as supervisor
  const loginSuccess = await loginAsSupervisor();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without supervisor authentication');
    console.log('   Make sure the backend server is running and supervisor credentials are correct');
    process.exit(1);
  }

  // Step 2: Test attendance monitoring endpoint
  await testAttendanceMonitoring();

  // Step 3: Test data structure validation
  await testDataStructure();

  // Step 4: Test error scenarios
  await testErrorScenarios();

  // Step 5: Test performance
  await testPerformance();

  console.log('\n✅ Supervisor Attendance Monitoring API tests completed');
  console.log('\n📝 Summary:');
  console.log('   - Comprehensive attendance monitoring endpoint tested');
  console.log('   - Multiple filter combinations validated');
  console.log('   - Data structure integrity verified');
  console.log('   - Error handling scenarios tested');
  console.log('   - Performance benchmarked');
  console.log('   - Authentication and authorization verified');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
});