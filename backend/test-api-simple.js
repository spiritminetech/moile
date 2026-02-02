// Simple test using Node.js built-in fetch (Node 18+)
const API_BASE = 'http://localhost:5002/api';

// Test credentials
const testCredentials = {
  email: 'testworker@company.com',
  password: 'password123'
};

let authToken = null;

async function login() {
  try {
    console.log('🔐 Testing login...');
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCredentials)
    });
    
    const data = await response.json();
    
    if (data.success && data.data.token) {
      authToken = data.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

async function testTodaysTasks() {
  try {
    console.log('\n📋 Testing today\'s tasks endpoint...');
    const response = await fetch(`${API_BASE}/worker/tasks/today`, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Today\'s tasks endpoint working');
      console.log(`   - Found ${data.data.tasks?.length || 0} tasks`);
      console.log(`   - Project: ${data.data.project?.name || 'N/A'}`);
      return data.data.tasks?.[0]; // Return first task for further testing
    } else {
      console.log('❌ Today\'s tasks failed:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Today\'s tasks error:', error.message);
    return null;
  }
}

async function testProgressUpdate(task) {
  if (!task) {
    console.log('\n⏭️ Skipping progress update test - no task available');
    return false;
  }

  try {
    console.log('\n📈 Testing progress update...');
    const response = await fetch(`${API_BASE}/worker/task-progress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assignmentId: task.assignmentId,
        progressPercent: 30,
        description: 'Test progress update from API integration test',
        notes: 'This is a test note',
        location: {
          latitude: 40.7130,
          longitude: -74.0058,
          accuracy: 5,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Progress update working');
      console.log(`   - Progress updated to 30%`);
      return true;
    } else {
      console.log('❌ Progress update failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Progress update error:', error.message);
    return false;
  }
}

async function testIssueReporting(task) {
  if (!task) {
    console.log('\n⏭️ Skipping issue reporting test - no task available');
    return false;
  }

  try {
    console.log('\n⚠️ Testing issue reporting...');
    const response = await fetch(`${API_BASE}/worker/task/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assignmentId: task.assignmentId,
        issueType: 'technical_problem',
        priority: 'medium',
        description: 'Test issue report from API integration test - this is a test issue to verify the endpoint is working correctly.',
        location: {
          latitude: 40.7130,
          longitude: -74.0058,
          workArea: task.workArea || 'Test Area'
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Issue reporting working');
      console.log(`   - Issue ticket: ${data.data.ticketNumber}`);
      console.log(`   - Issue ID: ${data.data.issueId}`);
      return true;
    } else {
      console.log('❌ Issue reporting failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Issue reporting error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting API Integration Tests');
  console.log('=====================================\n');

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  // Step 2: Get today's tasks
  const firstTask = await testTodaysTasks();

  // Step 3: Test progress update (if task available)
  await testProgressUpdate(firstTask);

  // Step 4: Test issue reporting (if task available)
  await testIssueReporting(firstTask);

  console.log('\n🏁 API Integration Tests Complete');
  console.log('=====================================');
}

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test runner error:', error);
});