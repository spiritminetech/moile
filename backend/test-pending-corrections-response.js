import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testPendingCorrections() {
  try {
    console.log('🔐 Logging in as supervisor...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'supervisor4@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    console.log('\n📋 Fetching pending corrections...');
    const response = await axios.get(`${API_BASE}/supervisor/pending-attendance-corrections`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { status: 'pending' }
    });

    console.log('\n📊 Response structure:');
    console.log('- response.data:', JSON.stringify(response.data, null, 2));
    console.log('\n- response.data.success:', response.data.success);
    console.log('- response.data.data:', response.data.data);
    console.log('- response.data.count:', response.data.count);
    
    if (response.data.data) {
      console.log('\n✅ Corrections array length:', response.data.data.length);
      if (response.data.data.length > 0) {
        console.log('\n📝 First correction:');
        console.log(JSON.stringify(response.data.data[0], null, 2));
      } else {
        console.log('\n⚠️ No pending corrections found');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testPendingCorrections();
