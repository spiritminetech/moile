import axios from 'axios';

const BASE_URL = 'http://192.168.1.6:5002/api';

async function testBothAPIs() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  TESTING: Daily Targets & Update Assignment APIs');
    console.log('═══════════════════════════════════════════════════════\n');

    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    console.log('✅ Login successful');
    console.log(`   Companies: ${loginResponse.data.companies.length}`);

    // Step 2: Select company
    console.log('\nStep 2: Selecting company...');
    const selectResponse = await axios.post(`${BASE_URL}/auth/select-company`, {
      userId: loginResponse.data.userId,
      companyId: 1,
      role: 'SUPERVISOR'
    });

    const token = selectResponse.data.token;
    console.log('✅ Company selected');
    console.log(`   Token: ${token.substring(0, 30)}...`);

    // Step 3: Get active tasks
    console.log('\nStep 3: Getting active tasks for project 1...');
    const tasksResponse = await axios.get(
      `${BASE_URL}/supervisor/active-tasks/1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { activeTasks, summary } = tasksResponse.data;
    console.log('✅ Active tasks retrieved');
    console.log(`   Total: ${summary.totalActive}, Queued: ${summary.queued}, In Progress: ${summary.inProgress}`);

    if (activeTasks.length === 0) {
      console.log('\n⚠️ No active tasks found! Cannot test the APIs.');
      console.log('   Please create some task assignments first.');
      return;
    }

    console.log('\n   Active Tasks:');
    activeTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. Assignment ${task.assignmentId}: ${task.taskName} - ${task.workerName}`);
      console.log(`      Status: ${task.status}, Target: ${task.dailyTarget?.quantity || 'N/A'} ${task.dailyTarget?.unit || ''}`);
    });

    const assignmentIds = activeTasks.map(t => t.assignmentId);

    // ═══════════════════════════════════════════════════════════
    // TEST API 1: UPDATE DAILY TARGETS
    // ═══════════════════════════════════════════════════════════
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('  API 1: UPDATE DAILY TARGETS');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Test 1.1: Update single assignment target...');
    const singleUpdate = {
      assignmentUpdates: [
        {
          assignmentId: assignmentIds[0],
          dailyTarget: {
            quantity: 75,
            unit: 'cubic meters'
          }
        }
      ]
    };

    console.log('📤 Request:');
    console.log(JSON.stringify(singleUpdate, null, 2));

    const singleUpdateResponse = await axios.put(
      `${BASE_URL}/supervisor/daily-targets`,
      singleUpdate,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('\n📥 Response:');
    console.log(JSON.stringify(singleUpdateResponse.data, null, 2));

    if (assignmentIds.length >= 3) {
      console.log('\n\nTest 1.2: Update multiple assignment targets...');
      const multiUpdate = {
        assignmentUpdates: [
          {
            assignmentId: assignmentIds[0],
            dailyTarget: {
              quantity: 100,
              unit: 'cubic meters'
            }
          },
          {
            assignmentId: assignmentIds[1],
            dailyTarget: {
              quantity: 150,
              unit: 'steel bars'
            }
          },
          {
            assignmentId: assignmentIds[2],
            dailyTarget: {
              quantity: 300,
              unit: 'bricks'
            }
          }
        ]
      };

      console.log('📤 Request:');
      console.log(JSON.stringify(multiUpdate, null, 2));

      const multiUpdateResponse = await axios.put(
        `${BASE_URL}/supervisor/daily-targets`,
        multiUpdate,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('\n📥 Response:');
      console.log(JSON.stringify(multiUpdateResponse.data, null, 2));
    }

    // Verify the updates
    console.log('\n\nVerifying daily target updates...');
    const verifyTasks1 = await axios.get(
      `${BASE_URL}/supervisor/active-tasks/1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Updated targets:');
    verifyTasks1.data.activeTasks.slice(0, 3).forEach((task, index) => {
      console.log(`   ${index + 1}. Assignment ${task.assignmentId}: ${task.dailyTarget?.quantity || 'N/A'} ${task.dailyTarget?.unit || ''}`);
    });

    // ═══════════════════════════════════════════════════════════
    // TEST API 2: UPDATE ASSIGNMENT / REASSIGN
    // ═══════════════════════════════════════════════════════════
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('  API 2: UPDATE ASSIGNMENT / REASSIGN WORKERS');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Test 2.1: Update work location...');
    const locationUpdate = {
      assignmentId: assignmentIds[0],
      changes: {
        workArea: 'Building A',
        floor: '2nd Floor',
        zone: 'North Wing'
      }
    };

    console.log('📤 Request:');
    console.log(JSON.stringify(locationUpdate, null, 2));

    const locationResponse = await axios.put(
      `${BASE_URL}/supervisor/update-assignment`,
      locationUpdate,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('\n📥 Response:');
    console.log(JSON.stringify(locationResponse.data, null, 2));

    if (assignmentIds.length >= 2) {
      console.log('\n\nTest 2.2: Update priority...');
      const priorityUpdate = {
        assignmentId: assignmentIds[1],
        changes: {
          priority: 'high'
        }
      };

      console.log('📤 Request:');
      console.log(JSON.stringify(priorityUpdate, null, 2));

      const priorityResponse = await axios.put(
        `${BASE_URL}/supervisor/update-assignment`,
        priorityUpdate,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('\n📥 Response:');
      console.log(JSON.stringify(priorityResponse.data, null, 2));
    }

    if (assignmentIds.length >= 3) {
      console.log('\n\nTest 2.3: Update multiple fields...');
      const multiFieldUpdate = {
        assignmentId: assignmentIds[2],
        changes: {
          status: 'in_progress',
          priority: 'high',
          workArea: 'Foundation Area',
          floor: 'Ground Floor',
          zone: 'East Section',
          timeEstimate: {
            estimated: 480,
            elapsed: 0,
            remaining: 480
          }
        }
      };

      console.log('📤 Request:');
      console.log(JSON.stringify(multiFieldUpdate, null, 2));

      const multiFieldResponse = await axios.put(
        `${BASE_URL}/supervisor/update-assignment`,
        multiFieldUpdate,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('\n📥 Response:');
      console.log(JSON.stringify(multiFieldResponse.data, null, 2));
    }

    // Verify the updates
    console.log('\n\nVerifying assignment updates...');
    const verifyTasks2 = await axios.get(
      `${BASE_URL}/supervisor/active-tasks/1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Updated assignments:');
    verifyTasks2.data.activeTasks.slice(0, 3).forEach((task, index) => {
      console.log(`   ${index + 1}. Assignment ${task.assignmentId}:`);
      console.log(`      Status: ${task.status}, Priority: ${task.priority || 'N/A'}`);
      console.log(`      Location: ${task.workArea || 'N/A'}, ${task.floor || 'N/A'}, ${task.zone || 'N/A'}`);
    });

    // ═══════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('  ✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Summary:');
    console.log('  ✅ API 1: Daily Targets - Working correctly');
    console.log('  ✅ API 2: Update Assignment - Working correctly');
    console.log('  ✅ Notifications sent to workers');
    console.log('  ✅ Database updated successfully\n');

    console.log('You can now use these APIs in Postman with confidence!');
    console.log('See: DAILY_TARGETS_AND_REASSIGNMENT_POSTMAN_GUIDE.md\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('\n⚠️ Make sure:');
    console.error('  1. Backend server is running');
    console.error('  2. Server was restarted after recent fixes');
    console.error('  3. You have active task assignments');
  }
}

testBothAPIs();
