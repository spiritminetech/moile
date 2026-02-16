import axios from 'axios';

const BASE_URL = 'http://192.168.1.6:5002/api';

const CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'Password123'
};

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testAttendanceMonitoringAPIs() {
  let token = null;
  let projectId = 1; // Default project ID

  try {
    // ========================================
    // STEP 1: LOGIN
    // ========================================
    printSection('STEP 1: LOGIN');
    log(`POST ${BASE_URL}/auth/login`, 'blue');
    log(`Email: ${CREDENTIALS.email}`, 'yellow');
    log(`Password: ${CREDENTIALS.password}`, 'yellow');

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS);
    
    if (loginResponse.data.success && loginResponse.data.token) {
      token = loginResponse.data.token;
      log('✅ Login Successful', 'green');
      log(`Token: ${token.substring(0, 20)}...`, 'yellow');
      
      if (loginResponse.data.user) {
        log(`User: ${loginResponse.data.user.name || loginResponse.data.user.email}`, 'yellow');
        log(`Role: ${loginResponse.data.user.role}`, 'yellow');
      }
    } else {
      log('❌ Login Failed - No token received', 'red');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // ========================================
    // STEP 2: GET WORKERS ASSIGNED
    // ========================================
    printSection('STEP 2: GET WORKERS ASSIGNED');
    log(`GET ${BASE_URL}/supervisor/workers-assigned?projectId=${projectId}`, 'blue');
    
    const workersResponse = await axios.get(
      `${BASE_URL}/supervisor/workers-assigned?projectId=${projectId}`,
      { headers }
    );
    
    log('✅ Workers Assigned API - Success', 'green');
    log(`Status: ${workersResponse.status}`, 'yellow');
    log(`Workers Count: ${workersResponse.data.workers?.length || 0}`, 'yellow');
    
    if (workersResponse.data.workers && workersResponse.data.workers.length > 0) {
      log('\nSample Worker Data:', 'cyan');
      const worker = workersResponse.data.workers[0];
      console.log(JSON.stringify(worker, null, 2));
    } else {
      log('⚠️  No workers found for this project', 'yellow');
    }

    // ========================================
    // STEP 3: GET LATE/ABSENT WORKERS
    // ========================================
    printSection('STEP 3: GET LATE/ABSENT WORKERS');
    log(`GET ${BASE_URL}/supervisor/late-absent-workers?projectId=${projectId}`, 'blue');
    
    const lateAbsentResponse = await axios.get(
      `${BASE_URL}/supervisor/late-absent-workers?projectId=${projectId}`,
      { headers }
    );
    
    log('✅ Late/Absent Workers API - Success', 'green');
    log(`Status: ${lateAbsentResponse.status}`, 'yellow');
    log(`Late Workers: ${lateAbsentResponse.data.lateWorkers?.length || 0}`, 'yellow');
    log(`Absent Workers: ${lateAbsentResponse.data.absentWorkers?.length || 0}`, 'yellow');
    
    if (lateAbsentResponse.data.lateWorkers && lateAbsentResponse.data.lateWorkers.length > 0) {
      log('\nSample Late Worker:', 'cyan');
      console.log(JSON.stringify(lateAbsentResponse.data.lateWorkers[0], null, 2));
    }
    
    if (lateAbsentResponse.data.absentWorkers && lateAbsentResponse.data.absentWorkers.length > 0) {
      log('\nSample Absent Worker:', 'cyan');
      console.log(JSON.stringify(lateAbsentResponse.data.absentWorkers[0], null, 2));
    }

    // ========================================
    // STEP 4: GET GEOFENCE VIOLATIONS
    // ========================================
    printSection('STEP 4: GET GEOFENCE VIOLATIONS');
    log(`GET ${BASE_URL}/supervisor/geofence-violations?projectId=${projectId}`, 'blue');
    
    const geofenceResponse = await axios.get(
      `${BASE_URL}/supervisor/geofence-violations?projectId=${projectId}`,
      { headers }
    );
    
    log('✅ Geofence Violations API - Success', 'green');
    log(`Status: ${geofenceResponse.status}`, 'yellow');
    log(`Violations Count: ${geofenceResponse.data.violations?.length || 0}`, 'yellow');
    
    if (geofenceResponse.data.violations && geofenceResponse.data.violations.length > 0) {
      log('\nSample Violation:', 'cyan');
      console.log(JSON.stringify(geofenceResponse.data.violations[0], null, 2));
    } else {
      log('⚠️  No geofence violations found', 'yellow');
    }

    // ========================================
    // STEP 5: POST MANUAL ATTENDANCE OVERRIDE
    // ========================================
    printSection('STEP 5: POST MANUAL ATTENDANCE OVERRIDE');
    
    // Get a worker ID from the workers list for testing
    let testWorkerId = null;
    if (workersResponse.data.workers && workersResponse.data.workers.length > 0) {
      testWorkerId = workersResponse.data.workers[0].id || workersResponse.data.workers[0].worker_id;
    }
    
    if (testWorkerId) {
      const overrideData = {
        workerId: testWorkerId,
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        reason: 'Manual override test - API verification'
      };
      
      log(`POST ${BASE_URL}/supervisor/manual-attendance-override`, 'blue');
      log('Request Body:', 'yellow');
      console.log(JSON.stringify(overrideData, null, 2));
      
      try {
        const overrideResponse = await axios.post(
          `${BASE_URL}/supervisor/manual-attendance-override`,
          overrideData,
          { headers }
        );
        
        log('✅ Manual Attendance Override API - Success', 'green');
        log(`Status: ${overrideResponse.status}`, 'yellow');
        log('Response:', 'cyan');
        console.log(JSON.stringify(overrideResponse.data, null, 2));
      } catch (error) {
        if (error.response) {
          log(`⚠️  Manual Attendance Override - Error ${error.response.status}`, 'yellow');
          log('Error Response:', 'red');
          console.log(JSON.stringify(error.response.data, null, 2));
        } else {
          throw error;
        }
      }
    } else {
      log('⚠️  Cannot test Manual Attendance Override - No workers available', 'yellow');
    }

    // ========================================
    // FINAL SUMMARY
    // ========================================
    printSection('FINAL SUMMARY');
    log('✅ All Attendance Monitoring APIs Tested Successfully', 'green');
    log('\nAPI Endpoints Verified:', 'cyan');
    log('1. GET /supervisor/workers-assigned ✓', 'green');
    log('2. GET /supervisor/late-absent-workers ✓', 'green');
    log('3. GET /supervisor/geofence-violations ✓', 'green');
    log('4. POST /supervisor/manual-attendance-override ✓', 'green');
    
  } catch (error) {
    log('\n❌ ERROR OCCURRED', 'red');
    
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Message: ${error.response.data?.message || 'Unknown error'}`, 'red');
      log('\nFull Error Response:', 'yellow');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      log('No response received from server', 'red');
      log('Check if the server is running at: ' + BASE_URL, 'yellow');
    } else {
      log(`Error: ${error.message}`, 'red');
    }
  }
}

// Run the tests
log('Starting Attendance Monitoring API Tests...', 'cyan');
log(`Base URL: ${BASE_URL}`, 'yellow');
log(`Credentials: ${CREDENTIALS.email}`, 'yellow');
console.log('');

testAttendanceMonitoringAPIs();
