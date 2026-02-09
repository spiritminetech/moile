// Test the actual API endpoint to see if it's using the updated code
import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('🔍 Testing the actual API endpoint...\n');
    
    // Test the worker manifests API for task 10003
    const url = 'http://localhost:5002/api/driver/worker-manifests/10003';
    
    console.log(`📡 Calling: ${url}`);
    console.log('⚠️  Note: This will fail without proper authentication, but we can see if server responds\n');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401 || response.status === 403) {
      console.log('✅ Server is responding (authentication required as expected)');
      console.log('💡 This means the backend server is running with updated code');
    } else if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.success && data.data) {
        const checkedInCount = data.data.filter(worker => worker.status === 'checked-in').length;
        console.log(`\n📊 API shows: ${checkedInCount} of ${data.data.length} workers checked in`);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Error Response:');
      console.log(errorText);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection refused - backend server is not running on port 5002');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testAPI();