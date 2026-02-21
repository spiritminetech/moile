import axios from 'axios';

const BASE_URL = 'http://192.168.1.6:5002';

async function testDailyTargetsUpdate() {
  try {
    console.log('=== Testing Daily Targets Update API ===\n');

    // Step 1: Login as supervisor
    console.log('Step 1: Logging in as supervisor...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'supervisor@company.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✓ Login successful\n');

    // Step 2: Get active tasks to find assignment IDs
    console.log('Step 2: Getting active tasks for project 1...');
    const tasksResponse = await axios.get(
      `${BASE_URL}/api/supervisor/active-tasks/1`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log(`✓ Found ${tasksResponse.data.length} active tasks`);
    
    if (tasksResponse.data.length > 0) {
      const firstAssignment = tasksResponse.data[0];
      console.log(`\nFirst assignment ID: ${firstAssignment.id}`);
      console.log(`Task: ${firstAssignment.taskName}`);
      console.log(`Worker: ${firstAssignment.workerName}`);
      console.log(`Current target: ${JSON.stringify(firstAssignment.dailyTarget)}\n`);

      // Step 3: Update daily target
      console.log('Step 3: Updating daily target...');
      const updateData = {
        assignmentUpdates: [
          {
            assignmentId: firstAssignment.id,
            dailyTarget: {
              quantity: 75,
              unit: 'cubic meters'
            }
          }
        ]
      };

      console.log('Request body:', JSON.stringify(updateData, null, 2));

      const updateResponse = await axios.put(
        `${BASE_URL}/api/supervisor/daily-targets`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('\n✓ Update successful!');
      console.log('Response:', JSON.stringify(updateResponse.data, null, 2));

      // Step 4: Verify the update
      console.log('\nStep 4: Verifying the update...');
      const verifyResponse = await axios.get(
        `${BASE_URL}/api/supervisor/active-tasks/1`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const updatedAssignment = verifyResponse.data.find(
        a => a.id === firstAssignment.id
      );

      if (updatedAssignment) {
        console.log('✓ Verification successful!');
        console.log(`New target: ${JSON.stringify(updatedAssignment.dailyTarget)}`);
      }

      // Test multiple updates
      console.log('\n\nStep 5: Testing multiple assignment updates...');
      if (tasksResponse.data.length >= 2) {
        const multiUpdateData = {
          assignmentUpdates: tasksResponse.data.slice(0, 2).map((task, index) => ({
            assignmentId: task.id,
            dailyTarget: {
              quantity: 50 + (index * 25),
              unit: 'units'
            }
          }))
        };

        console.log('Request body:', JSON.stringify(multiUpdateData, null, 2));

        const multiUpdateResponse = await axios.put(
          `${BASE_URL}/api/supervisor/daily-targets`,
          multiUpdateData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('\n✓ Multiple updates successful!');
        console.log('Response:', JSON.stringify(multiUpdateResponse.data, null, 2));
      }

    } else {
      console.log('⚠ No active tasks found. Please create some task assignments first.');
    }

    console.log('\n=== All Tests Completed Successfully ===');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDailyTargetsUpdate();
