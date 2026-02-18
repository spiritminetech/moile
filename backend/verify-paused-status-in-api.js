import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5002/api';

async function verifyPausedStatus() {
  try {
    console.log('🔍 Verifying Paused Status in API Response...\n');

    // Login
    console.log('1️⃣ Logging in as worker@gmail.com...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Get today's tasks
    console.log('2️⃣ Fetching today\'s tasks...');
    const tasksResponse = await axios.get(`${API_BASE_URL}/worker/tasks/today`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Tasks fetched successfully\n');
    
    const tasks = tasksResponse.data.data?.tasks || [];
    
    console.log('📊 TASK STATUS SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total tasks: ${tasks.length}\n`);
    
    // Group by status
    const statusGroups = tasks.reduce((acc, task) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    }, {});
    
    Object.keys(statusGroups).forEach(status => {
      console.log(`\n${status.toUpperCase()}: ${statusGroups[status].length} tasks`);
      statusGroups[status].forEach(task => {
        console.log(`  - Task ${task.assignmentId}: ${task.taskName}`);
      });
    });
    
    console.log('\n' + '='.repeat(70));
    
    // Check for paused tasks specifically
    const pausedTasks = tasks.filter(t => t.status === 'paused');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    
    console.log('\n✅ VERIFICATION RESULTS:');
    console.log(`   Paused tasks: ${pausedTasks.length}`);
    console.log(`   In-progress tasks: ${inProgressTasks.length}`);
    
    if (pausedTasks.length > 0) {
      console.log('\n⏸️  PAUSED TASKS DETAILS:');
      pausedTasks.forEach(task => {
        console.log(`\n   Task ${task.assignmentId}: ${task.taskName}`);
        console.log(`   - Status: ${task.status}`);
        console.log(`   - Started: ${task.startTime ? 'Yes' : 'No'}`);
        console.log(`   - Can Start: ${task.canStart}`);
      });
    }
    
    if (inProgressTasks.length === 1) {
      console.log('\n✅ GOOD: Only ONE task is in_progress');
      console.log(`   Task ${inProgressTasks[0].assignmentId}: ${inProgressTasks[0].taskName}`);
    } else if (inProgressTasks.length > 1) {
      console.log('\n❌ ERROR: Multiple tasks are in_progress!');
      inProgressTasks.forEach(task => {
        console.log(`   - Task ${task.assignmentId}: ${task.taskName}`);
      });
    } else {
      console.log('\n⚠️  WARNING: No tasks are in_progress');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n💡 MOBILE APP INSTRUCTIONS:');
    console.log('   1. Close the mobile app completely');
    console.log('   2. Clear app cache (if possible)');
    console.log('   3. Reopen the app and login again');
    console.log('   4. Navigate to Today\'s Tasks screen');
    console.log('   5. You should see:');
    console.log('      - Tasks 7034 and 7037 with "Resume Task" button (orange)');
    console.log('      - Task 7040 with "Continue Working" button (green)');
    console.log('      - Other tasks with "Start Task" button (blue)');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

verifyPausedStatus();
