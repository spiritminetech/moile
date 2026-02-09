import axios from 'axios';

const BASE_URL = 'http://192.168.0.3:5002/api';

async function testSupervisorProfile() {
  try {
    console.log('🔐 Testing Supervisor Profile API...\n');

    // Test with supervisor@gmail.com (userId: 4)
    console.log('1️⃣ Login as supervisor@gmail.com...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 50)}...`);
    console.log(`   User ID: ${loginResponse.data.user.userId}`);
    console.log(`   Role: ${loginResponse.data.user.role}`);

    // Test profile endpoint
    console.log('\n2️⃣ Fetching supervisor profile...');
    const profileResponse = await axios.get(`${BASE_URL}/supervisor/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Profile fetched successfully!');
    console.log('\n📋 Profile Data:');
    console.log(JSON.stringify(profileResponse.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status);
      console.error('   Message:', error.response.data.message);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testSupervisorProfile();
