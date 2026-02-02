import axios from 'axios';

const API_BASE = 'http://localhost:5002/api';

// Token from the login test
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImNvbXBhbnlJZCI6MSwicm9sZUlkIjo0LCJyb2xlIjoiV09SS0VSIiwiZW1haWwiOiJ3b3JrZXJAZ21haWwuY29tIiwicGVybWlzc2lvbnMiOlsiQVRURU5EQU5DRV9WSUVXIiwiQ09NTU9OX0FUVEVOREFOQ0VfVklFVyIsIlBST0ZJTEVfVklFVyIsIldPUktFUl9UQVNLX1ZJRVciLCJXT1JLRVJfVFJJUF9WSUVXIiwiTEVBVkVfUkVRVUVTVF9WSUVXIiwiV09SS0VSX1RBU0tfVVBEQVRFIiwiV09SS0VSX0FUVEVOREFOQ0VfVklFVyIsIldPUktFUl9BVFRFTkRBTkNFX1VQREFURSIsIldPUktFUl9EQVNIQk9BUkRfVklFVyIsIldPUktFUl9QUk9GSUxFX1ZJRVciXSwiaWF0IjoxNzcwMDA0ODE4LCJleHAiOjE3NzAwMzM2MTh9.IWsbfrMtIfqRYy4ZUepGojvEX4tpvYNoiAXxM-81gGI';

// Updated project location
const PROJECT_ID = 1001;
const NEW_PROJECT_LAT = 1.3521;
const NEW_PROJECT_LNG = 103.8198;
const GEOFENCE_RADIUS = 200; // meters

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function testAttendanceNewLocation() {
  console.log('🧪 Testing Attendance with Updated Project Location');
  console.log('==================================================');
  console.log(`📍 Project: ${PROJECT_ID} - Orchard Road Office Tower Maintenance`);
  console.log(`📍 NEW Location: ${NEW_PROJECT_LAT}, ${NEW_PROJECT_LNG}`);
  console.log(`🔵 NEW Geofence Radius: ${GEOFENCE_RADIUS}m (increased from 100m)`);
  console.log(`🔓 Strict Mode: DISABLED (more flexible)`);
  console.log(`📏 Allowed Variance: 50m`);

  try {
    // Test locations around the new project location
    const testLocations = [
      { 
        name: 'Exact NEW project location', 
        lat: NEW_PROJECT_LAT, 
        lng: NEW_PROJECT_LNG,
        description: 'Should be INSIDE geofence (0m)'
      },
      { 
        name: 'Very close (50m away)', 
        lat: NEW_PROJECT_LAT + 0.0005, 
        lng: NEW_PROJECT_LNG + 0.0005,
        description: 'Should be INSIDE geofence'
      },
      { 
        name: 'Within geofence (150m away)', 
        lat: NEW_PROJECT_LAT + 0.001, 
        lng: NEW_PROJECT_LNG + 0.001,
        description: 'Should be INSIDE geofence'
      },
      { 
        name: 'Edge of geofence (190m away)', 
        lat: NEW_PROJECT_LAT + 0.0015, 
        lng: NEW_PROJECT_LNG + 0.0015,
        description: 'Should be INSIDE geofence'
      },
      { 
        name: 'Outside geofence (300m away)', 
        lat: NEW_PROJECT_LAT + 0.003, 
        lng: NEW_PROJECT_LNG + 0.003,
        description: 'Should be OUTSIDE geofence'
      }
    ];

    console.log('\n🔍 Testing Geofence Validation:');
    console.log('================================');

    for (const location of testLocations) {
      const distance = calculateDistance(location.lat, location.lng, NEW_PROJECT_LAT, NEW_PROJECT_LNG);
      const expectedInside = distance <= GEOFENCE_RADIUS;
      
      console.log(`\n📍 Testing: ${location.name}`);
      console.log(`   Distance: ${distance.toFixed(2)}m`);
      console.log(`   Expected: ${expectedInside ? '✅ INSIDE' : '❌ OUTSIDE'}`);

      try {
        const response = await axios.post(`${API_BASE}/attendance/validate-geofence`, {
          projectId: PROJECT_ID,
          latitude: location.lat,
          longitude: location.lng,
          accuracy: 10
        }, {
          headers: { Authorization: `Bearer ${TOKEN}` }
        });
        
        const result = response.data;
        console.log(`   API Result: ${result.insideGeofence ? '✅ INSIDE' : '❌ OUTSIDE'}`);
        console.log(`   Distance from API: ${result.distance?.toFixed(2)}m`);
        console.log(`   Can Proceed: ${result.canProceed ? '✅ YES' : '❌ NO'}`);
        
      } catch (error) {
        console.log(`   ❌ API Error: ${error.response?.data?.message || error.message}`);
      }
    }

    // Test actual check-in from the new project location
    console.log('\n🎯 Testing Check-in Process:');
    console.log('=============================');

    // First, check current status
    console.log('\n📊 Current attendance status:');
    try {
      const statusResponse = await axios.get(`${API_BASE}/attendance/today`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      console.log('Status:', statusResponse.data.session);
      console.log('Check-in time:', statusResponse.data.checkInTime);
      console.log('Check-out time:', statusResponse.data.checkOutTime);
    } catch (error) {
      console.log('❌ Status check failed:', error.response?.data || error.message);
    }

    // Try to check in from the new project location
    console.log('\n✅ Attempting check-in from NEW project location:');
    try {
      const checkinResponse = await axios.post(`${API_BASE}/attendance/submit`, {
        projectId: PROJECT_ID,
        session: 'checkin',
        latitude: NEW_PROJECT_LAT,
        longitude: NEW_PROJECT_LNG
      }, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      
      console.log('🎉 Check-in SUCCESS:', checkinResponse.data);
    } catch (error) {
      console.log('❌ Check-in failed:', error.response?.data || error.message);
    }

    // Check status after check-in attempt
    console.log('\n📊 Status after check-in attempt:');
    try {
      const finalStatusResponse = await axios.get(`${API_BASE}/attendance/today`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      console.log('Final Status:', finalStatusResponse.data.session);
      console.log('Check-in time:', finalStatusResponse.data.checkInTime);
      console.log('Project ID:', finalStatusResponse.data.projectId);
    } catch (error) {
      console.log('❌ Final status check failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAttendanceNewLocation();