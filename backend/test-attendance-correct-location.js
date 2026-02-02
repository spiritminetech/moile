import axios from 'axios';

const API_BASE = 'http://localhost:5002/api';

// Token from the login test
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImNvbXBhbnlJZCI6MSwicm9sZUlkIjo0LCJyb2xlIjoiV09SS0VSIiwiZW1haWwiOiJ3b3JrZXJAZ21haWwuY29tIiwicGVybWlzc2lvbnMiOlsiQVRURU5EQU5DRV9WSUVXIiwiQ09NTU9OX0FUVEVOREFOQ0VfVklFVyIsIlBST0ZJTEVfVklFVyIsIldPUktFUl9UQVNLX1ZJRVciLCJXT1JLRVJfVFJJUF9WSUVXIiwiTEVBVkVfUkVRVUVTVF9WSUVXIiwiV09SS0VSX1RBU0tfVVBEQVRFIiwiV09SS0VSX0FUVEVOREFOQ0VfVklFVyIsIldPUktFUl9BVFRFTkRBTkNFX1VQREFURSIsIldPUktFUl9EQVNIQk9BUkRfVklFVyIsIldPUktFUl9QUk9GSUxFX1ZJRVciXSwiaWF0IjoxNzcwMDA0ODE4LCJleHAiOjE3NzAwMzM2MTh9.IWsbfrMtIfqRYy4ZUepGojvEX4tpvYNoiAXxM-81gGI';

// Project 1001 details
const PROJECT_ID = 1001;
const PROJECT_LAT = 1.2966;
const PROJECT_LNG = 103.8547;
const GEOFENCE_RADIUS = 100; // meters

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

async function testAttendanceWithCorrectLocation() {
  console.log('🧪 Testing Attendance with Correct Project Location');
  console.log('==================================================');
  console.log(`📍 Project: 1001 - Orchard Road Office Tower Maintenance`);
  console.log(`📍 Location: ${PROJECT_LAT}, ${PROJECT_LNG}`);
  console.log(`🔵 Geofence Radius: ${GEOFENCE_RADIUS}m`);

  try {
    // Test locations
    const testLocations = [
      { 
        name: 'Exact project location', 
        lat: PROJECT_LAT, 
        lng: PROJECT_LNG,
        description: 'Should be INSIDE geofence'
      },
      { 
        name: 'Very close (50m away)', 
        lat: PROJECT_LAT + 0.0005, 
        lng: PROJECT_LNG + 0.0005,
        description: 'Should be INSIDE geofence'
      },
      { 
        name: 'Edge of geofence (90m away)', 
        lat: PROJECT_LAT + 0.0008, 
        lng: PROJECT_LNG + 0.0008,
        description: 'Should be INSIDE geofence'
      },
      { 
        name: 'Outside geofence (200m away)', 
        lat: PROJECT_LAT + 0.002, 
        lng: PROJECT_LNG + 0.002,
        description: 'Should be OUTSIDE geofence'
      },
      { 
        name: 'Far away (New York)', 
        lat: 40.7128, 
        lng: -74.0060,
        description: 'Should be OUTSIDE geofence'
      }
    ];

    for (const location of testLocations) {
      const distance = calculateDistance(location.lat, location.lng, PROJECT_LAT, PROJECT_LNG);
      const expectedInside = distance <= GEOFENCE_RADIUS;
      
      console.log(`\n📍 Testing: ${location.name}`);
      console.log(`   Distance: ${distance.toFixed(2)}m`);
      console.log(`   Expected: ${expectedInside ? '✅ INSIDE' : '❌ OUTSIDE'}`);
      console.log(`   ${location.description}`);

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
        console.log(`   Message: ${result.message}`);
        
        // Check if our calculation matches API
        const calculationMatch = Math.abs(distance - result.distance) < 1;
        console.log(`   Calculation Match: ${calculationMatch ? '✅' : '❌'}`);
        
      } catch (error) {
        console.log(`   ❌ API Error: ${error.response?.data?.message || error.message}`);
      }
    }

    // Test today's attendance status
    console.log('\n📅 Getting today\'s attendance status...');
    try {
      const todayResponse = await axios.get(`${API_BASE}/attendance/today`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      console.log('📊 Today\'s attendance:', JSON.stringify(todayResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Today\'s attendance error:', error.response?.data || error.message);
    }

    // Test attendance history
    console.log('\n📚 Getting attendance history...');
    try {
      const historyResponse = await axios.get(`${API_BASE}/attendance/history?projectId=${PROJECT_ID}`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      console.log(`📊 Attendance history: ${historyResponse.data.records.length} records`);
      if (historyResponse.data.records.length > 0) {
        console.log('Latest record:', JSON.stringify(historyResponse.data.records[0], null, 2));
      }
    } catch (error) {
      console.log('❌ Attendance history error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAttendanceWithCorrectLocation();