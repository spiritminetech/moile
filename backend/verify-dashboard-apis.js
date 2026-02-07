import axios from 'axios';

const BASE_URL = 'http://localhost:5002/api';

async function verifyDashboardAPIs() {
  console.log('🔍 VERIFYING SUPERVISOR DASHBOARD APIs\n');
  console.log('=' .repeat(60));

  const apis = [
    { name: 'Projects', endpoint: '/supervisor/projects', method: 'GET' },
    { name: 'Workers Assigned', endpoint: '/supervisor/workers-assigned', method: 'GET' },
    { name: 'Attendance Monitoring', endpoint: '/supervisor/attendance-monitoring', method: 'GET' },
    { name: 'Late/Absent Workers', endpoint: '/supervisor/late-absent-workers', method: 'GET' },
    { name: 'Geofence Violations', endpoint: '/supervisor/geofence-violations', method: 'GET' }
  ];

  console.log('\n📋 Checking API Endpoints:\n');

  for (const api of apis) {
    try {
      // Just check if the endpoint exists (will return 400/401 if it exists but needs auth/params)
      const response = await axios({
        method: api.method,
        url: `${BASE_URL}${api.endpoint}`,
        validateStatus: () => true // Accept any status code
      });

      const status = response.status;
      let availability = '❌ NOT AVAILABLE';
      
      // If we get 400 (bad request) or 401 (unauthorized), the endpoint exists
      // If we get 404, the endpoint doesn't exist
      if (status === 404) {
        availability = '❌ NOT FOUND (404)';
      } else if (status === 400 || status === 401 || status === 200) {
        availability = '✅ AVAILABLE';
      } else if (status === 500) {
        availability = '⚠️  AVAILABLE (Server Error)';
      }

      console.log(`${availability} - ${api.method} ${api.endpoint}`);
      console.log(`   Status: ${status} | Message: ${response.data?.message || 'N/A'}`);
      console.log('');

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ SERVER NOT RUNNING - ${api.method} ${api.endpoint}`);
        console.log('   Error: Cannot connect to server at', BASE_URL);
        console.log('');
      } else {
        console.log(`⚠️  ERROR - ${api.method} ${api.endpoint}`);
        console.log(`   Error: ${error.message}`);
        console.log('');
      }
    }
  }

  console.log('=' .repeat(60));
  console.log('\n📊 SUMMARY:');
  console.log('✅ = Endpoint exists and is accessible');
  console.log('❌ = Endpoint not found (404)');
  console.log('⚠️  = Endpoint exists but has server error');
  console.log('\nNote: 400/401 responses indicate the endpoint exists but requires');
  console.log('proper authentication or query parameters.\n');
}

verifyDashboardAPIs().catch(console.error);
