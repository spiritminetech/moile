import axios from 'axios';

const BASE_URL = 'http://192.168.0.3:5002/api';

// Test credentials for supervisor
const SUPERVISOR_CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'password123'
};

async function testTaskAssignmentsFix() {
  try {
    console.log('🔐 Logging in as supervisor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, SUPERVISOR_CREDENTIALS);
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');

    // Test 1: Get all task assignments
    console.log('\n📋 Test 1: Fetching all task assignments...');
    const allAssignmentsResponse = await axios.get(`${BASE_URL}/supervisor/task-assignments`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (allAssignmentsResponse.data.success) {
      const { assignments, summary, pagination } = allAssignmentsResponse.data.data;
      console.log('✅ Task assignments fetched successfully');
      console.log(`   Total: ${pagination.total}`);
      console.log(`   Returned: ${assignments.length}`);
      console.log(`   Summary:`, summary);
      
      // Check first few assignments for proper data
      console.log('\n📝 Sample assignments:');
      assignments.slice(0, 3).forEach((assignment, index) => {
        console.log(`\n   Assignment ${index + 1}:`);
        console.log(`   - Task: ${assignment.taskName} (ID: ${assignment.taskId})`);
        console.log(`   - Worker: ${assignment.workerName} (ID: ${assignment.workerId})`);
        console.log(`   - Status: ${assignment.status}`);
        console.log(`   - Priority: ${assignment.priority}`);
        console.log(`   - Assigned: ${assignment.assignedAt}`);
      });

      // Verify no "Unknown" values
      const unknownTasks = assignments.filter(a => a.taskName === 'Unknown Task');
      const unknownWorkers = assignments.filter(a => a.workerName === 'Unknown Worker');
      
      if (unknownTasks.length > 0) {
        console.log(`\n⚠️  Warning: ${unknownTasks.length} assignments have "Unknown Task"`);
        console.log('   This might indicate missing task records in the database');
      } else {
        console.log('\n✅ All tasks have proper names');
      }

      if (unknownWorkers.length > 0) {
        console.log(`⚠️  Warning: ${unknownWorkers.length} assignments have "Unknown Worker"`);
        console.log('   This might indicate missing employee records in the database');
      } else {
        console.log('✅ All workers have proper names');
      }
    } else {
      console.error('❌ Failed to fetch task assignments:', allAssignmentsResponse.data);
    }

    // Test 2: Filter by project
    console.log('\n📋 Test 2: Fetching task assignments for project 1...');
    const projectAssignmentsResponse = await axios.get(`${BASE_URL}/supervisor/task-assignments`, {
      params: { projectId: 1 },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (projectAssignmentsResponse.data.success) {
      const { assignments, summary } = projectAssignmentsResponse.data.data;
      console.log('✅ Project-filtered assignments fetched successfully');
      console.log(`   Total for project 1: ${assignments.length}`);
      console.log(`   Summary:`, summary);
    }

    // Test 3: Filter by status
    console.log('\n📋 Test 3: Fetching in-progress task assignments...');
    const statusAssignmentsResponse = await axios.get(`${BASE_URL}/supervisor/task-assignments`, {
      params: { status: 'in_progress' },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (statusAssignmentsResponse.data.success) {
      const { assignments, summary } = statusAssignmentsResponse.data.data;
      console.log('✅ Status-filtered assignments fetched successfully');
      console.log(`   In-progress tasks: ${assignments.length}`);
      
      if (assignments.length > 0) {
        console.log('\n   Active tasks:');
        assignments.slice(0, 5).forEach(a => {
          console.log(`   - ${a.workerName}: ${a.taskName}`);
        });
      }
    }

    // Test 4: Pagination
    console.log('\n📋 Test 4: Testing pagination...');
    const page1Response = await axios.get(`${BASE_URL}/supervisor/task-assignments`, {
      params: { limit: 10, offset: 0 },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (page1Response.data.success) {
      const { pagination } = page1Response.data.data;
      console.log('✅ Pagination working correctly');
      console.log(`   Total: ${pagination.total}`);
      console.log(`   Limit: ${pagination.limit}`);
      console.log(`   Offset: ${pagination.offset}`);
      console.log(`   Has more: ${pagination.hasMore}`);
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testTaskAssignmentsFix();
