import axios from 'axios';

const API_BASE = 'http://192.168.1.8:5002/api';

async function debugApiResponseFormat() {
  try {
    console.log('🔍 Debugging API response format issue...');
    console.log('==========================================');
    
    // Your exact coordinates and request
    const requestData = {
      projectId: 1,
      latitude: 12.865132531605989,
      longitude: 77.64679714223945,
      accuracy: 7.072961373614264
    };
    
    console.log('\n📍 Request data:', requestData);
    console.log('🌐 Endpoint: POST', `${API_BASE}/attendance/validate-geofence`);
    
    // Test without authentication first to see the error format
    console.log('\n🔍 Test 1: Without authentication...');
    try {
      const response = await axios.post(`${API_BASE}/attendance/validate-geofence`, requestData);
      console.log('✅ Unexpected success:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('❌ Expected auth error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
    
    // Test with a potentially invalid token
    console.log('\n🔍 Test 2: With potentially invalid token...');
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImNvbXBhbnlJZCI6MSwidXNlcm5hbWUiOiJ3b3JrZXJAZ21haWwuY29tIiwiaWF0IjoxNzM4NTEzNzE5LCJleHAiOjE3Mzg1MTczMTl9.invalid_signature';
    
    try {
      const response = await axios.post(`${API_BASE}/attendance/validate-geofence`, requestData, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('❌ Auth/validation error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
    
    // Test server connectivity
    console.log('\n🔍 Test 3: Server connectivity...');
    try {
      const healthResponse = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
      console.log('✅ Server is running:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server connectivity issue:', error.message);
      
      // Try the root endpoint
      try {
        const rootResponse = await axios.get('http://192.168.1.8:5002/', { timeout: 5000 });
        console.log('✅ Root endpoint accessible:', rootResponse.status);
      } catch (rootError) {
        console.log('❌ Root endpoint also not accessible:', rootError.message);
      }
    }
    
    // Test different project IDs to see if the issue is project-specific
    console.log('\n🔍 Test 4: Testing different project IDs...');
    const projectIds = [1, 2, 1003, 9999];
    
    for (const projectId of projectIds) {
      console.log(`\n   Testing project ID: ${projectId}`);
      try {
        const response = await axios.post(`${API_BASE}/attendance/validate-geofence`, {
          ...requestData,
          projectId: projectId
        }, {
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        console.log(`   ✅ Project ${projectId} response:`, response.data);
      } catch (error) {
        if (error.response) {
          console.log(`   ❌ Project ${projectId} error:`, {
            status: error.response.status,
            data: error.response.data
          });
        } else {
          console.log(`   ❌ Project ${projectId} network error:`, error.message);
        }
      }
    }
    
    // Analyze the response format you mentioned
    console.log('\n🔍 Analysis of your reported response format:');
    console.log('You reported getting:');
    console.log('  - accuracy: 7.072961373614264');
    console.log('  - canProceed: false');
    console.log('  - distanceFromSite: 999');
    console.log('  - isValid: false');
    console.log('  - message: "Failed to validate location: Unknown error"');
    
    console.log('\nExpected backend response format should be:');
    console.log('  - insideGeofence: boolean');
    console.log('  - distance: number');
    console.log('  - canProceed: boolean');
    console.log('  - message: string');
    console.log('  - accuracy: number');
    
    console.log('\nThis suggests the response is being transformed by frontend code.');
    console.log('The "distanceFromSite: 999" and "Unknown error" are likely coming from:');
    console.log('1. Frontend error handling in GeofenceService or WorkerTaskService');
    console.log('2. A middleware or service that transforms the response');
    console.log('3. Default error values when the API call fails');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugApiResponseFormat();