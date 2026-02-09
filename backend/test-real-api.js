// Test the real API endpoint with proper authentication
import fetch from 'node-fetch';

async function testRealAPI() {
  try {
    console.log('🔍 Testing real API endpoint...\n');
    
    // First, let's try to get a token (this will likely fail, but we can see the response)
    const loginUrl = 'http://localhost:5002/api/auth/login';
    
    console.log('📡 Attempting login to get token...');
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'driver@example.com', // This will likely fail
        password: 'password'
      })
    });
    
    console.log(`Login response: ${loginResponse.status} ${loginResponse.statusText}`);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful, got token');
      
      // Now test the worker manifests API
      const manifestUrl = 'http://localhost:5002/api/driver/worker-manifests/10003';
      const manifestResponse = await fetch(manifestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`
        }
      });
      
      console.log(`\nManifest API response: ${manifestResponse.status} ${manifestResponse.statusText}`);
      
      if (manifestResponse.ok) {
        const manifestData = await manifestResponse.json();
        console.log('✅ API Response:');
        console.log(JSON.stringify(manifestData, null, 2));
        
        if (manifestData.success && manifestData.data) {
          const checkedInCount = manifestData.data.filter(w => w.status === 'checked-in').length;
          console.log(`\n📊 Checked-in workers: ${checkedInCount} of ${manifestData.data.length}`);
        }
      } else {
        const errorText = await manifestResponse.text();
        console.log('❌ Manifest API error:', errorText);
      }
    } else {
      const loginError = await loginResponse.text();
      console.log('❌ Login failed:', loginError);
      console.log('\n💡 This is expected - we need proper credentials');
      console.log('💡 But the server is responding, which means it\'s running');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection refused - backend server is not running');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testRealAPI();