// Simple authentication test
const axios = require('axios');

async function testBasicAuth() {
  try {
    console.log('Testing basic authentication...');
    
    const response = await axios.post('http://192.168.1.6:5002/api/auth/login', {
      email: 'worker@test.com',
      password: 'password123'
    });
    
    console.log('✅ Authentication successful');
    console.log('Response structure:', {
      success: response.data.success,
      hasToken: !!response.data.data.token,
      userRole: response.data.data.user.role,
      hasRefreshToken: !!response.data.data.refreshToken
    });
    
    // Test logout
    const logoutResponse = await axios.post('http://192.168.1.6:5002/api/auth/logout', {}, {
      headers: { Authorization: `Bearer ${response.data.data.token}` }
    });
    
    console.log('✅ Logout successful');
    console.log('Logout response:', logoutResponse.data);
    
    return true;
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    return false;
  }
}

testBasicAuth().then(success => {
  if (success) {
    console.log('\n🎉 Basic authentication functionality verified!');
  } else {
    console.log('\n❌ Authentication test failed');
    process.exit(1);
  }
});