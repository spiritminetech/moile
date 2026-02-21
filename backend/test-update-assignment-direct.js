import axios from 'axios';

const BASE_URL = 'http://192.168.1.6:5002/api';

async function testUpdateAssignment() {
  try {
    console.log('🧪 Testing Update Assignment Endpoint\n');

    // Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'Password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Test with a simple update (no location changes to avoid SiteChangeNotificationService)
    console.log('2️⃣ Testing simple priority update...');
    const updateData = {
      assignmentId: 2, // Use a known assignment ID
      changes: {
        priority: 'high'
      }
    };

    console.log('📤 Request:', JSON.stringify(updateData, null, 2));

    const response = await axios.put(
      `${BASE_URL}/supervisor/update-assignment`,
      updateData,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Success!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\n❌ Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received');
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testUpdateAssignment();
