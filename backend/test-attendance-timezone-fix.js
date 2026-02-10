import axios from 'axios';

const API_BASE = 'http://192.168.1.6:5002/api';

async function testAttendanceAPI() {
  try {
    // Login as supervisor
    console.log('🔐 Logging in as supervisor...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Get attendance monitoring data
    console.log('📊 Fetching attendance monitoring data...');
    const response = await axios.get(`${API_BASE}/supervisor/attendance-monitoring`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        date: new Date().toISOString().split('T')[0]
      }
    });

    console.log('\n📈 Results:');
    console.log(`Total Workers: ${response.data.summary.totalWorkers}`);
    console.log(`Checked In: ${response.data.summary.checkedIn}`);
    console.log(`Checked Out: ${response.data.summary.checkedOut}`);
    console.log(`Absent: ${response.data.summary.absent}`);
    console.log(`Late: ${response.data.summary.late}`);

    console.log('\n👥 Workers:');
    response.data.workers.forEach(w => {
      console.log(`  - ${w.workerName}: ${w.status} (${w.checkInTime ? 'Checked in at ' + new Date(w.checkInTime).toLocaleTimeString() : 'Not checked in'})`);
    });

    // Get pending corrections
    console.log('\n📋 Fetching pending corrections...');
    const correctionsResponse = await axios.get(`${API_BASE}/supervisor/pending-attendance-corrections`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { status: 'pending' }
    });

    console.log(`\n✅ Found ${correctionsResponse.data.count} pending corrections`);
    if (correctionsResponse.data.count > 0) {
      correctionsResponse.data.data.forEach(c => {
        console.log(`  - ${c.workerName}: ${c.requestType} correction`);
        console.log(`    Reason: ${c.reason}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAttendanceAPI();
