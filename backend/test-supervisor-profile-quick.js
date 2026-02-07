import axios from 'axios';

const BASE = 'http://localhost:5002/api';
const CREDS = { email: 'supervisor@gmail.com', password: 'Password123' };

let token = '';

async function test() {
  console.log('\n🔐 Login as supervisor@gmail.com...');
  try {
    const res = await axios.post(`${BASE}/auth/login`, CREDS);
    if (res.data.success) {
      token = res.data.token;
      console.log('✅ Login successful');
      console.log('User:', res.data.user);
    } else {
      console.log('❌ Login failed:', res.data.message);
      return;
    }
  } catch (err) {
    console.log('❌ Login error:', err.response?.data || err.message);
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };

  // Test 1: GET /supervisor/profile
  console.log('\n📋 Test 1: GET /supervisor/profile');
  try {
    const res = await axios.get(`${BASE}/supervisor/profile`, { headers });
    console.log('✅ Status:', res.status);
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log('❌ Error:', err.response?.status, err.response?.data || err.message);
  }

  // Test 2: GET /supervisor/assigned-sites
  console.log('\n🏗️  Test 2: GET /supervisor/assigned-sites');
  try {
    const res = await axios.get(`${BASE}/supervisor/assigned-sites`, { headers });
    console.log('✅ Status:', res.status);
    console.log('Sites count:', res.data.sites?.length || 0);
  } catch (err) {
    console.log('❌ Error:', err.response?.status, err.response?.data || err.message);
  }

  // Test 3: GET /supervisor/team-list
  console.log('\n👥 Test 3: GET /supervisor/team-list?projectId=1');
  try {
    const res = await axios.get(`${BASE}/supervisor/team-list?projectId=1`, { headers });
    console.log('✅ Status:', res.status);
    console.log('Team count:', res.data.workers?.length || 0);
  } catch (err) {
    console.log('❌ Error:', err.response?.status, err.response?.data || err.message);
  }

  // Test 4: PUT /supervisor/profile
  console.log('\n✏️  Test 4: PUT /supervisor/profile');
  try {
    const res = await axios.put(`${BASE}/supervisor/profile`, {
      phoneNumber: '1234567890'
    }, { headers });
    console.log('✅ Status:', res.status);
    console.log('Response:', res.data.message);
  } catch (err) {
    console.log('❌ Error:', err.response?.status, err.response?.data || err.message);
  }

  console.log('\n✅ All tests completed!');
}

test();
