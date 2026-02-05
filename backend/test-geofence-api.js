// Test geofence validation API endpoint

import fetch from 'node-fetch';

const API_BASE_URL = 'http://192.168.0.3:5002/api';

async function testGeofenceAPI() {
  try {
    console.log('🧪 Testing Geofence Validation API');
    console.log('='.repeat(40));
    
    // First, get auth token
    console.log('🔐 Getting authentication token...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'worker1@gmail.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('📥 Login response:', loginData);
    
    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.message);
    }
    
    const token = loginData.token || loginData.data?.token;
    if (!token) {
      throw new Error('No token in response: ' + JSON.stringify(loginData));
    }
    console.log('✅ Authentication token obtained');
    
    // Test geofence validation with Singapore coordinates
    console.log('\n📍 Testing geofence validation...');
    const geofenceResponse = await fetch(`${API_BASE_URL}/worker/attendance/validate-location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        projectId: 1003,  // Use the worker's actual project
        latitude: 1.3521,  // Singapore coordinates
        longitude: 103.8198,
        accuracy: 10
      })
    });
    
    const geofenceData = await geofenceResponse.json();
    console.log('📥 Geofence API Response:', JSON.stringify(geofenceData, null, 2));
    
    if (geofenceData.valid) {
      console.log('✅ SUCCESS: Geofence validation passed!');
      console.log(`   Distance: ${geofenceData.distance}m`);
      console.log(`   Inside geofence: ${geofenceData.insideGeofence}`);
    } else {
      console.log('❌ FAILED: Geofence validation failed');
      console.log(`   Distance: ${geofenceData.distance}m`);
      console.log(`   Message: ${geofenceData.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing geofence API:', error.message);
  }
}

testGeofenceAPI();