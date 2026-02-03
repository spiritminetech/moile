import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5002/api';

async function testDifferentParams() {
  try {
    // First, login to get a valid token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test different parameter combinations
    const testCases = [
      { name: 'No parameters', params: {} },
      { name: 'Page and limit only', params: { page: 1, limit: 10 } },
      { name: 'With empty projectId', params: { page: 1, limit: 10, projectId: '' } },
      { name: 'With null projectId', params: { page: 1, limit: 10, projectId: null } },
      { name: 'With undefined projectId', params: { page: 1, limit: 10, projectId: undefined } },
      { name: 'With invalid projectId', params: { page: 1, limit: 10, projectId: 'invalid' } },
      { name: 'With valid projectId', params: { page: 1, limit: 10, projectId: 1001 } },
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      console.log('Params:', testCase.params);
      
      try {
        const response = await axios.get(`${BASE_URL}/worker/tasks/history`, {
          headers,
          params: testCase.params
        });
        
        console.log('✅ Success:', response.data.success);
        console.log('Tasks found:', response.data.data?.tasks?.length || 0);
        
      } catch (error) {
        console.error('❌ Error:', error.response?.data?.message);
        console.error('Error code:', error.response?.data?.error);
        
        if (error.response?.data?.message === 'Invalid task assignment format') {
          console.error('🎯 Found the problematic parameter combination!');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Login error:', error.message);
  }
}

testDifferentParams();