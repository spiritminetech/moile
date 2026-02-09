import axios from 'axios';

const BASE_URL = 'http://192.168.0.3:5002';

async function testDailyTargetsAPI() {
  try {
    console.log('=== Testing Daily Targets Update API ===\n');

    // Step 1: Login as supervisor
    console.log('Step 1: Logging in as supervisor...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✓ Login successful');
    console.log(`Token: ${token.substring(0, 20)}...\n`);

    // Step 2: Get active tasks
    console.log('Step 2: Getting active tasks for project 1...');
    const tasksResponse = await axios.get(
      `${BASE_URL}/api/supervisor/active-tasks/1`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log(`✓ API Response received`);
    console.log(`Found ${tasksResponse.data.length || 0} active tasks\n`);
    
    if (!tasksResponse.data || tasksResponse.data.length === 0) {
      console.log('⚠ No active tasks found.');
      console.log('\nTo test the daily targets API, you need to:');
      console.log('1. Create some task assignments first');
      console.log('2. Or use the Postman collection to create test data\n');
      return;
    }

    // Display current assignments
    console.log('Current assignments:');
    tasksResponse.data.forEach((task, index) => {
      console.log(`\n  ${index + 1}. Assignment ID: ${task.id}`);
      console.log(`     Task: ${task.taskName || 'N/A'}`);
      console.log(`     Worker: ${task.workerName || 'N/A'}`);
      console.log(`     Current target: ${JSON.stringify(task.dailyTarget || {})}`);
    });
    console.log();

    // Test 1: Update single assignment
    console.log('\n=== TEST 1: Update Single Assignment ===\n');
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

    console.log('📤 Request:');
    console.log(`PUT ${BASE_URL}/api/supervisor/daily-targets`);
    console.log('Headers:');
    console.log(`  Authorization: Bearer ${token.substring(0, 20)}...`);
    console.log(`  Content-Type: application/json`);
    console.log('\nBody:');
    console.log(JSON.stringify(singleUpdateData, null, 2));

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

    console.log('\n📥 Response:');
    console.log('Status:', singleUpdateResponse.status);
    console.log('Data:', JSON.stringify(singleUpdateResponse.data, null, 2));

    // Verify the update
    console.log('\n\n=== Verifying Update ===\n');
    const verifyResponse = await axios.get(
      `${BASE_URL}/api/supervisor/active-tasks/1`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const updatedAssignment = verifyResponse.data.find(
      a => a.id === firstAssignment.id
    );

    if (updatedAssignment) {
      console.log('✓ Verification successful!');
      console.log(`Assignment ID ${firstAssignment.id}:`);
      console.log(`  Old target: ${JSON.stringify(firstAssignment.dailyTarget || {})}`);
      console.log(`  New target: ${JSON.stringify(updatedAssignment.dailyTarget || {})}`);
    }

    // Test 2: Update multiple assignments (if available)
    if (tasksResponse.data.length >= 2) {
      console.log('\n\n=== TEST 2: Update Multiple Assignments ===\n');
      
      const multiUpdateData = {
        assignmentUpdates: [
          {
            assignmentId: tasksResponse.data[0].id,
            dailyTarget: {
              quantity: 100,
              unit: 'units'
            }
          },
          {
            assignmentId: tasksResponse.data[1].id,
            dailyTarget: {
              quantity: 150,
              unit: 'units'
            }
          }
        ]
      };

      console.log('📤 Request:');
      console.log('Body:');
      console.log(JSON.stringify(multiUpdateData, null, 2));

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

      console.log('\n📥 Response:');
      console.log('Status:', multiUpdateResponse.status);
      console.log('Data:', JSON.stringify(multiUpdateResponse.data, null, 2));
    }

    console.log('\n\n=== ✅ All Tests Completed Successfully ===');
    console.log('\n📋 Summary:');
    console.log('  ✓ Login successful');
    console.log('  ✓ Retrieved active tasks');
    console.log('  ✓ Updated daily targets');
    console.log('  ✓ Verified updates');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('\nStatus:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 400) {
        console.error('\n💡 Tip: Make sure your JSON is properly formatted in Postman:');
        console.error('   - Select Body > raw > JSON');
        console.error('   - Copy the exact JSON from the examples above');
        console.error('   - Ensure no extra text before or after the JSON');
      }
    }
  }
}

// Also provide Postman instructions
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         POSTMAN TESTING INSTRUCTIONS                       ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('1. Create a new PUT request in Postman');
console.log('   URL: http://192.168.0.3:5002/api/supervisor/daily-targets\n');

console.log('2. Add Headers:');
console.log('   Authorization: Bearer <your-token>');
console.log('   Content-Type: application/json\n');

console.log('3. Select Body > raw > JSON\n');

console.log('4. Paste this EXACT JSON (nothing else):');
console.log('─────────────────────────────────────────────────────────────');
console.log(JSON.stringify({
  assignmentUpdates: [
    {
      assignmentId: 1,
      dailyTarget: {
        quantity: 50,
        unit: 'cubic meters'
      }
    }
  ]
}, null, 2));
console.log('─────────────────────────────────────────────────────────────\n');

console.log('5. Click Send\n');
console.log('═══════════════════════════════════════════════════════════════\n');

testDailyTargetsAPI();
