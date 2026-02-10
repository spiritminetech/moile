import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://192.168.1.6:5002/api';

async function debugTokenValidation() {
  console.log('🔍 Debugging Token Validation\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Login as Supervisor');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('   Token:', token);

    // Step 2: Decode token to see what's inside
    console.log('\n📝 Step 2: Decode Token (without verification)');
    const decoded = jwt.decode(token);
    console.log('   Decoded payload:', JSON.stringify(decoded, null, 2));

    // Step 3: Verify token with JWT_SECRET
    console.log('\n📝 Step 3: Verify Token with JWT_SECRET');
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token is valid');
      console.log('   Verified payload:', JSON.stringify(verified, null, 2));
    } catch (err) {
      console.log('❌ Token verification failed:', err.message);
    }

    // Step 4: Make request with detailed logging
    console.log('\n📝 Step 4: Make Dashboard Request');
    console.log('   URL:', `${BASE_URL}/supervisor/dashboard`);
    console.log('   Authorization Header:', `Bearer ${token.substring(0, 30)}...`);
    
    try {
      const response = await axios.get(`${BASE_URL}/supervisor/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Request successful');
      console.log('   Response:', response.data);
    } catch (error) {
      console.log('❌ Request failed');
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
      console.log('   Headers sent:', error.config?.headers);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

debugTokenValidation();
