import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const TEST_CONFIG = {
  // Use supervisor credentials from your database
  email: 'supervisor4@example.com',
  password: 'password123'
};

async function testTaskAssignmentEndpoints() {
  console.log('============================================================');
  console.log('🧪 TASK ASSIGNMENT ENDPOINTS TEST');
  console.log('============================================================\n');

  try {
    // Step 1: Login
    console.log('🔐 Step 1: Logging in as supervisor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_CONFIG.email,
      password: TEST_CONFIG.password
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Configure axios with token
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Test GET /supervisor/task-assignments
    console.log('📋 Step 2: Testing GET /supervisor/task-assignments...');
    try {
      const response = await api.get('/supervisor/task-assignments', {
        params: {
          limit: 10,
          offset: 0
        }
      });

      console.log('✅ GET /supervisor/task-assignments successful');
      console.log('Response structure:', {
        success: response.data.success,
        hasData: !!response.data.data,
        hasAssignments: !!response.data.data?.assignments,
        assignmentsCount: response.data.data?.assignments?.length || 0,
        hasSummary: !!response.data.data?.summary,
        hasPagination: !!response.data.data?.pagination
      });

      if (response.data.data?.assignments?.length > 0) {
        console.log('Sample assignment:', {
          assignmentId: response.data.data.assignments[0].assignmentId,
          taskName: response.data.data.assignments[0].taskName,
          workerName: response.data.data.assignments[0].workerName,
          status: response.data.data.assignments[0].status,
          priority: response.data.data.assignments[0].priority
        });
      }
      console.log('');
    } catch (error) {
      console.error('❌ GET /supervisor/task-assignments failed:', error.response?.data || error.message);
      console.log('');
    }

    // Step 3: Test with filters
    console.log('🔍 Step 3: Testing with filters (status=pending)...');
    try {
      const response = await api.get('/supervisor/task-assignments', {
        params: {
          status: 'pending',
          limit: 5
        }
      });

      console.log('✅ Filtered request successful');
      console.log('Pending assignments:', response.data.data?.assignments?.length || 0);
      console.log('');
    } catch (error) {
      console.error('❌ Filtered request failed:', error.response?.data || error.message);
      console.log('');
    }

    // Step 4: Test reassign endpoint (if we have an assignment)
    console.log('🔄 Step 4: Testing reassign endpoint...');
    try {
      // First get an assignment
      const assignmentsResponse = await api.get('/supervisor/task-assignments', {
        params: { limit: 1 }
      });

      if (assignmentsResponse.data.data?.assignments?.length > 0) {
        const assignment = assignmentsResponse.data.data.assignments[0];
        
        // Try to reassign (this might fail if assignment doesn't exist, but we're testing the endpoint)
        try {
          const reassignResponse = await api.post(
            `/supervisor/task-assignments/${assignment.assignmentId}/reassign`,
            {
              newWorkerId: assignment.workerId, // Reassign to same worker for testing
              reason: 'Testing reassignment endpoint',
              priority: 'normal',
              instructions: 'Test instructions'
            }
          );

          console.log('✅ Reassign endpoint successful');
          console.log('Response:', reassignResponse.data);
        } catch (error) {
          console.log('⚠️  Reassign endpoint exists but returned error (expected if no valid assignment)');
          console.log('Error:', error.response?.data?.errors || error.message);
        }
      } else {
        console.log('⚠️  No assignments found to test reassignment');
      }
      console.log('');
    } catch (error) {
      console.error('❌ Reassign test failed:', error.response?.data || error.message);
      console.log('');
    }

    // Step 5: Test priority update endpoint
    console.log('⬆️  Step 5: Testing priority update endpoint...');
    try {
      const assignmentsResponse = await api.get('/supervisor/task-assignments', {
        params: { limit: 1 }
      });

      if (assignmentsResponse.data.data?.assignments?.length > 0) {
        const assignment = assignmentsResponse.data.data.assignments[0];
        
        try {
          const priorityResponse = await api.put(
            `/supervisor/task-assignments/${assignment.assignmentId}/priority`,
            {
              priority: 'high',
              instructions: 'Updated priority for testing',
              estimatedHours: 8
            }
          );

          console.log('✅ Priority update endpoint successful');
          console.log('Response:', priorityResponse.data);
        } catch (error) {
          console.log('⚠️  Priority update endpoint exists but returned error (expected if no valid assignment)');
          console.log('Error:', error.response?.data?.errors || error.message);
        }
      } else {
        console.log('⚠️  No assignments found to test priority update');
      }
      console.log('');
    } catch (error) {
      console.error('❌ Priority update test failed:', error.response?.data || error.message);
      console.log('');
    }

    console.log('============================================================');
    console.log('✅ TASK ASSIGNMENT ENDPOINTS TEST COMPLETE');
    console.log('============================================================');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testTaskAssignmentEndpoints();
