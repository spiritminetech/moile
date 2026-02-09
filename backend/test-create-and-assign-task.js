import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const TEST_CONFIG = {
  email: 'supervisor4@example.com',
  password: 'password123'
};

async function testCreateAndAssignTask() {
  console.log('============================================================');
  console.log('🧪 CREATE AND ASSIGN TASK ENDPOINT TEST');
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

    // Step 2: Get supervisor's projects
    console.log('📋 Step 2: Getting supervisor projects...');
    const projectsResponse = await api.get('/supervisor/projects');
    
    if (!projectsResponse.data.success || !projectsResponse.data.data?.length) {
      console.error('❌ No projects found for supervisor');
      return;
    }

    const project = projectsResponse.data.data[0];
    console.log('✅ Found project:', project.projectName, '(ID:', project.id, ')\n');

    // Step 3: Get team members
    console.log('👥 Step 3: Getting team members...');
    const teamResponse = await api.get('/supervisor/team-list', {
      params: { projectId: project.id }
    });

    if (!teamResponse.data.success || !teamResponse.data.workers?.length) {
      console.error('❌ No team members found');
      return;
    }

    const worker = teamResponse.data.workers[0];
    console.log('✅ Found worker:', worker.workerName, '(ID:', worker.employeeId, ')\n');

    // Step 4: Create and assign a new task
    console.log('🎯 Step 4: Creating and assigning new task...');
    const taskData = {
      taskName: 'Test Task - ' + new Date().toLocaleTimeString(),
      description: 'This is a test task created via the mobile app endpoint',
      employeeId: worker.employeeId,
      projectId: project.id,
      priority: 'normal',
      estimatedHours: 4,
      instructions: 'Please complete this test task carefully',
      date: new Date().toISOString().split('T')[0]
    };

    console.log('Task data:', {
      taskName: taskData.taskName,
      worker: worker.workerName,
      project: project.projectName,
      priority: taskData.priority,
      estimatedHours: taskData.estimatedHours
    });

    try {
      const createResponse = await api.post('/supervisor/create-and-assign-task', taskData);

      if (createResponse.data.success) {
        console.log('\n✅ Task created and assigned successfully!');
        console.log('Response:', {
          taskId: createResponse.data.data.taskId,
          assignmentId: createResponse.data.data.assignmentId,
          taskName: createResponse.data.data.taskName,
          sequence: createResponse.data.data.sequence
        });
      } else {
        console.error('❌ Failed to create task:', createResponse.data.errors);
      }
    } catch (error) {
      console.error('❌ Error creating task:', error.response?.data || error.message);
      if (error.response?.data) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // Step 5: Verify the task was created
    console.log('\n🔍 Step 5: Verifying task assignment...');
    try {
      const assignmentsResponse = await api.get('/supervisor/task-assignments', {
        params: {
          projectId: project.id,
          workerId: worker.employeeId,
          limit: 5
        }
      });

      if (assignmentsResponse.data.success) {
        const assignments = assignmentsResponse.data.data.assignments;
        console.log('✅ Found', assignments.length, 'assignments for this worker');
        
        if (assignments.length > 0) {
          const latestAssignment = assignments[0];
          console.log('Latest assignment:', {
            taskName: latestAssignment.taskName,
            status: latestAssignment.status,
            priority: latestAssignment.priority,
            assignedAt: new Date(latestAssignment.assignedAt).toLocaleString()
          });
        }
      }
    } catch (error) {
      console.error('⚠️  Could not verify assignment:', error.message);
    }

    console.log('\n============================================================');
    console.log('✅ TEST COMPLETE');
    console.log('============================================================');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testCreateAndAssignTask();
