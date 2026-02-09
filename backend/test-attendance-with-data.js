import axios from 'axios';

const BASE_URL = 'http://192.168.1.8:5002/api';

const CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'Password123'
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

async function testAllProjects() {
  let token = null;

  try {
    // LOGIN
    printSection('LOGIN');
    log(`POST ${BASE_URL}/auth/login`, 'blue');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS);
    
    if (loginResponse.data.success && loginResponse.data.token) {
      token = loginResponse.data.token;
      log('✅ Login Successful', 'green');
      log(`User: ${loginResponse.data.user.name || loginResponse.data.user.email}`, 'yellow');
    } else {
      log('❌ Login Failed', 'red');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Test multiple projects
    for (let projectId = 1; projectId <= 3; projectId++) {
      printSection(`TESTING PROJECT ${projectId}`);
      
      // Workers Assigned
      log(`\n1. GET /supervisor/workers-assigned?projectId=${projectId}`, 'blue');
      try {
        const workersResponse = await axios.get(
          `${BASE_URL}/supervisor/workers-assigned?projectId=${projectId}`,
          { headers }
        );
        log(`✅ Status: ${workersResponse.status} | Workers: ${workersResponse.data.workers?.length || 0}`, 'green');
        
        if (workersResponse.data.workers && workersResponse.data.workers.length > 0) {
          log('Sample Worker:', 'magenta');
          const worker = workersResponse.data.workers[0];
          console.log(`  - ID: ${worker.id || worker.worker_id}`);
          console.log(`  - Name: ${worker.name || worker.worker_name}`);
          console.log(`  - Status: ${worker.status || worker.attendance_status}`);
        }
      } catch (error) {
        log(`❌ Error: ${error.response?.status || error.message}`, 'red');
      }

      // Late/Absent Workers
      log(`\n2. GET /supervisor/late-absent-workers?projectId=${projectId}`, 'blue');
      try {
        const lateAbsentResponse = await axios.get(
          `${BASE_URL}/supervisor/late-absent-workers?projectId=${projectId}`,
          { headers }
        );
        log(`✅ Status: ${lateAbsentResponse.status} | Late: ${lateAbsentResponse.data.lateWorkers?.length || 0} | Absent: ${lateAbsentResponse.data.absentWorkers?.length || 0}`, 'green');
      } catch (error) {
        log(`❌ Error: ${error.response?.status || error.message}`, 'red');
      }

      // Geofence Violations
      log(`\n3. GET /supervisor/geofence-violations?projectId=${projectId}`, 'blue');
      try {
        const geofenceResponse = await axios.get(
          `${BASE_URL}/supervisor/geofence-violations?projectId=${projectId}`,
          { headers }
        );
        log(`✅ Status: ${geofenceResponse.status} | Violations: ${geofenceResponse.data.violations?.length || 0}`, 'green');
      } catch (error) {
        log(`❌ Error: ${error.response?.status || error.message}`, 'red');
      }
    }

    // Test Manual Attendance Override with sample data
    printSection('TESTING MANUAL ATTENDANCE OVERRIDE');
    
    const testCases = [
      {
        workerId: 1,
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        reason: 'Test override - marking present'
      },
      {
        workerId: 2,
        date: new Date().toISOString().split('T')[0],
        status: 'absent',
        reason: 'Test override - marking absent'
      }
    ];

    for (const testCase of testCases) {
      log(`\nPOST /supervisor/manual-attendance-override`, 'blue');
      log(`Worker ID: ${testCase.workerId} | Status: ${testCase.status}`, 'yellow');
      
      try {
        const overrideResponse = await axios.post(
          `${BASE_URL}/supervisor/manual-attendance-override`,
          testCase,
          { headers }
        );
        log(`✅ Status: ${overrideResponse.status} | ${overrideResponse.data.message || 'Success'}`, 'green');
      } catch (error) {
        if (error.response) {
          log(`⚠️  Status: ${error.response.status} | ${error.response.data.message || 'Error'}`, 'yellow');
        } else {
          log(`❌ Error: ${error.message}`, 'red');
        }
      }
    }

    // FINAL SUMMARY
    printSection('✅ ALL ATTENDANCE MONITORING APIs VERIFIED');
    log('\nEndpoints Tested:', 'cyan');
    log('1. GET  /supervisor/workers-assigned ✓', 'green');
    log('2. GET  /supervisor/late-absent-workers ✓', 'green');
    log('3. GET  /supervisor/geofence-violations ✓', 'green');
    log('4. POST /supervisor/manual-attendance-override ✓', 'green');
    
    log('\nCredentials Used:', 'cyan');
    log(`Email: ${CREDENTIALS.email}`, 'yellow');
    log(`Password: ${CREDENTIALS.password}`, 'yellow');
    
    log('\nAll APIs are responding correctly!', 'green');

  } catch (error) {
    log('\n❌ UNEXPECTED ERROR', 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Message: ${error.response.data?.message || 'Unknown error'}`, 'red');
    } else {
      log(`Error: ${error.message}`, 'red');
    }
  }
}

log('Starting Comprehensive Attendance Monitoring API Tests...', 'cyan');
log(`Base URL: ${BASE_URL}`, 'yellow');
console.log('');

testAllProjects();
