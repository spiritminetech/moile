import axios from 'axios';

const BASE_URL = 'http://192.168.0.3:5002/api'; // Try the BASE_URL from .env

async function simpleTest() {
  try {
    console.log('🧪 Testing Supervisor APIs...\n');
    console.log(`📡 Base URL: ${BASE_URL}\n`);

    // Step 1: Login
    console.log('🔐 Step 1: Login as Supervisor 4...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor4@test.com',
      password: 'password123'
    });

    console.log('✅ Login successful!');
    const token = loginResponse.data.token;
    console.log(`   Token: ${token.substring(0, 30)}...`);
    console.log(`   User: ${loginResponse.data.user?.name || 'N/A'}\n`);

    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Test Workers Assigned
    console.log('📊 Step 2: GET /supervisor/workers-assigned');
    const workersResponse = await axios.get(
      `${BASE_URL}/supervisor/workers-assigned`,
      { headers }
    );
    console.log(`✅ Success! Found ${workersResponse.data.length} workers\n`);

    // Step 3: Test Late/Absent Workers
    console.log('📊 Step 3: GET /supervisor/late-absent-workers');
    const lateAbsentResponse = await axios.get(
      `${BASE_URL}/supervisor/late-absent-workers`,
      { headers }
    );
    console.log(`✅ Success! Found ${lateAbsentResponse.data.length} late/absent workers\n`);

    // Step 4: Test Geofence Violations
    console.log('📊 Step 4: GET /supervisor/geofence-violations');
    const geofenceResponse = await axios.get(
      `${BASE_URL}/supervisor/geofence-violations`,
      { headers }
    );
    console.log(`✅ Success! Found ${geofenceResponse.data.length} geofence violations\n`);

    console.log('✅ ALL TESTS PASSED!\n');
    console.log('📋 Summary:');
    console.log(`   - Workers Assigned: ${workersResponse.data.length}`);
    console.log(`   - Late/Absent: ${lateAbsentResponse.data.length}`);
    console.log(`   - Geofence Violations: ${geofenceResponse.data.length}`);

  } catch (error) {
    console.error('\n❌ Test Failed!');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Code:', error.code);
    }
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

simpleTest();
