import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Token from the login test
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImNvbXBhbnlJZCI6MSwicm9sZUlkIjo0LCJyb2xlIjoiV09SS0VSIiwiZW1haWwiOiJ3b3JrZXJAZ21haWwuY29tIiwicGVybWlzc2lvbnMiOlsiQVRURU5EQU5DRV9WSUVXIiwiQ09NTU9OX0FUVEVOREFOQ0VfVklFVyIsIlBST0ZJTEVfVklFVyIsIldPUktFUl9UQVNLX1ZJRVciLCJXT1JLRVJfVFJJUF9WSUVXIiwiTEVBVkVfUkVRVUVTVF9WSUVXIiwiV09SS0VSX1RBU0tfVVBEQVRFIiwiV09SS0VSX0FUVEVOREFOQ0VfVklFVyIsIldPUktFUl9BVFRFTkRBTkNFX1VQREFURSIsIldPUktFUl9EQVNIQk9BUkRfVklFVyIsIldPUktFUl9QUk9GSUxFX1ZJRVciXSwiaWF0IjoxNzcwMDA0ODE4LCJleHAiOjE3NzAwMzM2MTh9.IWsbfrMtIfqRYy4ZUepGojvEX4tpvYNoiAXxM-81gGI';

async function testAttendanceGeofence() {
  console.log('🧪 Testing Attendance Geofence Validation');
  console.log('==========================================');

  try {
    // Test 1: Check current project location
    console.log('\n📍 Test 1: Validating geofence at project location...');
    const insideGeofence = await axios.post(`${API_BASE}/attendance/validate-geofence`, {
      projectId: 1,
      latitude: 1.3521,  // Singapore coordinates (should be inside)
      longitude: 103.8198,
      accuracy: 10
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    console.log('✅ Inside geofence result:', insideGeofence.data);

    // Test 2: Check outside project location
    console.log('\n📍 Test 2: Validating geofence outside project location...');
    const outsideGeofence = await axios.post(`${API_BASE}/attendance/validate-geofence`, {
      projectId: 1,
      latitude: 40.7128,  // New York coordinates (should be outside)
      longitude: -74.0060,
      accuracy: 10
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    console.log('❌ Outside geofence result:', outsideGeofence.data);

    // Test 3: Get today's attendance status
    console.log('\n📅 Test 3: Getting today\'s attendance status...');
    const todayAttendance = await axios.get(`${API_BASE}/attendance/today`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    console.log('📊 Today\'s attendance:', todayAttendance.data);

    // Test 4: Try to check in (this might fail due to geofence)
    console.log('\n⏰ Test 4: Attempting check-in...');
    try {
      const checkinResult = await axios.post(`${API_BASE}/attendance/submit`, {
        projectId: 1,
        session: 'checkin',
        latitude: 1.3521,  // Singapore coordinates
        longitude: 103.8198
      }, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      
      console.log('✅ Check-in result:', checkinResult.data);
    } catch (checkinError) {
      console.log('❌ Check-in failed:', checkinError.response?.data || checkinError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAttendanceGeofence();