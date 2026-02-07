/**
 * ========================================
 * DASHBOARD API VERIFICATION TEST
 * ========================================
 * 
 * This script tests all 6 dashboard APIs to ensure they are working correctly:
 * 1. GET /supervisor/projects - Assigned Projects
 * 2. GET /supervisor/workers-assigned - Today's Workforce Count
 * 3. GET /supervisor/attendance-monitoring - Attendance Summary
 * 4. GET /supervisor/late-absent-workers - Alerts (Absence)
 * 5. GET /supervisor/geofence-violations - Alerts (Geo-fence)
 * 6. GET /supervisor/pending-approvals - Pending Approvals count/summary
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';
const SUPERVISOR_CREDENTIALS = {
  username: 'supervisor4',
  password: 'password123'
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function printSubSection(title) {
  console.log('\n' + '-'.repeat(50));
  log(title, 'blue');
  console.log('-'.repeat(50));
}

async function testEndpoint(method, endpoint, description, params = {}, token = null, body = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data: body
    };

    log(`\n🔍 Testing: ${description}`, 'yellow');
    log(`   Endpoint: ${method} ${endpoint}`, 'cyan');
    if (Object.keys(params).length > 0) {
      log(`   Parameters: ${JSON.stringify(params)}`, 'cyan');
    }
    if (body) {
      log(`   Body: ${JSON.stringify(body)}`, 'cyan');
    }

    const response = await axios(config);
    
    log(`   ✅ Status: ${response.status} ${response.statusText}`, 'green');
    
    // Show data summary
    if (response.data) {
      if (response.data.success !== undefined) {
        log(`   Success: ${response.data.success}`, response.data.success ? 'green' : 'red');
      }
      
      if (response.data.data) {
        const data = response.data.data;
        
        // Handle different data structures
        if (Array.isArray(data)) {
          log(`   Data Count: ${data.length} items`, 'green');
          if (data.length > 0) {
            log(`   Sample: ${JSON.stringify(data[0]).substring(0, 100)}...`, 'cyan');
          }
        } else if (typeof data === 'object') {
          const keys = Object.keys(data);
          log(`   Data Keys: ${keys.join(', ')}`, 'green');
          
          // Show specific counts for dashboard data
          if (data.workers) log(`   Workers: ${Array.isArray(data.workers) ? data.workers.length : 'N/A'}`, 'cyan');
          if (data.projects) log(`   Projects: ${Array.isArray(data.projects) ? data.projects.length : 'N/A'}`, 'cyan');
          if (data.summary) log(`   Summary: ${JSON.stringify(data.summary)}`, 'cyan');
          if (data.totalPending !== undefined) log(`   Total Pending: ${data.totalPending}`, 'cyan');
          if (data.pendingByType) log(`   By Type: ${JSON.stringify(data.pendingByType)}`, 'cyan');
        }
      }
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    log(`   ❌ Error: ${error.response?.status || 'Network Error'}`, 'red');
    log(`   Message: ${error.response?.data?.message || error.message}`, 'red');
    return { success: false, error: error.response?.data || error.message };
  }
}

async function runTests() {
  printSection('🚀 DASHBOARD API VERIFICATION TEST');
  
  let token = null;
  let projectId = null;
  const results = {
    login: false,
    projects: false,
    workersAssigned: false,
    attendanceMonitoring: false,
    lateAbsentWorkers: false,
    geofenceViolations: false,
    pendingApprovals: false
  };

  try {
    // ========================================
    // STEP 1: LOGIN
    // ========================================
    printSubSection('STEP 1: LOGIN AS SUPERVISOR');
    
    const loginResult = await testEndpoint(
      'POST',
      '/auth/login',
      'Supervisor Login',
      {},
      null,
      SUPERVISOR_CREDENTIALS
    );

    if (loginResult.success && loginResult.data.token) {
      token = loginResult.data.token;
      results.login = true;
      log('\n✅ Login successful! Token obtained.', 'green');
    } else {
      log('\n❌ Login failed! Cannot proceed with tests.', 'red');
      return;
    }

    // ========================================
    // STEP 2: TEST DASHBOARD APIs
    // ========================================
    printSubSection('STEP 2: TEST DASHBOARD APIs');

    // API 1: Get Projects
    log('\n📋 API 1: GET /supervisor/projects', 'magenta');
    const projectsResult = await testEndpoint(
      'GET',
      '/supervisor/projects',
      'Assigned Projects',
      {},
      token
    );
    
    if (projectsResult.success) {
      results.projects = true;
      // Get first project ID for subsequent tests
      if (projectsResult.data?.data?.projects?.length > 0) {
        projectId = projectsResult.data.data.projects[0].id;
        log(`   📌 Using Project ID: ${projectId} for subsequent tests`, 'yellow');
      }
    }

    // API 2: Get Workers Assigned
    log('\n👥 API 2: GET /supervisor/workers-assigned', 'magenta');
    const workersResult = await testEndpoint(
      'GET',
      '/supervisor/workers-assigned',
      "Today's Workforce Count",
      projectId ? { projectId } : {},
      token
    );
    results.workersAssigned = workersResult.success;

    // API 3: Get Attendance Monitoring
    log('\n📊 API 3: GET /supervisor/attendance-monitoring', 'magenta');
    const attendanceResult = await testEndpoint(
      'GET',
      '/supervisor/attendance-monitoring',
      'Attendance Summary',
      projectId ? { projectId, date: new Date().toISOString().split('T')[0] } : {},
      token
    );
    results.attendanceMonitoring = attendanceResult.success;

    // API 4: Get Late/Absent Workers
    log('\n⚠️  API 4: GET /supervisor/late-absent-workers', 'magenta');
    const lateAbsentResult = await testEndpoint(
      'GET',
      '/supervisor/late-absent-workers',
      'Alerts (Absence)',
      projectId ? { projectId } : {},
      token
    );
    results.lateAbsentWorkers = lateAbsentResult.success;

    // API 5: Get Geofence Violations
    log('\n🌍 API 5: GET /supervisor/geofence-violations', 'magenta');
    const geofenceResult = await testEndpoint(
      'GET',
      '/supervisor/geofence-violations',
      'Alerts (Geo-fence)',
      projectId ? { projectId } : {},
      token
    );
    results.geofenceViolations = geofenceResult.success;

    // API 6: Get Pending Approvals
    log('\n📝 API 6: GET /supervisor/pending-approvals', 'magenta');
    const approvalsResult = await testEndpoint(
      'GET',
      '/supervisor/pending-approvals',
      'Pending Approvals count/summary',
      {},
      token
    );
    results.pendingApprovals = approvalsResult.success;

    // ========================================
    // STEP 3: SUMMARY
    // ========================================
    printSubSection('STEP 3: TEST RESULTS SUMMARY');

    console.log('\n📊 Dashboard API Status:');
    console.log('');
    log(`   ${results.login ? '✅' : '❌'} Login`, results.login ? 'green' : 'red');
    log(`   ${results.projects ? '✅' : '❌'} GET /supervisor/projects`, results.projects ? 'green' : 'red');
    log(`   ${results.workersAssigned ? '✅' : '❌'} GET /supervisor/workers-assigned`, results.workersAssigned ? 'green' : 'red');
    log(`   ${results.attendanceMonitoring ? '✅' : '❌'} GET /supervisor/attendance-monitoring`, results.attendanceMonitoring ? 'green' : 'red');
    log(`   ${results.lateAbsentWorkers ? '✅' : '❌'} GET /supervisor/late-absent-workers`, results.lateAbsentWorkers ? 'green' : 'red');
    log(`   ${results.geofenceViolations ? '✅' : '❌'} GET /supervisor/geofence-violations`, results.geofenceViolations ? 'green' : 'red');
    log(`   ${results.pendingApprovals ? '✅' : '❌'} GET /supervisor/pending-approvals`, results.pendingApprovals ? 'green' : 'red');

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r).length;
    const failedTests = totalTests - passedTests;

    console.log('\n' + '='.repeat(60));
    log(`\n📈 FINAL RESULTS: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'yellow');
    
    if (failedTests > 0) {
      log(`   ⚠️  ${failedTests} test(s) failed`, 'red');
    } else {
      log('   🎉 All dashboard APIs are working correctly!', 'green');
    }
    console.log('');

    // ========================================
    // STEP 4: RECOMMENDATIONS
    // ========================================
    if (failedTests > 0) {
      printSubSection('RECOMMENDATIONS');
      console.log('');
      
      if (!results.projects) {
        log('   ⚠️  Projects API failed - Check if supervisor has assigned projects', 'yellow');
      }
      if (!results.workersAssigned) {
        log('   ⚠️  Workers Assigned API failed - Requires valid projectId parameter', 'yellow');
      }
      if (!results.attendanceMonitoring) {
        log('   ⚠️  Attendance Monitoring API failed - Requires projectId and date parameters', 'yellow');
      }
      if (!results.lateAbsentWorkers) {
        log('   ⚠️  Late/Absent Workers API failed - Requires valid projectId parameter', 'yellow');
      }
      if (!results.geofenceViolations) {
        log('   ⚠️  Geofence Violations API failed - Requires valid projectId parameter', 'yellow');
      }
      if (!results.pendingApprovals) {
        log('   ⚠️  Pending Approvals API failed - Check implementation and authentication', 'yellow');
      }
      console.log('');
    }

  } catch (error) {
    log('\n❌ Unexpected error during testing:', 'red');
    console.error(error);
  }
}

// Run the tests
runTests().catch(console.error);
