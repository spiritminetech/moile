// Simple test to verify supervisor login
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.6:5002/api';

async function testLogin() {
  const credentials = [
    { email: 'supervisor@gmail.com', password: 'password123' },
    { email: 'supervisor@gmail.com', password: 'Password123' },
    { email: 'supervisor@gmail.com', password: 'supervisor123' },
  ];

  for (const cred of credentials) {
    try {
      console.log(`\n🔐 Testing: ${cred.email} / ${cred.password}`);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, cred);
      
      if (response.data.success) {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('User:', response.data.data.user);
        console.log('Token:', response.data.data.token.substring(0, 30) + '...');
        return;
      }
    } catch (error) {
      console.log('❌ Failed:', error.response?.data?.message || error.message);
    }
  }
  
  console.log('\n❌ All login attempts failed');
}

testLogin();
