import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5002';

async function debugJWTToken() {
  console.log('🔍 Debugging JWT Token Contents...\n');

  try {
    // Step 1: Login to get a token
    console.log('Step 1: Logging in as supervisor...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'supervisor@company.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();

    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }

    console.log('✅ Login successful');
    console.log('Response structure:', {
      autoSelected: loginData.autoSelected,
      hasToken: !!loginData.token,
      hasUser: !!loginData.user,
      hasCompany: !!loginData.company,
      userRole: loginData.user?.role,
      companyRole: loginData.company?.role
    });

    // Step 2: Decode the JWT token to see its contents
    const token = loginData.token;
    console.log('\nStep 2: Decoding JWT token...');
    
    try {
      const decoded = jwt.decode(token);
      console.log('✅ JWT Token decoded successfully');
      console.log('Token payload:', JSON.stringify(decoded, null, 2));
      
      // Check if role is in the token
      if (decoded.role) {
        console.log(`✅ Role found in token: ${decoded.role}`);
      } else {
        console.log('❌ Role NOT found in token');
        console.log('Available fields:', Object.keys(decoded));
      }
      
    } catch (decodeError) {
      console.error('❌ Failed to decode JWT token:', decodeError.message);
    }

    // Step 3: Test the token with a simple authenticated endpoint
    console.log('\nStep 3: Testing token with auth/verify endpoint...');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/verify`, { headers });
    const verifyData = await verifyResponse.json();

    if (verifyResponse.ok) {
      console.log('✅ /api/auth/verify successful');
      console.log('User from middleware:', JSON.stringify(verifyData.user, null, 2));
    } else {
      console.error('❌ /api/auth/verify failed:', verifyData);
    }

    // Step 4: Test with supervisor notification endpoint
    console.log('\nStep 4: Testing with supervisor notification endpoint...');
    
    const notificationResponse = await fetch(`${API_BASE_URL}/api/supervisor/notifications/overview`, { headers });
    const notificationData = await notificationResponse.json();

    if (notificationResponse.ok) {
      console.log('✅ Supervisor notification endpoint successful!');
    } else {
      console.error('❌ Supervisor notification endpoint failed');
      console.error('Status:', notificationResponse.status);
      console.error('Error:', notificationData);
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
  }
}

// Run the debug script
debugJWTToken()
  .then(() => {
    console.log('\n🏁 JWT Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Debug script crashed:', error);
    process.exit(1);
  });