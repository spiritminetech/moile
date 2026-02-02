import axios from 'axios';

const API_BASE = 'http://localhost:5002/api';

// Token from the login test
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImNvbXBhbnlJZCI6MSwicm9sZUlkIjo0LCJyb2xlIjoiV09SS0VSIiwiZW1haWwiOiJ3b3JrZXJAZ21haWwuY29tIiwicGVybWlzc2lvbnMiOlsiQVRURU5EQU5DRV9WSUVXIiwiQ09NTU9OX0FUVEVOREFOQ0VfVklFVyIsIlBST0ZJTEVfVklFVyIsIldPUktFUl9UQVNLX1ZJRVciLCJXT1JLRVJfVFJJUF9WSUVXIiwiTEVBVkVfUkVRVUVTVF9WSUVXIiwiV09SS0VSX1RBU0tfVVBEQVRFIiwiV09SS0VSX0FUVEVOREFOQ0VfVklFVyIsIldPUktFUl9BVFRFTkRBTkNFX1VQREFURSIsIldPUktFUl9EQVNIQk9BUkRfVklFVyIsIldPUktFUl9QUk9GSUxFX1ZJRVciXSwiaWF0IjoxNzcwMDA0ODE4LCJleHAiOjE3NzAwMzM2MTh9.IWsbfrMtIfqRYy4ZUepGojvEX4tpvYNoiAXxM-81gGI';

// Project 1001 details
const PROJECT_ID = 1001;
const PROJECT_LAT = 1.2966;
const PROJECT_LNG = 103.8547;

async function testAttendanceCheckin() {
  console.log('🧪 Testing Attendance Check-in Process');
  console.log('=====================================');
  console.log(`📍 Project: ${PROJECT_ID} - Orchard Road Office Tower Maintenance`);
  console.log(`📍 Location: ${PROJECT_LAT}, ${PROJECT_LNG}`);

  try {
    // Test 1: Try to check in from exact project location (should work)
    console.log('\n✅ Test 1: Check-in from INSIDE geofence (exact location)');
    try {
      const checkinInside = await axios.post(`${API_BASE}/attendance/submit`, {
        projectId: PROJECT_ID,
        session: 'checkin',
        latitude: PROJECT_LAT,
        longitude: PROJECT_LNG
      }, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      
      console.log('✅ Check-in from inside result:', checkinInside.data);
    } catch (error) {
      console.log('❌ Check-in from inside failed:', error.response?.data || error.message);
    }

    // Test 2: Check today's status after check-in
    console.log('\n📅 Test 2: Check attendance status after check-in');
    try {
      const statusAfterCheckin = await axios.get(`${API_BASE}/attendance/today`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      console.log('📊 Status after check-in:', JSON.stringify(statusAfterCheckin.data, null, 2));
    } catch (error) {
      console.log('❌ Status check failed:', error.response?.data || error.message);
    }

    // Test 3: Try to check in from outside geofence (should fail)
    console.log('\n❌ Test 3: Check-in from OUTSIDE geofence (200m away)');
    try {
      const checkinOutside = await axios.post(`${API_BASE}/attendance/submit`, {
        projectId: PROJECT_ID,
        session: 'checkin',
        latitude: PROJECT_LAT + 0.002,  // ~200m away
        longitude: PROJECT_LNG + 0.002
      }, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      
      console.log('⚠️ Check-in from outside unexpectedly succeeded:', checkinOutside.data);
    } catch (error) {
      console.log('✅ Check-in from outside correctly failed:', error.response?.data || error.message);
    }

    // Test 4: Try to check in from very far away (should fail)
    console.log('\n❌ Test 4: Check-in from VERY FAR (New York)');
    try {
      const checkinFar = await axios.post(`${API_BASE}/attendance/submit`, {
        projectId: PROJECT_ID,
        session: 'checkin',
        latitude: 40.7128,  // New York
        longitude: -74.0060
      }, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      
      console.log('⚠️ Check-in from far away unexpectedly succeeded:', checkinFar.data);
    } catch (error) {
      console.log('✅ Check-in from far away correctly failed:', error.response?.data || error.message);
    }

    // Test 5: Try to check out (if checked in)
    console.log('\n🏁 Test 5: Check-out from inside geofence');
    try {
      const checkout = await axios.post(`${API_BASE}/attendance/submit`, {
        projectId: PROJECT_ID,
        session: 'checkout',
        latitude: PROJECT_LAT,
        longitude: PROJECT_LNG
      }, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      
      console.log('✅ Check-out result:', checkout.data);
    } catch (error) {
      console.log('❌ Check-out failed:', error.response?.data || error.message);
    }

    // Test 6: Final status check
    console.log('\n📊 Test 6: Final attendance status');
    try {
      const finalStatus = await axios.get(`${API_BASE}/attendance/today`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      console.log('📊 Final status:', JSON.stringify(finalStatus.data, null, 2));
    } catch (error) {
      console.log('❌ Final status check failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAttendanceCheckin();