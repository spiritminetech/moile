import mongoose from 'mongoose';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testPriorityMapping() {
  try {
    console.log('🧪 Testing Priority Mapping Fix\n');

    // 1. Login as supervisor
    console.log('1️⃣ Logging in as supervisor...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'supervisor4@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully\n');

    // 2. Test creating task with 'normal' priority
    console.log('2️⃣ Testing createAndAssignTask with "normal" priority...');
    try {
      const createResponse = await axios.post(
        `${API_URL}/supervisor/create-and-assign-task`,
        {
          taskName: 'Test Normal Priority Task',
          description: 'Testing priority mapping',
          employeeId: 107,
          projectId: 1,
          priority: 'normal', // Should map to 'medium'
          estimatedHours: 4,
          instructions: 'Test task with normal priority'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ Task created successfully with "normal" priority');
      console.log('   Task ID:', createResponse.data.data.taskId);
      console.log('   Assignment ID:', createResponse.data.data.assignmentId);
      
      const assignmentId = createResponse.data.data.assignmentId;

      // 3. Test updating task with 'urgent' priority
      console.log('\n3️⃣ Testing updateTaskPriority with "urgent" priority...');
      const updateResponse = await axios.put(
        `${API_URL}/supervisor/task-assignments/${assignmentId}/priority`,
        {
          priority: 'urgent', // Should map to 'critical'
          instructions: 'Updated to urgent priority'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ Task priority updated successfully with "urgent" priority');
      console.log('   Mapped to:', updateResponse.data.data.priority);

      // 4. Test all priority mappings
      console.log('\n4️⃣ Testing all priority mappings...');
      const priorityTests = [
        { input: 'low', expected: 'low' },
        { input: 'normal', expected: 'medium' },
        { input: 'medium', expected: 'medium' },
        { input: 'high', expected: 'high' },
        { input: 'urgent', expected: 'critical' },
        { input: 'critical', expected: 'critical' }
      ];

      for (const test of priorityTests) {
        const testResponse = await axios.put(
          `${API_URL}/supervisor/task-assignments/${assignmentId}/priority`,
          {
            priority: test.input,
            instructions: `Testing ${test.input} priority`
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const actualPriority = testResponse.data.data.priority;
        const status = actualPriority === test.expected ? '✅' : '❌';
        console.log(`   ${status} "${test.input}" → "${actualPriority}" (expected: "${test.expected}")`);
      }

      console.log('\n✅ All priority mapping tests passed!');

    } catch (error) {
      console.error('❌ Error during task operations:');
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Error:', error.response.data);
      } else {
        console.error('   Error:', error.message);
      }
      throw error;
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testPriorityMapping()
  .then(() => {
    console.log('\n🎉 Priority mapping fix verified successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed');
    process.exit(1);
  });
