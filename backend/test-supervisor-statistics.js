import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5002';

async function testSupervisorStatistics() {
  console.log('🔍 Testing Supervisor Statistics Endpoint...\n');

  try {
    // Step 1: Login
    console.log('Step 1: Logging in as supervisor...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'supervisor@gmail.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();

    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }

    console.log('✅ Login successful');
    const token = loginData.token;

    // Step 2: Test statistics endpoint
    console.log('\nStep 2: Testing notification statistics...');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const statisticsResponse = await fetch(`${API_BASE_URL}/api/supervisor/notifications/statistics`, { 
      headers 
    });
    
    const statisticsData = await statisticsResponse.json();

    if (statisticsResponse.ok) {
      console.log('✅ Statistics endpoint successful!');
      console.log('Response:', JSON.stringify(statisticsData, null, 2));
    } else {
      console.error('❌ Statistics endpoint failed');
      console.error('Status:', statisticsResponse.status);
      console.error('Error:', statisticsData);
    }

    // Step 3: Test overview endpoint as well
    console.log('\nStep 3: Testing notification overview...');
    
    const overviewResponse = await fetch(`${API_BASE_URL}/api/supervisor/notifications/overview`, { 
      headers 
    });
    
    const overviewData = await overviewResponse.json();

    if (overviewResponse.ok) {
      console.log('✅ Overview endpoint successful!');
      console.log('Response:', JSON.stringify(overviewData, null, 2));
    } else {
      console.error('❌ Overview endpoint failed');
      console.error('Status:', overviewResponse.status);
      console.error('Error:', overviewData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSupervisorStatistics()
  .then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });