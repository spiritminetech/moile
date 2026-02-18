// Test API response for employee 107
import axios from 'axios';

async function testAPI() {
  try {
    // First login
    console.log('🔐 Logging in as worker@gmail.com...');
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'worker@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('Employee ID:', loginResponse.data.user.employeeId);

    // Get today's tasks
    console.log('\n📋 Fetching today\'s tasks...');
    const tasksResponse = await axios.get('http://localhost:5002/api/worker/tasks/today', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('\n📊 API Response:');
    console.log('Success:', tasksResponse.data.success);
    console.log('Tasks count:', tasksResponse.data.data?.tasks?.length || 0);
    
    if (tasksResponse.data.data?.tasks) {
      console.log('\nTasks:');
      tasksResponse.data.data.tasks.forEach((task, index) => {
        console.log(`\n${index + 1}. ${task.taskName}`);
        console.log(`   Assignment ID: ${task.assignmentId}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Priority: ${task.priority}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAPI();
