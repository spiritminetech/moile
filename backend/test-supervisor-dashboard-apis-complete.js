import axios from 'axios';

const API_BASE_URL = 'http://localhost:5002/api';

// Test configuration
const TEST_CONFIG = {
  supervisorToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwNywiZW1haWwiOiJzdXBlcnZpc29yQGdtYWlsLmNvbSIsInJvbGUiOiJzdXBlcnZpc29yIiwiaWF0IjoxNzM4NzQ5NzI5LCJleHAiOjE3Mzg4MzYxMjl9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
  projectId: 1,
  testDate: '2025-02-05'
};

/**
 * Test all supervisor dashboard APIs
 */
async function testSupervisorDashboardAPIs() {
  console.log('🧪 Testing Supervisor Dashboard APIs Integration...\n');

  const results = {
    passed: 0,
    failed: 0,
    endpoints: []
  };

  // Define all expected endpoints
  const endpoints = [
    {
      name: 'Dashboard Data',
      method: 'GET',
      url: '/supervisor/dashboard',
      description: 'Main dashboard data with all metrics',
      requiresAuth: false
    },
    {
      name: 'Assigned Projects',
      method: 'GET', 
      url: '/supervisor/projects',
      description: 'Projects assigned to supervisor',
      requiresAuth: false
    },
    {
      name: 'Today\'s Workforce Count',
      method: 'GET',
      url: '/supervisor/workers-assigned',
      description: 'Workers assigned to projects',
      requiresAuth: false,
      params: { projectId: TEST_CONFIG.projectId, date: TEST_CONFIG.testDate }
    },
    {
      name: 'Attendance Summary',
      method: 'GET',
      url: '/supervisor/attendance-monitoring',
      description: 'Comprehensive attendance monitoring data',
      requiresAuth: false,
      params: { projectId: TEST_CONFIG.projectId, date: TEST_CONFIG.testDate }
    },
    {
      name: 'Alerts (Absence)',
      method: 'GET',
      url: '/supervisor/late-absent-workers',
      description: 'Late and absent workers alerts',
      requiresAuth: false,
      params: { projectId: TEST_CONFIG.projectId, date: TEST_CONFIG.testDate }
    },
    {
      name: 'Alerts (Geo-fence)',
      method: 'GET',
      url: '/supervisor/geofence-violations',
      description: 'Real-time geofence violations',
      requiresAuth: false,
      params: { projectId: TEST_CONFIG.projectId, timeRange: 'today' }
    }
  ];

  // Test each endpoint
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint, results);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUPERVISOR DASHBOARD API TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  // Check for missing endpoints
  console.log('\n📋 ENDPOINT STATUS:');
  results.endpoints.forEach(ep => {
    const status = ep.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} ${ep.name}: ${ep.description}`);
    if (ep.status === 'FAIL') {
      console.log(`   Error: ${ep.error}`);
    }
  });

  // Check for pending approvals endpoint specifically
  console.log('\n🔍 CHECKING FOR MISSING ENDPOINTS:');
  const hasPendingApprovals = await checkPendingApprovalsEndpoint();
  if (!hasPendingApprovals) {
    console.log('❌ Missing: GET /supervisor/pending-approvals - Pending Approvals count/summary');
    console.log('   Note: Pending approvals data is included in dashboard endpoint');
  } else {
    console.log('✅ Pending approvals endpoint found');
  }

  return results;
}

/**
 * Test individual endpoint
 */
async function testEndpoint(endpoint, results) {
  console.log(`\n🧪 Testing: ${endpoint.name}`);
  console.log(`   ${endpoint.method} ${endpoint.url}`);

  try {
    const config = {
      method: endpoint.method.toLowerCase(),
      url: `${API_BASE_URL}${endpoint.url}`,
      timeout: 10000
    };

    // Add query parameters if specified
    if (endpoint.params) {
      config.params = endpoint.params;
    }

    // Add authorization if required
    if (endpoint.requiresAuth) {
      config.headers = {
        'Authorization': `Bearer ${TEST_CONFIG.supervisorToken}`
      };
    }

    const response = await axios(config);

    if (response.status === 200) {
      console.log(`   ✅ Status: ${response.status}`);
      
      // Validate response structure based on endpoint
      const validationResult = validateResponse(endpoint, response.data);
      if (validationResult.valid) {
        console.log(`   ✅ Response structure: Valid`);
        results.passed++;
        results.endpoints.push({
          name: endpoint.name,
          status: 'PASS',
          description: endpoint.description
        });
      } else {
        console.log(`   ❌ Response structure: Invalid - ${validationResult.error}`);
        results.failed++;
        results.endpoints.push({
          name: endpoint.name,
          status: 'FAIL',
          description: endpoint.description,
          error: `Invalid response structure: ${validationResult.error}`
        });
      }
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }

  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    results.failed++;
    results.endpoints.push({
      name: endpoint.name,
      status: 'FAIL',
      description: endpoint.description,
      error: error.message
    });
  }
}

/**
 * Validate response structure based on endpoint type
 */
function validateResponse(endpoint, response) {
  try {
    // Handle wrapped responses with success/data structure
    const data = response.data || response;
    
    switch (endpoint.url) {
      case '/supervisor/dashboard':
        if (!data.pendingApprovals || !data.teamOverview || !data.taskMetrics) {
          return { valid: false, error: 'Missing required dashboard sections' };
        }
        break;
      
      case '/supervisor/projects':
        if (!Array.isArray(data)) {
          return { valid: false, error: 'Expected array of projects' };
        }
        break;
      
      case '/supervisor/workers-assigned':
        if (!data.workers || !Array.isArray(data.workers)) {
          return { valid: false, error: 'Expected workers array' };
        }
        break;
      
      case '/supervisor/attendance-monitoring':
        if (!data.summary || !data.workers) {
          return { valid: false, error: 'Missing attendance summary or workers data' };
        }
        break;
      
      case '/supervisor/late-absent-workers':
        if (!data.lateWorkers || !data.absentWorkers) {
          return { valid: false, error: 'Missing late or absent workers data' };
        }
        break;
      
      case '/supervisor/geofence-violations':
        if (!data.violations) {
          return { valid: false, error: 'Missing violations data' };
        }
        break;
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Check if pending approvals endpoint exists
 */
async function checkPendingApprovalsEndpoint() {
  try {
    const response = await axios.get(`${API_BASE_URL}/supervisor/pending-approvals`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    // Check if it's a 404 (not found) vs other errors
    if (error.response && error.response.status === 404) {
      return false;
    }
    // For other errors, assume endpoint exists but has issues
    return true;
  }
}

/**
 * Test specific dashboard data structure
 */
async function testDashboardDataStructure() {
  console.log('\n🔍 DETAILED DASHBOARD DATA STRUCTURE TEST:');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/supervisor/dashboard`);
    const data = response.data.data || response.data;
    
    console.log('\n📋 Dashboard Structure:');
    console.log('- pendingApprovals:', data.pendingApprovals ? '✅' : '❌');
    console.log('- teamOverview:', data.teamOverview ? '✅' : '❌');
    console.log('- taskMetrics:', data.taskMetrics ? '✅' : '❌');
    console.log('- attendanceMetrics:', data.attendanceMetrics ? '✅' : '❌');
    console.log('- alerts:', data.alerts ? '✅' : '❌');
    console.log('- recentActivity:', data.recentActivity ? '✅' : '❌');
    
    if (data.pendingApprovals) {
      console.log('\n📊 Pending Approvals Details:');
      console.log('- leaveRequests:', data.pendingApprovals.leaveRequests || 0);
      console.log('- materialRequests:', data.pendingApprovals.materialRequests || 0);
      console.log('- toolRequests:', data.pendingApprovals.toolRequests || 0);
      console.log('- urgent:', data.pendingApprovals.urgent || 0);
      console.log('- total:', data.pendingApprovals.total || 0);
    }
    
  } catch (error) {
    console.log('❌ Failed to test dashboard structure:', error.message);
  }
}

// Run the tests
async function main() {
  try {
    const results = await testSupervisorDashboardAPIs();
    await testDashboardDataStructure();
    
    console.log('\n🎯 INTEGRATION STATUS:');
    if (results.failed === 0) {
      console.log('✅ All supervisor dashboard APIs are properly integrated!');
    } else {
      console.log(`❌ ${results.failed} API(s) need attention`);
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

main();