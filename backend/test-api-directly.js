import axios from 'axios';

async function testApiDirectly() {
  try {
    // First, login to get a token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'driver1@gmail.com',
      password: 'Password123@'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Test dashboard summary
    console.log('📊 Testing dashboard summary API...');
    const dashboardResponse = await axios.get('http://localhost:5002/api/driver/dashboard/summary', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Dashboard response:', JSON.stringify(dashboardResponse.data, null, 2));

    // Test transport tasks
    console.log('\n🚛 Testing transport tasks API...');
    const tasksResponse = await axios.get('http://localhost:5002/api/driver/transport-tasks', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Transport tasks response:', JSON.stringify(tasksResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testApiDirectly();
