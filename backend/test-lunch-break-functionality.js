import axios from 'axios';

const BASE_URL = 'http://192.168.1.8:5002';

async function testLunchBreakFunctionality() {
  console.log('🍽️ Testing Lunch Break Functionality');
  console.log('===================================');

  try {
    // Step 1: Login
    console.log('\n1️⃣ Login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'worker1@gmail.com',
      password: 'password123'
    });

    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    const projectId = loginResponse.data.user.currentProject?.id || 1;

    // Step 2: Check current attendance status
    console.log('\n2️⃣ Checking attendance status...');
    const statusResponse = await axios.get(`${BASE_URL}/api/worker/attendance/status?projectId=${projectId}`, { headers });
    
    console.log('Current status:', statusResponse.data.status);
    console.log('Session:', statusResponse.data.session);
    console.log('Check-in time:', statusResponse.data.checkInTime);
    console.log('Lunch start time:', statusResponse.data.lunchStartTime);
    console.log('Is on lunch break:', statusResponse.data.isOnLunchBreak);

    // Step 3: Ensure user is clocked in
    if (statusResponse.data.status === 'NOT_CLOCKED_IN') {
      console.log('\n🔧 User not clocked in, clocking in first...');
      
      try {
        const clockInResponse = await axios.post(`${BASE_URL}/api/worker/attendance/clock-in`, {
          projectId: projectId,
          latitude: 12.9716,
          longitude: 77.5946
        }, { headers });
        
        console.log('✅ Clock-in successful');
      } catch (clockInError) {
        console.log('❌ Clock-in failed:', clockInError.response?.data?.message);
        return;
      }
    }

    // Step 4: Test lunch start
    console.log('\n3️⃣ Testing lunch start...');
    
    try {
      const lunchStartResponse = await axios.post(`${BASE_URL}/api/worker/attendance/lunch-start`, {
        projectId: projectId,
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 10
      }, { headers });

      console.log('✅ Lunch start successful!');
      console.log('Response:', lunchStartResponse.data);

    } catch (lunchStartError) {
      console.log('❌ Lunch start failed:');
      console.log('Status:', lunchStartError.response?.status);
      console.log('Message:', lunchStartError.response?.data?.message);
      console.log('Full response:', lunchStartError.response?.data);
      
      // Check specific error conditions
      const errorMessage = lunchStartError.response?.data?.message;
      
      if (errorMessage === 'Must be clocked in to start lunch break') {
        console.log('🔍 Issue: User is not clocked in');
      } else if (errorMessage === 'Cannot start lunch break after clocking out') {
        console.log('🔍 Issue: User has already clocked out');
      } else if (errorMessage === 'Lunch break already started') {
        console.log('🔍 Issue: Lunch break already in progress');
      } else if (errorMessage === 'Lunch break start failed') {
        console.log('🔍 Issue: Server error occurred (check backend logs)');
      } else {
        console.log('🔍 Issue: Unknown error');
      }
    }

    // Step 5: Check status after lunch start attempt
    console.log('\n4️⃣ Checking status after lunch start attempt...');
    const finalStatusResponse = await axios.get(`${BASE_URL}/api/worker/attendance/status?projectId=${projectId}`, { headers });
    
    console.log('Final status:', finalStatusResponse.data.status);
    console.log('Is on lunch break:', finalStatusResponse.data.isOnLunchBreak);
    console.log('Lunch start time:', finalStatusResponse.data.lunchStartTime);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testLunchBreakFunctionality();