// Simple test for Late/Absent Workers API endpoint
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

async function testLateAbsentWorkersAPI() {
  try {
    console.log('\n📊 Testing Late/Absent Workers API...');
    
    // Test with project ID 1 and today's date
    const projectId = 1;
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const options = {
      hostname: 'localhost',
      port: 5002,
      path: `/api/supervisor/late-absent-workers?projectId=${projectId}&date=${date}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options);

    if (response.status === 200) {
      console.log('✅ API Response received');
      console.log('📈 Summary:', response.data.summary);
      console.log('⏰ Late Workers:', response.data.lateWorkers?.length || 0);
      console.log('❌ Absent Workers:', response.data.absentWorkers?.length || 0);
      console.log('🏗️ Project:', response.data.projectName);

      if (response.data.lateWorkers?.length > 0) {
        console.log('\n⏰ Late Workers Details:');
        response.data.lateWorkers.forEach((worker, index) => {
          console.log(`  ${index + 1}. ${worker.workerName} - ${worker.minutesLate} minutes late`);
        });
      }

      if (response.data.absentWorkers?.length > 0) {
        console.log('\n❌ Absent Workers Details:');
        response.data.absentWorkers.forEach((worker, index) => {
          console.log(`  ${index + 1}. ${worker.workerName} - ${worker.role}`);
        });
      }

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

async function runTests() {
  console.log('🚀 Starting Late/Absent Workers API Tests\n');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Step 2: Test Late/Absent Workers API
  const workersData = await testLateAbsentWorkersAPI();

  console.log('\n✅ Tests completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. Access the UI at: http://localhost:3000/supervisor/late-absent');
  console.log('2. Select a project and date to view late/absent workers');
  console.log('3. Use the Send Alert feature to notify workers');
}

// Run the tests
runTests().catch(console.error);