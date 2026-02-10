import axios from 'axios';

const API_BASE = 'http://192.168.1.6:5002/api';

// Get a fresh token for worker@gmail.com
async function testBangaloreAttendance() {
  console.log('🇮🇳 Testing Bangalore Attendance System');
  console.log('======================================');
  console.log('📍 Location: Bangalore, India');
  console.log('📍 Coordinates: 12.865145716526893, 77.64679448904312');
  console.log('📋 Project: 1003 - Jurong Industrial Complex Renovation');

  try {
    // Step 1: Login to get fresh token
    console.log('\n🔐 Step 1: Getting fresh authentication token...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('User:', loginResponse.data.user.email);
    console.log('Company:', loginResponse.data.company.name);
    console.log('Role:', loginResponse.data.company.role);

    // Step 2: Test geofence validation for Project 1003
    console.log('\n🔍 Step 2: Testing geofence validation for Project 1003...');
    const geofenceResponse = await axios.post(`${API_BASE}/attendance/validate-geofence`, {
      projectId: 1003,
      latitude: 12.865145716526893,
      longitude: 77.64679448904312,
      accuracy: 9.269959866349932
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Geofence Result:', geofenceResponse.data);
    console.log('Inside Geofence:', geofenceResponse.data.insideGeofence ? '✅ YES' : '❌ NO');
    console.log('Distance:', geofenceResponse.data.distance + 'm');
    console.log('Can Proceed:', geofenceResponse.data.canProceed ? '✅ YES' : '❌ NO');

    // Step 3: Check current attendance status
    console.log('\n📊 Step 3: Checking current attendance status...');
    const statusResponse = await axios.get(`${API_BASE}/attendance/today`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Current Status:', statusResponse.data.session);
    console.log('Check-in Time:', statusResponse.data.checkInTime || 'None');
    console.log('Check-out Time:', statusResponse.data.checkOutTime || 'None');

    // Step 4: Attempt check-in
    console.log('\n⏰ Step 4: Attempting check-in for Project 1003...');
    try {
      const checkinResponse = await axios.post(`${API_BASE}/attendance/submit`, {
        projectId: 1003,
        session: 'checkin',
        latitude: 12.865145716526893,
        longitude: 77.64679448904312
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Check-in Result:', checkinResponse.data.message);
    } catch (checkinError) {
      console.log('❌ Check-in Failed:', checkinError.response?.data?.message || checkinError.message);
    }

    // Step 5: Check status after check-in attempt
    console.log('\n📊 Step 5: Status after check-in attempt...');
    const finalStatusResponse = await axios.get(`${API_BASE}/attendance/today`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Final Status:', finalStatusResponse.data.session);
    console.log('Check-in Time:', finalStatusResponse.data.checkInTime || 'None');
    console.log('Project ID:', finalStatusResponse.data.projectId || 'None');

    // Step 6: Test with wrong project ID (should fail)
    console.log('\n❌ Step 6: Testing with wrong Project ID 2 (should fail)...');
    try {
      const wrongProjectResponse = await axios.post(`${API_BASE}/attendance/validate-geofence`, {
        projectId: 2,
        latitude: 12.865145716526893,
        longitude: 77.64679448904312,
        accuracy: 9.269959866349932
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('⚠️ Unexpected success with Project 2:', wrongProjectResponse.data);
    } catch (wrongProjectError) {
      console.log('✅ Expected failure with Project 2:', wrongProjectError.response?.data?.message || wrongProjectError.message);
    }

    console.log('\n🎉 BANGALORE ATTENDANCE TEST COMPLETE!');
    console.log('✅ Use Project ID 1003 for attendance in Bangalore');
    console.log('❌ Project ID 2 does not exist (hence "Project not found" error)');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testBangaloreAttendance();