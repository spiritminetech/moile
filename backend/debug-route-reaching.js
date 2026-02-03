import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5002/api';

async function testRouteReaching() {
  try {
    // First, login to get a valid token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Test different worker endpoints to see which ones work
    const endpoints = [
      '/worker/profile',
      '/worker/tasks/today',
      '/worker/tasks/history',
      '/worker/geofence/validate?latitude=1.3521&longitude=103.8198',
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🧪 Testing: ${endpoint}`);
      
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Success:', response.status, response.data.success);
        
      } catch (error) {
        console.error('❌ Error:', error.response?.status, error.response?.data?.message);
        console.error('Error code:', error.response?.data?.error);
      }
    }
    
  } catch (error) {
    console.error('❌ Login error:', error.message);
  }
}

testRouteReaching();