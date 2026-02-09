// Test the API to see if attendance-based check-in is working
import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('🔍 Testing getWorkerManifests API...\n');
    
    // Test API call (you'll need to provide actual auth token)
    const response = await fetch('http://localhost:5002/api/driver/worker-manifests/10003', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add authorization header with actual token
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.success && data.data) {
        const checkedInCount = data.data.filter(worker => worker.status === 'checked-in').length;
        console.log(`\n📊 Checked-in workers: ${checkedInCount} of ${data.data.length}`);
      }
    } else {
      console.log('❌ API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    console.log('💡 This means the backend server is not running on port 5002');
  }
}

testAPI();