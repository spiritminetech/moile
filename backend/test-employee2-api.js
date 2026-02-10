/**
 * Test the API endpoint for employeeId=2 to verify supervisor displays correctly
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5002/api';

async function testEmployee2API() {
  console.log('🧪 Testing API for employeeId=2 - Supervisor Display\n');
  console.log('=' .repeat(70));

  try {
    // Step 1: Login as Ravi Smith (employeeId=2)
    console.log('\n1️⃣ Logging in as Ravi Smith (employeeId=2)...');
    
    // First, let's find the correct email for employeeId=2
    // Based on the database check, we know it's Ravi Smith
    // Let's try common patterns
    const possibleEmails = [
      'ravi.smith@gmail.com',
      'ravi@gmail.com',
      'worker2@gmail.com',
      'worker@gmail.com'
    ];

    let loginData = null;
    let token = null;

    for (const email of possibleEmails) {
      console.log(`   Trying: ${email}...`);
      
      const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: 'password123'
        })
      });

      const data = await loginResponse.json();
      
      if (data.success && data.data?.user?.employeeId === 2) {
        loginData = data;
        token = data.data.token;
        console.log(`   ✅ Login successful with: ${email}`);
        break;
      }
    }

    if (!token) {
      console.log('\n❌ Could not login as employeeId=2');
      console.log('   Please check the employee email in the database');
      console.log('\n💡 To find the email, run:');
      console.log('   db.employees.findOne({ id: 2 })');
      return;
    }

    console.log('\n✅ Login Successful:');
    console.log('   Employee ID:', loginData.data.user.employeeId);
    console.log('   Name:', loginData.data.user.name);
    console.log('   Email:', loginData.data.user.email);

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
    console.log('\n3️⃣ Checking Supervisor Data in Response:');
    console.log('=' .repeat(70));

    const supervisor = dashboardData.data.supervisor;

    console.log('\nSupervisor Object:');
    console.log(JSON.stringify(supervisor, null, 2));

    if (supervisor === null) {
      console.log('\n⚠️  Supervisor is NULL');
      console.log('   Expected: Supervisor section should be hidden in mobile app');
      console.log('   This means no supervisor is assigned or supervisor not found');
    } else if (supervisor.name === 'N/A') {
      console.log('\n❌ BUG DETECTED: Supervisor name is "N/A"');
      console.log('   This is the bug we are trying to fix!');
      console.log('   The backend should return null instead of object with "N/A"');
    } else {
      console.log('\n✅ SUCCESS: Supervisor data is valid!');
      console.log('   ID:', supervisor.id);
      console.log('   Name:', supervisor.name);
      console.log('   Phone:', supervisor.phone);
      console.log('   Email:', supervisor.email);
      console.log('\n   The mobile app should display: "' + supervisor.name + '"');
    }

    // Step 4: Check Project Data
    console.log('\n4️⃣ Project Information:');
    console.log('=' .repeat(70));
    const project = dashboardData.data.project;
    console.log('   ID:', project.id);
    console.log('   Name:', project.name);
    console.log('   Code:', project.code);
    console.log('   Location:', project.location);

    // Step 5: Check Tasks
    console.log('\n5️⃣ Task Assignments:');
    console.log('=' .repeat(70));
    const tasks = dashboardData.data.tasks;
    console.log('   Total Tasks:', tasks.length);
    
    if (tasks.length > 0) {
      console.log('\n   Task Details:');
      tasks.forEach((task, idx) => {
        console.log(`   ${idx + 1}. ${task.taskName}`);
        console.log(`      Status: ${task.status}`);
        console.log(`      Sequence: ${task.sequence}`);
        console.log(`      Progress: ${task.progress.percentage}%`);
      });
    }

    // Step 6: Check Worker Data
    console.log('\n6️⃣ Worker Information:');
    console.log('=' .repeat(70));
    const worker = dashboardData.data.worker;
    console.log('   ID:', worker.id);
    console.log('   Name:', worker.name);
    console.log('   Role:', worker.role);
    console.log('   Check-in Status:', worker.checkInStatus);

    // Final Summary
    console.log('\n' + '=' .repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(70));

    if (supervisor === null) {
      console.log('⚠️  No supervisor assigned');
      console.log('   Mobile app should: Hide supervisor section');
      console.log('\n💡 To assign a supervisor, run:');
      console.log('   node fix-employee2-supervisor.js');
    } else if (supervisor.name === 'N/A') {
      console.log('❌ BUG CONFIRMED: Supervisor name shows "N/A"');
      console.log('   The backend fix did not work correctly');
      console.log('   Check: moile/backend/src/modules/worker/workerController.js');
    } else {
      console.log('✅ SUPERVISOR DISPLAYS CORRECTLY!');
      console.log(`   Name: ${supervisor.name}`);
      console.log(`   Phone: ${supervisor.phone}`);
      console.log(`   Email: ${supervisor.email}`);
      console.log('\n   The mobile app should show this supervisor information');
      console.log('   in the "Today\'s Project & Site" section.');
    }

    console.log('\n📱 Mobile App Expected Behavior:');
    console.log('   Section: "📍 Today\'s Project & Site"');
    if (supervisor && supervisor.name !== 'N/A') {
      console.log('   Shows: "👨‍💼 Supervisor Name & Contact"');
      console.log(`   Displays: "${supervisor.name}"`);
      console.log('   Role: "Site Supervisor"');
      console.log(`   Buttons: [📞 ${supervisor.phone}] [✉️ Email]`);
    } else {
      console.log('   Supervisor section: HIDDEN (not displayed)');
    }

  } catch (error) {
    console.error('\n❌ Test Failed:');
    console.error('   Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Backend server is not running!');
      console.error('   Start the server with: npm start');
      console.error('   in the moile/backend directory');
    }
  }
}

// Run the test
testEmployee2API();
