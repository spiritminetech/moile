// Debug script to check actual auth response format
const axios = require('axios');

const BASE_URL = 'http://192.168.1.8:5002/api';

async function debugAuthResponse() {
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'worker@test.com',
      password: 'password123'
    });
    
    console.log('Full login response:');
    console.log(JSON.stringify(loginResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

debugAuthResponse();