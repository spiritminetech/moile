import axios from 'axios';
import db from './src/config/database.js';

const BASE_URL = 'http://192.168.1.6:5002';

async function setupTestData() {
  console.log('Setting up test data...\n');
  
  // Create task assignments for testing
  const [assignments] = await db.query(`
    INSERT INTO worker_task_assignment 
    (worker_id, task_id, project_id, assigned_date, status, daily_target)
    VALUES 
    (64, 1, 1, CURDATE(), 'assigned', '{"quantity": 30, "unit": "cubic meters"}'),
    (64, 2, 1, CURDATE(), 'assigned', '{"quantity": 40, "unit": "steel bars"}'),
    (64, 3, 1, CURDATE(), 'assigned', '{"quantity": 50, "unit": "bricks"}')
    ON DUPLICATE KEY UPDATE status = 'assigned'
  `);
  
  console.log('✓ Created 3 task assignments\n');
}

async function testDailyTargetsUpdate() {
  try {
    console.log('=== Testing Daily Targets Update API ===\n');

    await setupTestData();

    // Step 1: Login as supervisor
    console.log('Step 1: Logging in as supervisor...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'supervisor@company.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✓ Login successful\n');

    // Step 2: Get active tasks to find assignment IDs
    console.log('Step 2: Getting active tasks for project 1...');
    const tasksResponse = await axios.get(
      `${BASE_URL}/api/supervisor/active-tasks/1`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log(`✓ Found ${tasksResponse.data.length} active tasks\n`);
    
    if (tasksResponse.data.length > 0) {
      // Display current assignments
      console.log('Current assignments:');
      tasksResponse.data.forEach((task, index) => {
        console.log(`  ${index + 1}. Assignment ID: ${task.id}`);
        console.log(`     Task: ${task.taskName}`);
        console.log(`     Worker: ${task.workerName}`);
        console.log(`     Current target: ${JSON.stringify(task.dailyTarget)}`);
      });
      console.log();

      // Test 1: Update single assignment
      console.log('=== TEST 1: Update Single Assignment ===');
      const firstAssignment = tasksResponse.data[0];
      
      const singleUpdateData = {
        assignmentUpdates: [
          {
            assignmentId: firstAssignment.id,
            dailyTarget: {
              quantity: 75,
              unit: 'cubic meters'
            }
          }
        ]
      };

      console.log('Request body:', JSON.stringify(singleUpdateData, null, 2));

      const singleUpdateResponse = await axios.put(
        `${BASE_URL}/api/supervisor/daily-targets`,
        singleUpdateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('\n✓ Single update successful!');
      console.log('Response:', JSON.stringify(singleUpdateResponse.data, null, 2));

      // Verify the update
      const verifyResponse1 = await axios.get(
        `${BASE_URL}/api/supervisor/active-tasks/1`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const updatedAssignment = verifyResponse1.data.find(
        a => a.id === firstAssignment.id
      );

      if (updatedAssignment) {
        console.log('\n✓ Verification successful!');
        console.log(`New target: ${JSON.stringify(updatedAssignment.dailyTarget)}`);
      }

      // Test 2: Update multiple assignments
      if (tasksResponse.data.length >= 2) {
        console.log('\n\n=== TEST 2: Update Multiple Assignments ===');
        
        const multiUpdateData = {
          assignmentUpdates: tasksResponse.data.slice(0, 2).map((task, index) => ({
            assignmentId: task.id,
            dailyTarget: {
              quantity: 100 + (index * 50),
              unit: 'units'
            }
          }))
        };

        console.log('Request body:', JSON.stringify(multiUpdateData, null, 2));

        const multiUpdateResponse = await axios.put(
          `${BASE_URL}/api/supervisor/daily-targets`,
          multiUpdateData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('\n✓ Multiple updates successful!');
        console.log('Response:', JSON.stringify(multiUpdateResponse.data, null, 2));

        // Verify multiple updates
        const verifyResponse2 = await axios.get(
          `${BASE_URL}/api/supervisor/active-tasks/1`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        console.log('\n✓ Verification of multiple updates:');
        multiUpdateData.assignmentUpdates.forEach(update => {
          const verified = verifyResponse2.data.find(a => a.id === update.assignmentId);
          if (verified) {
            console.log(`  Assignment ${update.assignmentId}: ${JSON.stringify(verified.dailyTarget)}`);
          }
        });
      }

      // Test 3: Different units
      console.log('\n\n=== TEST 3: Update with Different Units ===');
      
      const differentUnitsData = {
        assignmentUpdates: [
          {
            assignmentId: tasksResponse.data[0].id,
            dailyTarget: {
              quantity: 30,
              unit: 'square meters'
            }
          }
        ]
      };

      if (tasksResponse.data.length >= 2) {
        differentUnitsData.assignmentUpdates.push({
          assignmentId: tasksResponse.data[1].id,
          dailyTarget: {
            quantity: 15,
            unit: 'panels'
          }
        });
      }

      console.log('Request body:', JSON.stringify(differentUnitsData, null, 2));

      const differentUnitsResponse = await axios.put(
        `${BASE_URL}/api/supervisor/daily-targets`,
        differentUnitsData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('\n✓ Different units update successful!');
      console.log('Response:', JSON.stringify(differentUnitsResponse.data, null, 2));

      // Final verification
      console.log('\n\n=== FINAL STATE ===');
      const finalResponse = await axios.get(
        `${BASE_URL}/api/supervisor/active-tasks/1`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('All assignments after updates:');
      finalResponse.data.forEach((task, index) => {
        console.log(`  ${index + 1}. Assignment ID: ${task.id}`);
        console.log(`     Task: ${task.taskName}`);
        console.log(`     Worker: ${task.workerName}`);
        console.log(`     Final target: ${JSON.stringify(task.dailyTarget)}`);
      });

    } else {
      console.log('⚠ No active tasks found after setup.');
    }

    console.log('\n=== All Tests Completed Successfully ===');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await db.end();
  }
}

testDailyTargetsUpdate();
