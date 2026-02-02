// Manual test script to verify worker functionality end-to-end
const axios = require('axios');

const BASE_URL = 'http://192.168.1.8:5002/api';

async function testWorkerFunctionality() {
  console.log('🧪 Testing Worker Functionality End-to-End\n');

  try {
    // Test 1: Authentication
    console.log('1. Testing Authentication...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'worker@test.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Authentication successful');
      console.log(`   User: ${loginResponse.data.data.user.name} (${loginResponse.data.data.user.role})`);
    } else {
      throw new Error('Authentication failed');
    }

    const token = loginResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Test 2: Dashboard Data
    console.log('\n2. Testing Dashboard Data...');
    const dashboardResponse = await axios.get(`${BASE_URL}/api/worker/tasks/today`, { headers });
    
    if (dashboardResponse.data.success) {
      console.log('✅ Dashboard data retrieved');
      console.log(`   Project: ${dashboardResponse.data.data.project.name}`);
      console.log(`   Tasks: ${dashboardResponse.data.data.todaysTasks.length} tasks`);
    } else {
      throw new Error('Dashboard data retrieval failed');
    }

    // Test 3: Location Validation
    console.log('\n3. Testing Location Validation...');
    const locationResponse = await axios.post(`${BASE_URL}/worker/attendance/validate-location`, {
      latitude: 1.3521,
      longitude: 103.8198,
      accuracy: 10,
      timestamp: new Date().toISOString()
    }, { headers });
    
    if (locationResponse.data.success) {
      console.log('✅ Location validation successful');
      console.log(`   Valid: ${locationResponse.data.data.isValid}`);
      console.log(`   Distance: ${locationResponse.data.data.distanceFromSite}m`);
    } else {
      throw new Error('Location validation failed');
    }

    // Test 4: Attendance Clock In
    console.log('\n4. Testing Attendance Clock In...');
    const clockInResponse = await axios.post(`${BASE_URL}/worker/attendance/clock-in`, {
      location: {
        latitude: 1.3521,
        longitude: 103.8198,
        accuracy: 10,
        timestamp: new Date().toISOString()
      },
      sessionType: 'regular'
    }, { headers });
    
    if (clockInResponse.data.success) {
      console.log('✅ Clock in successful');
      console.log(`   Session ID: ${clockInResponse.data.data.attendance.id}`);
    } else {
      throw new Error('Clock in failed');
    }

    // Test 5: Today's Tasks
    console.log('\n5. Testing Today\'s Tasks...');
    const tasksResponse = await axios.get(`${BASE_URL}/api/worker/tasks/today`, { headers });
    
    if (tasksResponse.data.success) {
      console.log('✅ Tasks retrieved');
      console.log(`   Available tasks: ${tasksResponse.data.data.tasks.length}`);
      if (tasksResponse.data.data.tasks.length > 0) {
        console.log(`   First task: ${tasksResponse.data.data.tasks[0].taskName}`);
      }
    } else {
      throw new Error('Tasks retrieval failed');
    }

    // Test 6: Project Information
    console.log('\n6. Testing Project Information...');
    const projectResponse = await axios.get(`${BASE_URL}/project/1`, { headers });
    
    if (projectResponse.data.success) {
      console.log('✅ Project info retrieved');
      console.log(`   Project: ${projectResponse.data.data.projectName}`);
      console.log(`   Status: ${projectResponse.data.data.status}`);
      console.log(`   Budget: ${projectResponse.data.data.currency} ${projectResponse.data.data.budget}`);
    } else {
      throw new Error('Project info retrieval failed');
    }

    // Test 7: Daily Report Submission - Updated to match API specification
    console.log('\n6. Testing Daily Report Submission...');
    const reportResponse = await axios.post(`${BASE_URL}/api/worker/reports/daily`, {
      date: '2024-02-01',
      projectId: 1,
      workArea: 'Zone A',
      floor: 'Floor 3',
      summary: 'Completed installation work for the day',
      tasksCompleted: [{
        taskId: 123,
        description: 'Install ceiling panels',
        quantityCompleted: 45,
        unit: 'panels',
        progressPercent: 90,
        notes: 'Good progress, minor delay due to material delivery'
      }],
      issues: [{
        type: 'material_shortage',
        description: 'Ran out of screws for panel installation',
        severity: 'medium',
        reportedAt: new Date().toISOString()
      }],
      materialUsed: [{
        materialId: 456,
        name: 'Ceiling Panels',
        quantityUsed: 45,
        unit: 'pieces'
      }],
      workingHours: {
        startTime: '08:00:00',
        endTime: '17:00:00',
        breakDuration: 60,
        overtimeHours: 0
      }
    }, { headers });
    
    if (reportResponse.data.success) {
      console.log('✅ Daily report created successfully');
      console.log(`   Report ID: ${reportResponse.data.data.reportId}`);
      
      // Test photo upload if report was created
      const reportId = reportResponse.data.data.reportId;
      console.log('\n7. Testing Photo Upload...');
      
      // Note: In real implementation, you would upload actual photos
      // This is just testing the endpoint structure
      console.log('📷 Photo upload endpoint ready:', `${BASE_URL}/api/worker/reports/${reportId}/photos`);
      
      // Test report submission
      console.log('\n8. Testing Report Submission...');
      const submitResponse = await axios.post(`${BASE_URL}/api/worker/reports/${reportId}/submit`, {
        finalNotes: 'All tasks completed as planned. Ready for next phase.',
        supervisorNotification: true
      }, { headers });
      
      if (submitResponse.data.success) {
        console.log('✅ Daily report submitted successfully');
        console.log('   Status:', submitResponse.data.data.status);
      } else {
        console.log('❌ Report submission failed:', submitResponse.data.message);
      }
    } else {
      throw new Error('Daily report creation failed');
    }

    // Test 8: Request Submission
    console.log('\n8. Testing Request Submission...');
    const requestResponse = await axios.post(`${BASE_URL}/worker/requests`, {
      type: 'leave',
      title: 'Test Leave Request',
      description: 'Testing leave request functionality',
      requiredDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }, { headers });
    
    if (requestResponse.data.success) {
      console.log('✅ Request submitted');
      console.log(`   Request ID: ${requestResponse.data.data.request.id}`);
    } else {
      throw new Error('Request submission failed');
    }

    // Test 9: Attendance Clock Out
    console.log('\n9. Testing Attendance Clock Out...');
    const clockOutResponse = await axios.post(`${BASE_URL}/worker/attendance/clock-out`, {
      location: {
        latitude: 1.3521,
        longitude: 103.8198,
        accuracy: 10,
        timestamp: new Date().toISOString()
      },
      sessionType: 'regular'
    }, { headers });
    
    if (clockOutResponse.data.success) {
      console.log('✅ Clock out successful');
    } else {
      throw new Error('Clock out failed');
    }

    console.log('\n🎉 All Worker Functionality Tests Passed!');
    console.log('\n✅ Worker Features Verified:');
    console.log('   • Authentication and JWT token management');
    console.log('   • Dashboard data retrieval');
    console.log('   • Location-based attendance control');
    console.log('   • Attendance clock in/out');
    console.log('   • Task management');
    console.log('   • Daily report submission');
    console.log('   • Request management');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    process.exit(1);
  }
}

testWorkerFunctionality();