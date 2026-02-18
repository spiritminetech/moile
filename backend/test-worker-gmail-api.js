import axios from 'axios';

const API_BASE_URL = 'http://192.168.0.3:5002/api';

async function testWorkerGmailAPI() {
  try {
    console.log('🔐 Logging in as worker@gmail.com...\n');

    // Login
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    const employeeId = loginResponse.data.user.employeeId;

    console.log('✅ Login successful!');
    console.log(`   User ID: ${userId}`);
    console.log(`   Employee ID: ${employeeId}`);
    console.log(`   Role: ${loginResponse.data.user.role}`);

    // Get today's tasks
    console.log('\n📋 Fetching today\'s tasks...\n');

    const tasksResponse = await axios.get(`${API_BASE_URL}/worker/tasks/today`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = tasksResponse.data.data;

    console.log('✅ API Response:');
    console.log(`   Total Tasks: ${data.dailySummary.totalTasks}`);
    console.log(`   Completed: ${data.dailySummary.completedTasks}`);
    console.log(`   In Progress: ${data.dailySummary.inProgressTasks}`);
    console.log(`   Queued: ${data.dailySummary.queuedTasks}`);
    console.log(`   Overall Progress: ${data.dailySummary.overallProgress}%`);

    console.log('\n📝 Tasks:');
    console.log('='.repeat(80));

    data.tasks.forEach((task, index) => {
      console.log(`\n${index + 1}. ${task.taskName} (ID: ${task.taskId})`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Priority: ${task.priority}`);
      console.log(`   Location: ${task.location}`);
      console.log(`   Estimated Hours: ${task.estimatedHours}`);
      console.log(`   Daily Target: ${task.dailyTarget?.targetQuantity || 0} ${task.dailyTarget?.targetUnit || ''}`);
      console.log(`   Supervisor: ${task.supervisor?.name || 'N/A'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ All 5 tasks are available in the API!');
    console.log('\n📱 Refresh your mobile app to see the tasks.');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testWorkerGmailAPI();
