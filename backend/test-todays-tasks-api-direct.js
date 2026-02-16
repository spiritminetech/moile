import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5002/api';

async function testTodaysTasksAPI() {
  try {
    console.log('🔍 Testing Today\'s Tasks API...\n');

    // First login to get token
    console.log('1️⃣ Logging in as worker@gmail.com...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 50) + '...\n');

    // Get today's tasks
    console.log('2️⃣ Fetching today\'s tasks...');
    const tasksResponse = await axios.get(`${API_BASE_URL}/worker/tasks/today`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Tasks fetched successfully\n');
    console.log('📊 Response structure:');
    console.log({
      success: tasksResponse.data.success,
      hasData: !!tasksResponse.data.data,
      hasTasks: !!tasksResponse.data.data?.tasks,
      tasksCount: tasksResponse.data.data?.tasks?.length || 0
    });

    if (tasksResponse.data.data?.tasks && tasksResponse.data.data.tasks.length > 0) {
      console.log('\n📋 First task details:');
      const firstTask = tasksResponse.data.data.tasks[0];
      console.log({
        assignmentId: firstTask.assignmentId,
        taskName: firstTask.taskName,
        status: firstTask.status,
        supervisorName: firstTask.supervisorName,
        supervisorContact: firstTask.supervisorContact,
        supervisorEmail: firstTask.supervisorEmail,
        projectId: firstTask.projectId,
        projectName: firstTask.projectName
      });

      console.log('\n👔 Supervisor info from response:');
      console.log({
        hasSupervisorAtTopLevel: !!tasksResponse.data.data.supervisor,
        supervisorAtTopLevel: tasksResponse.data.data.supervisor
      });

      console.log('\n📋 All tasks supervisor info:');
      tasksResponse.data.data.tasks.forEach((task, index) => {
        console.log(`Task ${index + 1} (${task.taskName}):`);
        console.log({
          supervisorName: task.supervisorName,
          supervisorContact: task.supervisorContact,
          supervisorEmail: task.supervisorEmail
        });
      });
      
      console.log('\n📦 Raw first task from API:');
      console.log(JSON.stringify(tasksResponse.data.data.tasks[0], null, 2));
    } else {
      console.log('\n⚠️ No tasks found in response');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('\n💡 This might mean no tasks are assigned for today');
    }
  }
}

testTodaysTasksAPI();
