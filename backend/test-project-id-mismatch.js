import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const testProjectIdMismatch = async () => {
  try {
    console.log('\n🔍 TESTING PROJECT ID MISMATCH ISSUE\n');

    const baseURL = 'http://localhost:5002/api';

    // 1. Login
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // 2. Check current attendance status
    const statusResponse = await axios.get(
      `${baseURL}/worker/attendance/today`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    console.log('\n2. Current attendance status:');
    console.log(`   Session: ${statusResponse.data.session}`);
    console.log(`   Check-in time: ${statusResponse.data.checkInTime}`);
    console.log(`   Current project: ${statusResponse.data.projectId}`);

    const currentProjectId = statusResponse.data.projectId;

    // 3. Test clock-out with WRONG project ID (what mobile app is sending)
    console.log('\n3. Testing clock-out with WRONG project ID (1):');
    
    try {
      await axios.post(
        `${baseURL}/worker/attendance/clock-out`,
        {
          projectId: 1, // WRONG - mobile app is sending this
          latitude: 12.865136148158664,
          longitude: 77.64681918905183,
          accuracy: 9.570185171553103
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('   ✅ Unexpected success with wrong project ID');
    } catch (error) {
      console.log('   ❌ Failed with wrong project ID:', error.response?.data?.message);
      console.log('   This is the error the mobile app is getting!');
    }

    // 4. Test clock-out with CORRECT project ID
    console.log(`\n4. Testing clock-out with CORRECT project ID (${currentProjectId}):`);
    
    try {
      const correctResponse = await axios.post(
        `${baseURL}/worker/attendance/clock-out`,
        {
          projectId: currentProjectId, // CORRECT - should work
          latitude: 12.865136148158664,
          longitude: 77.64681918905183,
          accuracy: 9.570185171553103
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('   ✅ Success with correct project ID:', correctResponse.data.message);
    } catch (error) {
      console.log('   ❌ Failed even with correct project ID:', error.response?.data?.message);
    }

    // 5. Explain the solution
    console.log('\n5. 🎯 SOLUTION:');
    console.log(`   The mobile app is sending projectId: 1`);
    console.log(`   But the user is checked in to projectId: ${currentProjectId}`);
    console.log('   ');
    console.log('   The mobile app needs to:');
    console.log('   1. Get the correct project ID from the user\'s currentProject');
    console.log('   2. Use that project ID for all attendance actions');
    console.log('   3. Stop falling back to project ID 1');

    // 6. Check what the mobile app should be getting
    console.log('\n6. What the mobile app should be getting:');
    console.log(`   user.currentProject.id: ${loginResponse.data.user?.currentProject?.id || 'Missing!'}`);
    
    if (loginResponse.data.user?.currentProject?.id) {
      console.log('   ✅ Mobile app should use this project ID');
    } else {
      console.log('   ❌ Mobile app currentProject is missing - this is the problem!');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testProjectIdMismatch();