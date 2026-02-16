/**
 * Test script to verify the worker profile API endpoint
 * Run this with: node test-profile-api.js
 */

const axios = require('axios');

// Configuration - Update these values to match your setup
const API_BASE_URL = 'http://192.168.1.6:5002/api';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // Get this from AsyncStorage or login response

async function testProfileAPI() {
  console.log('🧪 Testing Worker Profile API');
  console.log('📍 API Base URL:', API_BASE_URL);
  console.log('🔐 Auth Token:', AUTH_TOKEN ? 'Present' : 'Missing');
  console.log('');

  try {
    // Test 1: Check if server is reachable
    console.log('1️⃣ Testing server connectivity...');
    try {
      const healthCheck = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000
      });
      console.log('✅ Server is reachable');
      console.log('   Response:', healthCheck.data);
    } catch (error) {
      console.log('❌ Server is not reachable');
      console.log('   Error:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('   💡 Tip: Make sure the backend server is running on port 5002');
      }
      return;
    }

    console.log('');

    // Test 2: Test profile endpoint without auth
    console.log('2️⃣ Testing profile endpoint (without auth)...');
    try {
      const noAuthResponse = await axios.get(`${API_BASE_URL}/worker/profile`, {
        timeout: 5000
      });
      console.log('✅ Profile endpoint responded (no auth required?)');
      console.log('   Response:', JSON.stringify(noAuthResponse.data, null, 2));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Profile endpoint requires authentication (expected)');
      } else {
        console.log('❌ Unexpected error:', error.message);
        console.log('   Status:', error.response?.status);
        console.log('   Response:', error.response?.data);
      }
    }

    console.log('');

    // Test 3: Test profile endpoint with auth
    if (AUTH_TOKEN && AUTH_TOKEN !== 'YOUR_AUTH_TOKEN_HERE') {
      console.log('3️⃣ Testing profile endpoint (with auth)...');
      try {
        const authResponse = await axios.get(`${API_BASE_URL}/worker/profile`, {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        console.log('✅ Profile loaded successfully!');
        console.log('   Response structure:', Object.keys(authResponse.data));
        console.log('   Full response:', JSON.stringify(authResponse.data, null, 2));
      } catch (error) {
        console.log('❌ Profile request failed');
        console.log('   Status:', error.response?.status);
        console.log('   Error:', error.message);
        console.log('   Response:', JSON.stringify(error.response?.data, null, 2));
        
        if (error.response?.status === 401) {
          console.log('   💡 Tip: Your auth token may be expired. Try logging in again.');
        } else if (error.response?.status === 404) {
          console.log('   💡 Tip: The /worker/profile endpoint may not exist. Check backend routes.');
        }
      }
    } else {
      console.log('3️⃣ Skipping auth test (no token provided)');
      console.log('   💡 To test with auth, update AUTH_TOKEN in this script');
    }

    console.log('');
    console.log('🏁 Test completed');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Run the test
testProfileAPI();
