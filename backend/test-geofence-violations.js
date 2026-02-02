// Simple test for Geofence Violations API endpoint
import http from 'http';

const API_BASE_URL = 'http://localhost:5002';

// Test credentials - replace with actual supervisor credentials
const TEST_CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'password123'
};

let authToken = '';

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function login() {
  try {
    console.log('🔐 Logging in as supervisor...');
    
    const options = {
      hostname: 'localhost',
      port: 5002,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options, TEST_CREDENTIALS);
    
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed - no token received');
      return false;
    }
  } catch (error) {
    console.log('❌ Login failed:', error.message);
    return false;
  }
}

async function testGeofenceViolationsAPI() {
  try {
    console.log('\n🌍 Testing Geofence Violations API...');
    
    // Test with project ID 1 and 24 hour range
    const projectId = 1;
    const timeRange = 24;
    const status = 'all';
    
    const options = {
      hostname: 'localhost',
      port: 5002,
      path: `/api/supervisor/geofence-violations?projectId=${projectId}&timeRange=${timeRange}&status=${status}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options);

    if (response.status === 200) {
      console.log('✅ API Response received');
      console.log('📊 Summary:', response.data.summary);
      console.log('🚨 Total Violations:', response.data.violations?.length || 0);
      console.log('👥 Workers Involved:', response.data.violationsByWorker?.length || 0);
      console.log('🏗️ Project:', response.data.projectName);

      if (response.data.violations?.length > 0) {
        console.log('\n🚨 Recent Violations:');
        response.data.violations.slice(0, 5).forEach((violation, index) => {
          console.log(`  ${index + 1}. ${violation.workerName} - ${violation.distance}m away (${violation.isActive ? 'ACTIVE' : 'RESOLVED'})`);
        });
      }

      if (response.data.violationsByWorker?.length > 0) {
        console.log('\n👥 Worker Summary:');
        response.data.violationsByWorker.forEach((worker, index) => {
          console.log(`  ${index + 1}. ${worker.workerName} - ${worker.totalViolations} violations (${worker.activeViolations} active)`);
        });
      }

      // Test different time ranges
      console.log('\n🕐 Testing different time ranges...');
      await testTimeRange(projectId, 1, 'Last 1 hour');
      await testTimeRange(projectId, 6, 'Last 6 hours');
      await testTimeRange(projectId, 72, 'Last 3 days');

      // Test status filters
      console.log('\n🔍 Testing status filters...');
      await testStatusFilter(projectId, 'active', 'Active violations only');
      await testStatusFilter(projectId, 'resolved', 'Resolved violations only');

      return response.data;
    } else {
      console.log('❌ API Test failed:', response.status, response.data);
      return null;
    }

  } catch (error) {
    console.log('❌ API Test failed:', error.message);
    return null;
  }
}

async function testTimeRange(projectId, timeRange, description) {
  try {
    const options = {
      hostname: 'localhost',
      port: 5002,
      path: `/api/supervisor/geofence-violations?projectId=${projectId}&timeRange=${timeRange}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options);
    if (response.status === 200) {
      console.log(`  ✅ ${description}: ${response.data.violations?.length || 0} violations`);
    } else {
      console.log(`  ❌ ${description}: Failed (${response.status})`);
    }
  } catch (error) {
    console.log(`  ❌ ${description}: Error - ${error.message}`);
  }
}

async function testStatusFilter(projectId, status, description) {
  try {
    const options = {
      hostname: 'localhost',
      port: 5002,
      path: `/api/supervisor/geofence-violations?projectId=${projectId}&status=${status}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options);
    if (response.status === 200) {
      console.log(`  ✅ ${description}: ${response.data.violations?.length || 0} violations`);
    } else {
      console.log(`  ❌ ${description}: Failed (${response.status})`);
    }
  } catch (error) {
    console.log(`  ❌ ${description}: Error - ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Geofence Violations API Tests\n');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Step 2: Test Geofence Violations API
  const violationsData = await testGeofenceViolationsAPI();

  console.log('\n✅ Tests completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. Access the UI at: http://localhost:3000/supervisor/geofence-violations');
  console.log('2. Select a project and time range to view violations');
  console.log('3. Monitor real-time violations with auto-refresh');
  console.log('4. Use the Send Alert feature to notify workers outside geofence');
}

// Run the tests
runTests().catch(console.error);