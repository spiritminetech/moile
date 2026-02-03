import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const testGeofenceAPI = async () => {
  try {
    console.log('🧪 Testing Geofence API Directly');
    console.log('================================');
    
    const apiUrl = 'http://localhost:5002/api/attendance/validate-geofence';
    
    // Test data - using our fallback coordinates
    const testData = {
      projectId: '1003',
      latitude: 40.7128,  // Our fallback location
      longitude: -74.0060,
      accuracy: 10
    };
    
    console.log('📍 Sending test data:', testData);
    
    const response = await axios.post(apiUrl, testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));
    
    // Check what coordinates the API is using
    if (response.data.projectGeofence) {
      console.log('\\n🎯 Project Geofence from API:');
      console.log('- Center Lat:', response.data.projectGeofence.center.latitude);
      console.log('- Center Lng:', response.data.projectGeofence.center.longitude);
      console.log('- Radius:', response.data.projectGeofence.radius);
    }
    
    // Calculate expected distance
    const expectedLat = 40.7128;
    const expectedLng = -74.0060;
    const actualLat = response.data.projectGeofence?.center?.latitude;
    const actualLng = response.data.projectGeofence?.center?.longitude;
    
    if (actualLat && actualLng) {
      const distance = calculateDistance(expectedLat, expectedLng, actualLat, actualLng);
      console.log('\\n📏 Distance Analysis:');
      console.log('- Expected coordinates:', expectedLat, expectedLng);
      console.log('- Actual API coordinates:', actualLat, actualLng);
      console.log('- Distance between them:', Math.round(distance), 'meters');
      
      if (distance > 1000) {
        console.log('❌ PROBLEM: API is using different coordinates than expected!');
      } else {
        console.log('✅ Coordinates match as expected');
      }
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
};

// Haversine formula to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

testGeofenceAPI();