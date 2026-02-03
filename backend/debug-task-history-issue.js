import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5002/api';

async function debugTaskHistory() {
  try {
    // First, login to get a valid token
    console.log('🔐 Logging in to get valid token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });
    
    console.log('Login response:', loginResponse.data);
    
    let token;
    if (loginResponse.data.autoSelected) {
      token = loginResponse.data.token;
    } else {
      // Select company if multiple companies
      console.log('🏢 Selecting company...');
      const selectResponse = await axios.post(`${BASE_URL}/auth/select-company`, {
        userId: loginResponse.data.userId,
        companyId: loginResponse.data.companies[0].companyId
      });
      token = selectResponse.data.token;
    }
    
    console.log('✅ Got token:', token.substring(0, 50) + '...');
    
    // Now test task history
    console.log('🔍 Testing Task History API...');
    console.log('URL:', `${BASE_URL}/worker/tasks/history`);
    
    const response = await axios.get(`${BASE_URL}/worker/tasks/history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        page: 1,
        limit: 10
      }
    });
    
    console.log('✅ Task History Success:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    if (error.response?.data) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugTaskHistory();