import axios from 'axios';

const BASE_URL = 'http://192.168.1.6:5002/api';

async function testDailyTargetUpdate() {
  try {
    console.log('🧪 Testing Daily Target Update - Complete Flow\n');
    console.log('=' .repeat(60));

    // Step 1: Login as supervisor
    console.log('\n1️⃣ Logging in as supervisor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'Password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Step 2: Test updating daily target
    console.log('\n2️⃣ Testing daily target update...');
    const updateData = {
      assignmentId: 2,
      changes: {
        dailyTarget: {
          quantity: 150,
          unit: 'cubic meters',
          description: 'Updated target for concrete pouring'
        }
      }
    };

    console.log('📤 Update request:');
    console.log(JSON.stringify(updateData, null, 2));

    const updateResponse = await axios.put(
      `${BASE_URL}/supervisor/update-assignment`,
      updateData,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Daily target updated successfully!');
    console.log('📊 Response:');
    console.log(JSON.stringify(updateResponse.data, null, 2));

    // Step 3: Test updating priority
    console.log('\n3️⃣ Testing priority update...');
    const priorityUpdate = {
      assignmentId: 2,
      changes: {
        priority: 'urgent'
      }
    };

    const priorityResponse = await axios.put(
      `${BASE_URL}/supervisor/update-assignment`,
      priorityUpdate,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Priority updated successfully!');
    console.log('📊 Response:');
    console.log(JSON.stringify(priorityResponse.data, null, 2));

    // Step 4: Test updating time estimate
    console.log('\n4️⃣ Testing time estimate update...');
    const timeUpdate = {
      assignmentId: 2,
      changes: {
        timeEstimate: {
          estimated: 300,
          unit: 'minutes'
        }
      }
    };

    const timeResponse = await axios.put(
      `${BASE_URL}/supervisor/update-assignment`,
      timeUpdate,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Time estimate updated successfully!');
    console.log('📊 Response:');
    console.log(JSON.stringify(timeResponse.data, null, 2));

    // Step 5: Test combined update
    console.log('\n5️⃣ Testing combined update (multiple fields)...');
    const combinedUpdate = {
      assignmentId: 3,
      changes: {
        priority: 'high',
        dailyTarget: {
          quantity: 75,
          unit: 'steel bars',
          description: 'Reinforcement installation target'
        },
        status: 'in_progress'
      }
    };

    const combinedResponse = await axios.put(
      `${BASE_URL}/supervisor/update-assignment`,
      combinedUpdate,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Combined update successful!');
    console.log('📊 Response:');
    console.log(JSON.stringify(combinedResponse.data, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('🎉 All tests passed! Daily target update is working correctly.');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Test failed:');
    console.error('='.repeat(60));
    
    if (error.response) {
      console.error('\n📊 Response Details:');
      console.error('   Status:', error.response.status);
      console.error('   Status Text:', error.response.statusText);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 500) {
        console.error('\n💡 Troubleshooting:');
        console.error('   - Make sure the backend server is running');
        console.error('   - Restart the backend server to pick up code changes');
        console.error('   - Check backend console for detailed error logs');
      } else if (error.response.status === 404) {
        console.error('\n💡 Troubleshooting:');
        console.error('   - Assignment ID may not exist');
        console.error('   - Run: node check-assignments.js to see available IDs');
      } else if (error.response.status === 401) {
        console.error('\n💡 Troubleshooting:');
        console.error('   - Check supervisor credentials');
        console.error('   - Email: supervisor@gmail.com');
        console.error('   - Password: Password123');
      }
    } else if (error.request) {
      console.error('\n📡 Network Error:');
      console.error('   No response received from server');
      console.error('   Make sure backend is running on:', BASE_URL);
    } else {
      console.error('\n⚠️ Error:', error.message);
    }
    
    console.error('\n' + '='.repeat(60));
  }
}

testDailyTargetUpdate();
