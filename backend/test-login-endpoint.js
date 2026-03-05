import fetch from 'node-fetch';

async function testLoginEndpoint() {
  const ports = [5001, 5002];
  const credentials = {
    email: 'supervisor@gmail.com',
    password: 'password123'
  };

  console.log('🔍 Testing Login Endpoint on Multiple Ports...\n');

  for (const port of ports) {
    try {
      console.log(`Testing port ${port}...`);
      const url = `http://localhost:${port}/api/auth/login`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      
      console.log(`✅ Port ${port} responded:`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Success: ${data.success}`);
      if (data.success) {
        console.log(`   User: ${data.user?.email}`);
        console.log(`   Role: ${data.company?.role}`);
        console.log(`   Company: ${data.company?.name}`);
      } else {
        console.log(`   Message: ${data.message}`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`❌ Port ${port} failed: ${error.message}\n`);
    }
  }
}

testLoginEndpoint();
