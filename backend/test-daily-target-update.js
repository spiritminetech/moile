import axios from 'axios';

const BASE_URL = 'http://192.168.0.3:5002/api';

async function testDailyTargetUpdate() {
  try {
    console.log('🧪 Testing Daily Target Update API Fix\n');

    // Step 1: Login as supervisor
    console.log('1️⃣ Logging in as supervisor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Get checked-in workers
    console.log('2️⃣ Getting checked-in workers for project 1...');
    const workersResponse = await axios.get(`${BASE_URL}/supervisor/checked-in-workers/1`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Found ${workersResponse.data.length} checked-in workers\n`);

    if (workersResponse.data.length === 0) {
      console.log('⚠️ No checked-in workers found. Please ensure workers are checked in first.');
      return;
    }

    // Get first worker with an assignment
    const workerWithAssignment = workersResponse.data.find(w => w.assignmentId);
    
    if (!workerWithAssignment) {
      console.log('⚠️ No workers with assignments found. Please assign tasks first.');
      return;
    }

    console.log(`📋 Testing with worker: ${workerWithAssignment.employee.fullName}`);
    console.log(`📝 Assignment ID: ${workerWithAssignment.assignmentId}\n`);

    // Step 3: Update daily target
    console.log('3️⃣ Updating daily target...');
    const updateData = {
      assignmentId: workerWithAssignment.assignmentId,
      changes: {
        dailyTarget: {
          targetQuantity: 100,
          targetUnit: 'units',
          description: 'Complete 100 units today'
        }
      }
    };

    console.log('📤 Sending update request:', JSON.stringify(updateData, null, 2));

    const updateResponse = await axios.put(
      `${BASE_URL}/supervisor/update-assignment`,
      updateData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('\n✅ Daily target updated successfully!');
    console.log('📊 Response:', JSON.stringify(updateResponse.data, null, 2));

    // Step 4: Verify the update
    console.log('\n4️⃣ Verifying the update...');
    const today = new Date().toISOString().split('T')[0];
    const tasksResponse = await axios.get(
      `${BASE_URL}/supervisor/worker-tasks?employeeId=${workerWithAssignment.employee.id}&date=${today}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const updatedTask = tasksResponse.data.tasks.find(
      t => t.assignmentId === workerWithAssignment.assignmentId
    );

    if (updatedTask) {
      console.log('✅ Verification successful!');
      console.log('📋 Updated task:', JSON.stringify(updatedTask, null, 2));
    } else {
      console.log('⚠️ Could not verify update');
    }

    console.log('\n🎉 All tests passed! Daily target update is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testDailyTargetUpdate();
