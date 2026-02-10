/**
 * Final test of worker@gmail.com API to verify supervisor displays correctly
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5002/api';

async function testWorkerGmailAPI() {
  console.log('🧪 Testing worker@gmail.com - Supervisor Display Fix\n');
  console.log('=' .repeat(70));

  try {
    // Step 1: Login
    console.log('\n1️⃣ Logging in as worker@gmail.com...');
    
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'worker@gmail.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.log('❌ Login failed:', loginData.message);
      return;
    }

    console.log('✅ Login Successful:');
    console.log('   Employee ID:', loginData.data.user.employeeId);
    console.log('   Name:', loginData.data.user.name);
    console.log('   Email:', loginData.data.user.email);

    const token = loginData.data.token;

    // Step 2: Fetch dashboard data
    console.log('\n2️⃣ Fetching Dashboard Data (/worker/tasks/today)...');
    
    const dashboardResponse = await fetch(`${BASE_URL}/worker/tasks/today`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const dashboardData = await dashboardResponse.json();

    console.log('   Response Status:', dashboardResponse.status);
    console.log('   Success:', dashboardData.success);

    if (!dashboardData.success) {
      console.log('\n❌ Dashboard API Failed:');
      console.log('   Message:', dashboardData.message);
      console.log('   Error:', dashboardData.error);
      return;
    }

    console.log('   ✅ Dashboard data fetched successfully');

    // Step 3: Check Supervisor Data
    console.log('\n3️⃣ SUPERVISOR DATA IN API RESPONSE:');
    console.log('=' .repeat(70));

    const supervisor = dashboardData.data.supervisor;

    console.log('\nSupervisor Object:');
    console.log(JSON.stringify(supervisor, null, 2));

    console.log('\n' + '=' .repeat(70));
    
    if (supervisor === null) {
      console.log('❌ ISSUE: Supervisor is NULL');
      console.log('   Expected: Supervisor object with name "Suresh Kumar"');
      console.log('   Actual: null');
      console.log('\n   Possible causes:');
      console.log('   1. Backend fix not applied correctly');
      console.log('   2. Supervisor not found in database');
      console.log('   3. Backend server needs restart');
    } else if (supervisor.name === 'N/A') {
      console.log('❌ BUG STILL EXISTS: Supervisor name is "N/A"');
      console.log('   Expected: "Suresh Kumar"');
      console.log('   Actual: "N/A"');
      console.log('\n   The backend fix did not work!');
      console.log('   Check: moile/backend/src/modules/worker/workerController.js');
      console.log('   Line ~1117: supervisor response logic');
    } else {
      console.log('✅ SUCCESS: Supervisor Data is Correct!');
      console.log('   ID:', supervisor.id);
      console.log('   Name:', supervisor.name);
      console.log('   Phone:', supervisor.phone);
      console.log('   Email:', supervisor.email);
      console.log('\n   ✅ The fix is working correctly!');
    }

    // Step 4: Show complete response structure
    console.log('\n4️⃣ Complete API Response Structure:');
    console.log('=' .repeat(70));
    console.log('\nProject:');
    console.log('   ID:', dashboardData.data.project.id);
    console.log('   Name:', dashboardData.data.project.name);
    console.log('   Location:', dashboardData.data.project.location);

    console.log('\nWorker:');
    console.log('   ID:', dashboardData.data.worker.id);
    console.log('   Name:', dashboardData.data.worker.name);
    console.log('   Role:', dashboardData.data.worker.role);

    console.log('\nTasks:');
    console.log('   Total:', dashboardData.data.tasks.length);
    if (dashboardData.data.tasks.length > 0) {
      console.log('   First Task:', dashboardData.data.tasks[0].taskName);
    }

    // Final Summary
    console.log('\n' + '=' .repeat(70));
    console.log('📊 FINAL TEST RESULT');
    console.log('=' .repeat(70));

    if (supervisor && supervisor.name && supervisor.name !== 'N/A') {
      console.log('✅ TEST PASSED!');
      console.log(`   Supervisor name: "${supervisor.name}"`);
      console.log('   The mobile app will display this correctly');
      console.log('\n📱 Expected Mobile App Display:');
      console.log('   Section: "📍 Today\'s Project & Site"');
      console.log('   Shows: "👨‍💼 Supervisor Name & Contact"');
      console.log(`   Name: "${supervisor.name}"`);
      console.log('   Role: "Site Supervisor"');
      console.log(`   Buttons: [📞 ${supervisor.phone}] [✉️ Email]`);
    } else {
      console.log('❌ TEST FAILED!');
      console.log('   Supervisor data is not correct');
      console.log('   Expected: Object with name "Suresh Kumar"');
      console.log('   Actual:', supervisor);
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Restart backend server');
      console.log('   2. Check workerController.js line ~1117');
      console.log('   3. Verify database has supervisor (run check-worker-gmail-userid.js)');
    }

  } catch (error) {
    console.error('\n❌ Test Failed:');
    console.error('   Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Backend server is not running!');
      console.error('   Start the server:');
      console.error('   cd moile/backend');
      console.error('   npm start');
    } else {
      console.error('\n   Stack:', error.stack);
    }
  }
}

// Run the test
testWorkerGmailAPI();
