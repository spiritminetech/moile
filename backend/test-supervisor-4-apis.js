import axios from 'axios';

const BASE_URL = 'http://localhost:5002/api';
const SUPERVISOR_EMAIL = 'supervisor4@test.com';
const SUPERVISOR_PASSWORD = 'password123';

async function testSupervisor4APIs() {
  try {
    console.log('🔐 Step 1: Login as Supervisor 4...\n');

    // Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: SUPERVISOR_EMAIL,
      password: SUPERVISOR_PASSWORD
    });

    const token = loginResponse.data.token;
    const supervisorId = loginResponse.data.user.supervisorId;

    console.log('✅ Login successful!');
    console.log(`   Supervisor ID: ${supervisorId}`);
    console.log(`   Name: ${loginResponse.data.user.name}`);
    console.log(`   Token: ${token.substring(0, 20)}...\n`);

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // Test 1: Workers Assigned
    console.log('📊 Test 1: GET /supervisor/workers-assigned\n');
    try {
      const workersResponse = await axios.get(
        `${BASE_URL}/supervisor/workers-assigned`,
        { headers }
      );

      console.log(`✅ Status: ${workersResponse.status}`);
      console.log(`   Total Workers: ${workersResponse.data.length}`);
      console.log('   Workers List:');
      workersResponse.data.forEach((worker, idx) => {
        console.log(`   ${idx + 1}. ${worker.name}`);
        console.log(`      Status: ${worker.attendanceStatus || 'No record'}`);
        console.log(`      Clock In: ${worker.clockInTime || 'N/A'}`);
        console.log(`      Project: ${worker.projectName || 'N/A'}`);
      });
      console.log('');
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      console.log('');
    }

    // Test 2: Late/Absent Workers
    console.log('📊 Test 2: GET /supervisor/late-absent-workers\n');
    try {
      const lateAbsentResponse = await axios.get(
        `${BASE_URL}/supervisor/late-absent-workers`,
        { headers }
      );

      console.log(`✅ Status: ${lateAbsentResponse.status}`);
      console.log(`   Total Late/Absent: ${lateAbsentResponse.data.length}`);
      console.log('   Workers List:');
      lateAbsentResponse.data.forEach((worker, idx) => {
        console.log(`   ${idx + 1}. ${worker.name}`);
        console.log(`      Status: ${worker.status}`);
        console.log(`      Clock In: ${worker.clockInTime || 'N/A'}`);
        console.log(`      Reason: ${worker.reason || 'N/A'}`);
      });
      console.log('');
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      console.log('');
    }

    // Test 3: Geofence Violations
    console.log('📊 Test 3: GET /supervisor/geofence-violations\n');
    try {
      const geofenceResponse = await axios.get(
        `${BASE_URL}/supervisor/geofence-violations`,
        { headers }
      );

      console.log(`✅ Status: ${geofenceResponse.status}`);
      console.log(`   Total Violations: ${geofenceResponse.data.length}`);
      console.log('   Violations List:');
      geofenceResponse.data.forEach((violation, idx) => {
        console.log(`   ${idx + 1}. ${violation.workerName}`);
        console.log(`      Time: ${violation.timestamp}`);
        console.log(`      Reason: ${violation.reason}`);
        console.log(`      Location: ${violation.latitude}, ${violation.longitude}`);
        console.log(`      Distance: ${violation.distance || 'N/A'}`);
      });
      console.log('');
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      console.log('');
    }

    // Test 4: Manual Attendance Override (Optional)
    console.log('📊 Test 4: POST /supervisor/manual-attendance-override\n');
    console.log('⚠️  Skipping manual override test (requires specific worker ID)');
    console.log('   To test manually, use:');
    console.log('   POST /supervisor/manual-attendance-override');
    console.log('   Body: {');
    console.log('     "employeeId": <worker_id>,');
    console.log('     "date": "2026-02-06",');
    console.log('     "status": "present",');
    console.log('     "reason": "Manual override by supervisor"');
    console.log('   }');
    console.log('');

    console.log('✅ ALL TESTS COMPLETED!\n');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message || error);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Response:', error.response.data);
    }
  }
}

testSupervisor4APIs();
