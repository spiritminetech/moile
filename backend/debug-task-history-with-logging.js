import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5002/api';

async function debugWithDetailedLogging() {
  try {
    // First, login to get a valid token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Now make the request with detailed error logging
    console.log('🔍 Making task history request...');
    console.log('URL:', `${BASE_URL}/worker/tasks/history`);
    console.log('Headers:', {
      'Authorization': `Bearer ${token.substring(0, 20)}...`,
      'Content-Type': 'application/json'
    });
    console.log('Params:', { page: 1, limit: 10 });
    
    try {
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
      
      console.log('✅ Success:', JSON.stringify(response.data, null, 2));
      
    } catch (apiError) {
      console.error('❌ API Error Details:');
      console.error('Status:', apiError.response?.status);
      console.error('Status Text:', apiError.response?.statusText);
      console.error('Response Data:', JSON.stringify(apiError.response?.data, null, 2));
      console.error('Response Headers:', apiError.response?.headers);
      
      // Check if it's a specific type of error
      if (apiError.response?.status === 400) {
        console.error('🔍 This is a 400 Bad Request error');
        console.error('Error message:', apiError.response?.data?.message);
        console.error('Error code:', apiError.response?.data?.error);
        
        // Check if the error message matches our issue
        if (apiError.response?.data?.message === 'Invalid task assignment format') {
          console.error('🎯 This is the exact error we\'re looking for!');
          console.error('The error is coming from the API, not from our direct database queries');
          console.error('This suggests there\'s middleware or validation logic that\'s not in the main controller');
        }
      }
      
      // Also log the full error object
      console.error('Full error object:', {
        message: apiError.message,
        code: apiError.code,
        config: {
          method: apiError.config?.method,
          url: apiError.config?.url,
          params: apiError.config?.params
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Outer error:', error.message);
  }
}

debugWithDetailedLogging();