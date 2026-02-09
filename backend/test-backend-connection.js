import axios from 'axios';

const BASE_URL = 'http://localhost:5002/api';

console.log('Testing backend connection...\n');

// Test 1: Health check
async function testHealth() {
  try {
    console.log('1. Testing health endpoint...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed');
    console.log('   Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Health check failed');
    console.log('   Error:', error.message);
    console.log('   Code:', error.code);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    return false;
  }
}

// Test 2: Login
async function testLogin() {
  try {
    console.log('\n2. Testing login endpoint...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'Password123'
    });
    console.log('✅ Login successful');
    console.log('   Token:', response.data.token?.substring(0, 20) + '...');
    console.log('   User:', response.data.user?.email);
    return response.data.token;
  } catch (error) {
    console.log('❌ Login failed');
    console.log('   Error:', error.message);
    console.log('   Code:', error.code);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Test 3: Daily progress endpoint
async function testDailyProgress(token) {
  try {
    console.log('\n3. Testing daily progress endpoint...');
    const response = await axios.post(
      `${BASE_URL}/supervisor/daily-progress`,
      {
        projectId: 1,
        remarks: 'Test remarks',
        issues: 'Test issues'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Daily progress submission successful');
    console.log('   Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Daily progress submission failed');
    console.log('   Error:', error.message);
    console.log('   Code:', error.code);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Run tests
async function runTests() {
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('\n❌ Backend is not accessible. Please ensure:');
    console.log('   1. Backend server is running (npm start in backend folder)');
    console.log('   2. Server is listening on http://localhost:5000');
    console.log('   3. No firewall is blocking the connection');
    return;
  }

  const token = await testLogin();
  if (!token) {
    console.log('\n❌ Login failed. Cannot proceed with other tests.');
    return;
  }

  await testDailyProgress(token);
  
  console.log('\n✅ All basic tests completed');
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
