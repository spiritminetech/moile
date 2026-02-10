import axios from 'axios';

const BASE_URL = 'http://192.168.0.3:5002';

async function testActiveTasksAPI() {
  try {
    console.log('=== Testing Active Tasks API ===\n');

    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    console.log('✅ Login successful');
    console.log('Companies available:', loginResponse.data.companies.length);
    console.log();

    // Step 2: Select company
    console.log('Step 2: Selecting company...');
    const selectCompanyResponse = await axios.post(`${BASE_URL}/api/auth/select-company`, {
      userId: loginResponse.data.userId,
      companyId: 1
    });

    const token = selectCompanyResponse.data.token;
    console.log('✅ Company selected');
    console.log('Token received:', !!token);
    console.log();

    if (!token) {
      console.log('❌ No token received!');
      console.log('Response:', JSON.stringify(selectCompanyResponse.data, null, 2));
      return;
    }

    // Step 3: Call active-tasks API
    console.log('Step 3: Getting active tasks for project 1...');
    console.log(`URL: ${BASE_URL}/api/supervisor/active-tasks/1\n`);

    const response = await axios.get(
      `${BASE_URL}/api/supervisor/active-tasks/1`,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    if (response.data.activeTasks && response.data.activeTasks.length > 0) {
      console.log('\n✅ SUCCESS! Found', response.data.activeTasks.length, 'active tasks');
    } else {
      console.log('\n❌ PROBLEM: No active tasks returned');
      console.log('\nLet me check the database directly...');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testActiveTasksAPI();
