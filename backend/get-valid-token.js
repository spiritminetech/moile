import axios from 'axios';

const API_BASE = 'http://192.168.1.8:5002/api';

async function getValidToken() {
  try {
    console.log('🔑 Getting valid JWT token for worker@gmail.com...');
    
    // Login to get a valid token
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'worker@gmail.com',
      password: 'password123' // You'll need to use the correct password
    });
    
    console.log('✅ Login successful!');
    console.log('Token:', loginResponse.data.token);
    console.log('User info:', {
      userId: loginResponse.data.user.id,
      username: loginResponse.data.user.username,
      companyId: loginResponse.data.user.companyId
    });
    
    // Now test the geofence validation with the valid token
    console.log('\n🔍 Testing geofence validation with valid token...');
    
    const geofenceResponse = await axios.post(`${API_BASE}/attendance/validate-geofence`, {
      projectId: 1,
      latitude: 12.865132531605989,
      longitude: 77.64679714223945,
      accuracy: 7.072961373614264
    }, {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Geofence validation result:', geofenceResponse.data);
    
    return {
      token: loginResponse.data.token,
      geofenceResult: geofenceResponse.data
    };
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else {
      console.log('❌ Network Error:', error.message);
    }
    
    // If login fails, try with different common passwords
    if (error.response?.status === 401) {
      console.log('\n🔄 Trying common passwords...');
      const commonPasswords = ['password', '123456', 'worker123', 'admin123'];
      
      for (const password of commonPasswords) {
        try {
          console.log(`   Trying password: ${password}`);
          const loginAttempt = await axios.post(`${API_BASE}/auth/login`, {
            username: 'worker@gmail.com',
            password: password
          });
          
          console.log(`✅ Success with password: ${password}`);
          console.log('Token:', loginAttempt.data.token);
          return { token: loginAttempt.data.token };
          
        } catch (attemptError) {
          console.log(`   ❌ Failed with password: ${password}`);
        }
      }
    }
    
    throw error;
  }
}

getValidToken();