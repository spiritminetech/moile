/**
 * Test script to verify supervisor name displays correctly for employeeId=2
 * Tests the fix for the issue where "N/A" was showing instead of supervisor name
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5002/api';

async function testSupervisorDisplay() {
  console.log('🧪 Testing Supervisor Display Fix for employeeId=2\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Login as worker with employeeId=2
    console.log('\n1️⃣ Logging in as worker (employeeId=2)...');
    
    // You'll need to use the correct credentials for employeeId=2
    // This is just an example - adjust based on your test data
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'worker@gmail.com', // Adjust this to the correct email for employeeId=2
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }

    console.log('✅ Login successful');
    console.log('   Employee ID:', loginData.data.user.employeeId);
    console.log('   Name:', loginData.data.user.name);

    const token = loginData.data.token;

    // Step 2: Fetch dashboard data (today's tasks)
    console.log('\n2️⃣ Fetching dashboard data...');
    
    const dashboardResponse = await fetch(`${BASE_URL}/worker/tasks/today`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const dashboardData = await dashboardResponse.json();

    if (!dashboardData.success) {
      console.error('❌ Dashboard fetch failed:', dashboardData.message);
      return;
    }

    console.log('✅ Dashboard data fetched successfully\n');

    // Step 3: Check supervisor data
    console.log('3️⃣ Checking Supervisor Data:');
    console.log('=' .repeat(60));

    const supervisor = dashboardData.data.supervisor;

    if (supervisor === null) {
      console.log('⚠️  Supervisor: null (No supervisor assigned)');
      console.log('   Expected behavior: Supervisor section should be hidden in UI');
    } else {
      console.log('✅ Supervisor Data Found:');
      console.log('   ID:', supervisor.id);
      console.log('   Name:', supervisor.name);
      console.log('   Phone:', supervisor.phone);
      console.log('   Email:', supervisor.email);
      
      // Check if name is "N/A" (the bug we're fixing)
      if (supervisor.name === 'N/A') {
        console.log('\n❌ BUG DETECTED: Supervisor name is "N/A"');
        console.log('   This means the supervisor was not found in the database');
        console.log('   or the supervisorId in the assignment is invalid');
      } else {
        console.log('\n✅ SUCCESS: Supervisor name is properly displayed');
      }
    }

    // Step 4: Display project info
    console.log('\n4️⃣ Project Information:');
    console.log('=' .repeat(60));
    console.log('   Project ID:', dashboardData.data.project.id);
    console.log('   Project Name:', dashboardData.data.project.name);
    console.log('   Location:', dashboardData.data.project.location);

    // Step 5: Display task assignments
    console.log('\n5️⃣ Task Assignments:');
    console.log('=' .repeat(60));
    console.log('   Total Tasks:', dashboardData.data.tasks.length);
    
    if (dashboardData.data.tasks.length > 0) {
      const firstTask = dashboardData.data.tasks[0];
      console.log('   First Task:');
      console.log('     - Name:', firstTask.taskName);
      console.log('     - Status:', firstTask.status);
      console.log('     - Sequence:', firstTask.sequence);
    }

    // Step 6: Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    
    if (supervisor === null) {
      console.log('✅ No supervisor assigned - UI should hide supervisor section');
    } else if (supervisor.name === 'N/A') {
      console.log('❌ ISSUE: Supervisor name shows "N/A"');
      console.log('   Possible causes:');
      console.log('   1. supervisorId in WorkerTaskAssignment is invalid');
      console.log('   2. Supervisor employee record not found in database');
      console.log('   3. Supervisor employee is inactive');
    } else {
      console.log('✅ Supervisor name displays correctly:', supervisor.name);
      console.log('   The fix is working as expected!');
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Run the test
testSupervisorDisplay();
