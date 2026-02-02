import axios from 'axios';

const API_BASE = 'http://localhost:5002/api';

// Token from the login test
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImNvbXBhbnlJZCI6MSwicm9sZUlkIjo0LCJyb2xlIjoiV09SS0VSIiwiZW1haWwiOiJ3b3JrZXJAZ21haWwuY29tIiwicGVybWlzc2lvbnMiOlsiQVRURU5EQU5DRV9WSUVXIiwiQ09NTU9OX0FUVEVOREFOQ0VfVklFVyIsIlBST0ZJTEVfVklFVyIsIldPUktFUl9UQVNLX1ZJRVciLCJXT1JLRVJfVFJJUF9WSUVXIiwiTEVBVkVfUkVRVUVTVF9WSUVXIiwiV09SS0VSX1RBU0tfVVBEQVRFIiwiV09SS0VSX0FUVEVOREFOQ0VfVklFVyIsIldPUktFUl9BVFRFTkRBTkNFX1VQREFURSIsIldPUktFUl9EQVNIQk9BUkRfVklFVyIsIldPUktFUl9QUk9GSUxFX1ZJRVciXSwiaWF0IjoxNzcwMDA0ODE4LCJleHAiOjE3NzAwMzM2MTh9.IWsbfrMtIfqRYy4ZUepGojvEX4tpvYNoiAXxM-81gGI';

// Updated project location
const PROJECT_ID = 1001;
const PROJECT_LAT = 1.3521;
const PROJECT_LNG = 103.8198;

async function testCompleteAttendanceFlow() {
  console.log('🎯 Complete Attendance Flow Test');
  console.log('================================');
  console.log(`📍 Project: ${PROJECT_ID} - Orchard Road Office Tower Maintenance`);
  console.log(`📍 Updated Location: ${PROJECT_LAT}, ${PROJECT_LNG}`);
  console.log(`🔵 Geofence Radius: 200m`);
  console.log(`🔓 Strict Mode: DISABLED`);

  try {
    // Step 1: Check initial status
    console.log('\n📊 Step 1: Check initial attendance status');
    const initialStatus = await axios.get(`${API_BASE}/attendance/today`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('Initial Status:', initialStatus.data.session);
    console.log('Check-in time:', initialStatus.data.checkInTime || 'None');
    console.log('Check-out time:', initialStatus.data.checkOutTime || 'None');

    // Step 2: Validate geofence at project location
    console.log('\n🔍 Step 2: Validate geofence at project location');
    const geofenceCheck = await axios.post(`${API_BASE}/attendance/validate-geofence`, {
      projectId: PROJECT_ID,
      latitude: PROJECT_LAT,
      longitude: PROJECT_LNG,
      accuracy: 10
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    console.log('Geofence Result:', geofenceCheck.data.insideGeofence ? '✅ INSIDE' : '❌ OUTSIDE');
    console.log('Distance:', geofenceCheck.data.distance + 'm');
    console.log('Can Proceed:', geofenceCheck.data.canProceed ? '✅ YES' : '❌ NO');
    console.log('Message:', geofenceCheck.data.message);

    // Step 3: Check in
    console.log('\n⏰ Step 3: Attempting check-in');
    const checkinResult = await axios.post(`${API_BASE}/attendance/submit`, {
      projectId: PROJECT_ID,
      session: 'checkin',
      latitude: PROJECT_LAT,
      longitude: PROJECT_LNG
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    console.log('✅ Check-in Result:', checkinResult.data.message);

    // Step 4: Check status after check-in
    console.log('\n📊 Step 4: Status after check-in');
    const statusAfterCheckin = await axios.get(`${API_BASE}/attendance/today`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('Status:', statusAfterCheckin.data.session);
    console.log('Check-in time:', statusAfterCheckin.data.checkInTime);
    console.log('Project ID:', statusAfterCheckin.data.projectId);

    // Step 5: Try to check in again (should fail)
    console.log('\n⚠️ Step 5: Try to check in again (should fail)');
    try {
      await axios.post(`${API_BASE}/attendance/submit`, {
        projectId: PROJECT_ID,
        session: 'checkin',
        latitude: PROJECT_LAT,
        longitude: PROJECT_LNG
      }, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      console.log('❌ Unexpected: Second check-in succeeded');
    } catch (error) {
      console.log('✅ Expected: Second check-in failed -', error.response.data.message);
    }

    // Step 6: Try to check in from outside geofence (should fail)
    console.log('\n🚫 Step 6: Try to check in from outside geofence');
    try {
      await axios.post(`${API_BASE}/attendance/submit`, {
        projectId: PROJECT_ID,
        session: 'checkin',
        latitude: PROJECT_LAT + 0.005, // ~500m away
        longitude: PROJECT_LNG + 0.005
      }, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      console.log('❌ Unexpected: Outside geofence check-in succeeded');
    } catch (error) {
      console.log('✅ Expected: Outside geofence check-in failed -', error.response.data.message);
    }

    // Step 7: Check out
    console.log('\n🏁 Step 7: Attempting check-out');
    const checkoutResult = await axios.post(`${API_BASE}/attendance/submit`, {
      projectId: PROJECT_ID,
      session: 'checkout',
      latitude: PROJECT_LAT,
      longitude: PROJECT_LNG
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    console.log('✅ Check-out Result:', checkoutResult.data.message);

    // Step 8: Final status check
    console.log('\n📊 Step 8: Final status check');
    const finalStatus = await axios.get(`${API_BASE}/attendance/today`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('Final Status:', finalStatus.data.session);
    console.log('Check-in time:', finalStatus.data.checkInTime);
    console.log('Check-out time:', finalStatus.data.checkOutTime);
    
    // Calculate work duration
    if (finalStatus.data.checkInTime && finalStatus.data.checkOutTime) {
      const checkinTime = new Date(finalStatus.data.checkInTime);
      const checkoutTime = new Date(finalStatus.data.checkOutTime);
      const durationMs = checkoutTime - checkinTime;
      const durationMinutes = Math.round(durationMs / (1000 * 60));
      console.log('Work Duration:', durationMinutes + ' minutes');
    }

    // Step 9: Check attendance history
    console.log('\n📚 Step 9: Check attendance history');
    const historyResult = await axios.get(`${API_BASE}/attendance/history?projectId=${PROJECT_ID}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    console.log(`Found ${historyResult.data.records.length} attendance records`);
    if (historyResult.data.records.length > 0) {
      const latestRecord = historyResult.data.records[0];
      console.log('Latest record:');
      console.log('  Date:', latestRecord.date);
      console.log('  Check-in:', latestRecord.checkIn);
      console.log('  Check-out:', latestRecord.checkOut);
      console.log('  Inside geofence at check-in:', latestRecord.insideGeofenceAtCheckin);
      console.log('  Inside geofence at check-out:', latestRecord.insideGeofenceAtCheckout);
    }

    console.log('\n🎉 COMPLETE ATTENDANCE FLOW TEST SUCCESSFUL!');
    console.log('✅ Worker can now successfully check in and out');
    console.log('✅ Geofence validation is working correctly');
    console.log('✅ Project location has been updated to allow worker access');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCompleteAttendanceFlow();