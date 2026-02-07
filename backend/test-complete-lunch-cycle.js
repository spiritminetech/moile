import axios from 'axios';

const BASE_URL = 'http://192.168.1.8:5002';

async function testCompleteLunchCycle() {
  console.log('🍽️ Testing Complete Lunch Break Cycle');
  console.log('====================================');

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

    // Step 2: Check current status
    console.log('\n2️⃣ Checking current status...');
    let statusResponse = await axios.get(`${BASE_URL}/api/worker/attendance/status?projectId=${projectId}`, { headers });
    console.log(`   Status: ${statusResponse.data.status}`);
    console.log(`   Is on lunch: ${statusResponse.data.isOnLunchBreak}`);

    // Step 3: If on lunch break, end it first
    if (statusResponse.data.isOnLunchBreak) {
      console.log('\n3️⃣ Ending current lunch break...');
      
      try {
        const lunchEndResponse = await axios.post(`${BASE_URL}/api/worker/attendance/lunch-end`, {
          projectId: projectId,
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10
        }, { headers });

        console.log('✅ Lunch end successful');
        console.log('   Response:', lunchEndResponse.data.message);
      } catch (lunchEndError) {
        console.log('❌ Lunch end failed:', lunchEndError.response?.data?.message);
      }
    }

    // Step 4: Ensure user is clocked in
    statusResponse = await axios.get(`${BASE_URL}/api/worker/attendance/status?projectId=${projectId}`, { headers });
    
    if (statusResponse.data.status === 'NOT_CLOCKED_IN') {
      console.log('\n4️⃣ Clocking in...');
      
      try {
        await axios.post(`${BASE_URL}/api/worker/attendance/clock-in`, {
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

    // Step 5: Start lunch break
    console.log('\n5️⃣ Starting lunch break...');
    
    try {
      const lunchStartResponse = await axios.post(`${BASE_URL}/api/worker/attendance/lunch-start`, {
        projectId: projectId,
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 10
      }, { headers });

      console.log('✅ Lunch start successful!');
      console.log('   Message:', lunchStartResponse.data.message);
      console.log('   Lunch start time:', lunchStartResponse.data.lunchStartTime);

    } catch (lunchStartError) {
      console.log('❌ Lunch start failed:');
      console.log('   Status:', lunchStartError.response?.status);
      console.log('   Message:', lunchStartError.response?.data?.message);
      return;
    }

    // Step 6: Verify lunch break status
    console.log('\n6️⃣ Verifying lunch break status...');
    statusResponse = await axios.get(`${BASE_URL}/api/worker/attendance/status?projectId=${projectId}`, { headers });
    
    console.log(`   Status: ${statusResponse.data.status}`);
    console.log(`   Is on lunch: ${statusResponse.data.isOnLunchBreak}`);
    console.log(`   Lunch start time: ${statusResponse.data.lunchStartTime}`);

    // Step 7: End lunch break
    console.log('\n7️⃣ Ending lunch break...');
    
    try {
      const lunchEndResponse = await axios.post(`${BASE_URL}/api/worker/attendance/lunch-end`, {
        projectId: projectId,
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 10
      }, { headers });

      console.log('✅ Lunch end successful!');
      console.log('   Message:', lunchEndResponse.data.message);
      console.log('   Lunch end time:', lunchEndResponse.data.lunchEndTime);
      console.log('   Lunch duration:', lunchEndResponse.data.lunchDuration, 'minutes');

    } catch (lunchEndError) {
      console.log('❌ Lunch end failed:');
      console.log('   Status:', lunchEndError.response?.status);
      console.log('   Message:', lunchEndError.response?.data?.message);
    }

    // Step 8: Final status check
    console.log('\n8️⃣ Final status check...');
    statusResponse = await axios.get(`${BASE_URL}/api/worker/attendance/status?projectId=${projectId}`, { headers });
    
    console.log(`   Status: ${statusResponse.data.status}`);
    console.log(`   Is on lunch: ${statusResponse.data.isOnLunchBreak}`);
    console.log(`   Lunch start time: ${statusResponse.data.lunchStartTime}`);
    console.log(`   Lunch end time: ${statusResponse.data.lunchEndTime}`);

    console.log('\n🎉 LUNCH BREAK CYCLE TEST COMPLETED!');
    console.log('\n📱 The mobile app lunch break functionality should now work correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testCompleteLunchCycle();