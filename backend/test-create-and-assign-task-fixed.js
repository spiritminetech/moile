import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5002/api';

async function testCreateAndAssignTask() {
  console.log('🧪 Testing Create and Assign Task (Fixed)...\n');

  try {
    // Step 1: Login as supervisor
    console.log('Step 1: Logging in as supervisor...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.token;
    const supervisorId = loginResponse.data.user.id;
    console.log('✅ Logged in as supervisor:', loginResponse.data.user.fullName);
    console.log('   Supervisor ID:', supervisorId);

    // Step 2: Get supervisor's projects
    console.log('\nStep 2: Getting supervisor projects...');
    const projectsResponse = await axios.get(`${API_BASE_URL}/supervisor/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!projectsResponse.data.success || projectsResponse.data.data.length === 0) {
      console.error('❌ No projects found for supervisor');
      return;
    }

    const project = projectsResponse.data.data[0];
    console.log('✅ Found project:', project.projectName);
    console.log('   Project ID:', project.projectId);
    console.log('   Company ID:', project.companyId);

    // Step 3: Get team members for the project
    console.log('\nStep 3: Getting team members...');
    const teamResponse = await axios.get(
      `${API_BASE_URL}/supervisor/team-list?projectId=${project.projectId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!teamResponse.data.success || teamResponse.data.data.length === 0) {
      console.error('❌ No team members found');
      return;
    }

    const worker = teamResponse.data.data[0];
    console.log('✅ Found worker:', worker.workerName);
    console.log('   Employee ID:', worker.employeeId);

    // Step 4: Create and assign a new task
    console.log('\nStep 4: Creating and assigning new task...');
    const taskData = {
      taskName: 'Install Ceiling Panels - Test',
      description: 'Install acoustic ceiling panels in conference room',
      employeeId: worker.employeeId,
      projectId: project.projectId,
      priority: 'high',
      estimatedHours: 6,
      instructions: 'Use safety harness. Check panel alignment before fixing.',
      date: new Date().toISOString().split('T')[0]
    };

    console.log('   Task Data:', JSON.stringify(taskData, null, 2));

    const createResponse = await axios.post(
      `${API_BASE_URL}/supervisor/create-and-assign-task`,
      taskData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('\n📋 Create and Assign Response:');
    console.log(JSON.stringify(createResponse.data, null, 2));

    if (createResponse.data.success) {
      console.log('\n✅ SUCCESS! Task created and assigned');
      console.log('   Task ID:', createResponse.data.data.taskId);
      console.log('   Assignment ID:', createResponse.data.data.assignmentId);
      console.log('   Task Name:', createResponse.data.data.taskName);
      console.log('   Sequence:', createResponse.data.data.sequence);

      // Step 5: Verify the task was created
      console.log('\nStep 5: Verifying task creation...');
      const tasksResponse = await axios.get(
        `${API_BASE_URL}/supervisor/projects/${project.projectId}/tasks`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const createdTask = tasksResponse.data.data.find(
        t => t.id === createResponse.data.data.taskId
      );

      if (createdTask) {
        console.log('✅ Task verified in database:');
        console.log('   ID:', createdTask.id);
        console.log('   Name:', createdTask.taskName);
        console.log('   Type:', createdTask.taskType);
        console.log('   Status:', createdTask.status);
        console.log('   Company ID:', createdTask.companyId);
        console.log('   Project ID:', createdTask.projectId);
      } else {
        console.log('⚠️  Task not found in project tasks list');
      }

      // Step 6: Verify the assignment
      console.log('\nStep 6: Verifying task assignment...');
      const assignmentsResponse = await axios.get(
        `${API_BASE_URL}/supervisor/task-assignments?projectId=${project.projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const createdAssignment = assignmentsResponse.data.data?.find(
        a => a.assignmentId === createResponse.data.data.assignmentId
      );

      if (createdAssignment) {
        console.log('✅ Assignment verified in database:');
        console.log('   Assignment ID:', createdAssignment.assignmentId);
        console.log('   Task Name:', createdAssignment.taskName);
        console.log('   Worker:', createdAssignment.workerName);
        console.log('   Status:', createdAssignment.status);
        console.log('   Priority:', createdAssignment.priority);
        console.log('   Sequence:', createdAssignment.sequence);
      } else {
        console.log('⚠️  Assignment not found in assignments list');
      }

    } else {
      console.error('❌ FAILED to create and assign task');
      console.error('   Errors:', createResponse.data.errors);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
  }
}

// Run the test
testCreateAndAssignTask();
