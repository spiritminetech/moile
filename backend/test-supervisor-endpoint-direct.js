import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5002';

async function testSupervisorEndpointDirect() {
  console.log('🔍 Testing Supervisor Endpoint Directly...\n');

  try {
    // Step 1: Login to get token
    console.log('Step 1: Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'supervisor@company.com',
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

    // Step 2: Test the endpoint with detailed error handling
    console.log('\nStep 2: Testing supervisor notification overview...');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('Request details:', {
      url: `${API_BASE_URL}/api/supervisor/notifications/overview`,
      headers: {
        'Authorization': `Bearer ${token.substring(0, 20)}...`,
        'Content-Type': 'application/json'
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/supervisor/notifications/overview`, {
      method: 'GET',
      headers
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseData = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log('Response data:', JSON.stringify(responseData, null, 2));
    } else {
      console.error('❌ Failed');
      console.error('Error data:', JSON.stringify(responseData, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the backend server is running on port 5002');
    }
  }
}

// Run the test
testSupervisorEndpointDirect()
  .then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });