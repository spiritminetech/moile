import axios from 'axios';

const BASE_URL = 'http://192.168.1.8:5002/api';

async function testActiveTasks() {
  try {
    console.log('=== TESTING ACTIVE TASKS API ===\n');

    // Step 1: Login (first step)
    console.log('Step 1: Logging in as supervisor@gmail.com...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    console.log('✅ Login step 1 successful!');
    console.log('   Companies:', loginResponse.data.companies.length);
    
    // Step 2: Select company (second step)
    console.log('\nStep 2: Selecting company...');
    const selectResponse = await axios.post(`${BASE_URL}/auth/select-company`, {
      userId: loginResponse.data.userId,
      companyId: 1,
      role: 'SUPERVISOR'
    });

    if (!selectResponse.data.token) {
      console.log('❌ Company selection failed - no token received');
      console.log('Response:', JSON.stringify(selectResponse.data, null, 2));
      return;
    }

    console.log('✅ Company selected successfully!');
    console.log(`   Token: ${selectResponse.data.token.substring(0, 20)}...`);
    const token = selectResponse.data.token;

    // Step 3: Get active tasks for project 1
    console.log('\nStep 3: Getting active tasks for project 1...');
    console.log(`   URL: ${BASE_URL}/supervisor/active-tasks/1\n`);

    const tasksResponse = await axios.get(
      `${BASE_URL}/supervisor/active-tasks/1`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ API Response:');
    console.log(JSON.stringify(tasksResponse.data, null, 2));

    // Analyze the response
    const { activeTasks, summary } = tasksResponse.data;
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total Active Tasks: ${summary.totalActive}`);
    console.log(`Queued: ${summary.queued}`);
    console.log(`In Progress: ${summary.inProgress}`);
    
    if (activeTasks.length > 0) {
      console.log('\n=== ACTIVE TASKS ===');
      activeTasks.forEach((task, index) => {
        console.log(`\n${index + 1}. ${task.taskName}`);
        console.log(`   Assignment ID: ${task.assignmentId}`);
        console.log(`   Worker: ${task.workerName} (ID: ${task.employeeId})`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Sequence: ${task.sequence}`);
        if (task.dailyTarget) {
          console.log(`   Daily Target: ${task.dailyTarget.quantity} ${task.dailyTarget.unit}`);
        }
      });
    } else {
      console.log('\n⚠️ No active tasks found!');
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testActiveTasks();
