import axios from 'axios';

const BASE = 'http://localhost:5002/api';
const CREDS = { email: 'supervisor@gmail.com', password: 'Password123' };

let token = '';

async function test() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  SUPERVISOR PROFILE APIs - COMPLETE VERIFICATION');
  console.log('═══════════════════════════════════════════════════════\n');

  // Login
  console.log('🔐 Step 1: Login');
  try {
    const res = await axios.post(`${BASE}/auth/login`, CREDS);
    if (res.data.success) {
      token = res.data.token;
      console.log('✅ Login successful');
      console.log('   User:', res.data.user.email, '| Role:', res.data.user.name);
    } else {
      console.log('❌ Login failed:', res.data.message);
      return;
    }
  } catch (err) {
    console.log('❌ Login error:', err.response?.data || err.message);
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };
  const results = {
    getProfile: false,
    updateProfile: false,
    assignedSites: false,
    teamList: false
  };

  // Test 1: GET /supervisor/profile
  console.log('\n📋 Test 1: GET /supervisor/profile');
  try {
    const res = await axios.get(`${BASE}/supervisor/profile`, { headers });
    if (res.status === 200 && res.data.success) {
      console.log('✅ WORKING - Status:', res.status);
      console.log('   Name:', res.data.profile.name);
      console.log('   Email:', res.data.profile.email);
      console.log('   Phone:', res.data.profile.phoneNumber);
      results.getProfile = true;
    }
  } catch (err) {
    console.log('❌ FAILED - Status:', err.response?.status);
    console.log('   Error:', err.response?.data?.message || err.message);
  }

  // Test 2: PUT /supervisor/profile
  console.log('\n✏️  Test 2: PUT /supervisor/profile');
  try {
    const res = await axios.put(`${BASE}/supervisor/profile`, {
      phoneNumber: '+9876543210',
      emergencyContact: {
        name: 'Test Contact',
        relationship: 'Friend',
        phone: '+1234567890'
      }
    }, { headers });
    if (res.status === 200 && res.data.success) {
      console.log('✅ WORKING - Status:', res.status);
      console.log('   Message:', res.data.message);
      results.updateProfile = true;
    }
  } catch (err) {
    console.log('❌ FAILED - Status:', err.response?.status);
    console.log('   Error:', err.response?.data?.message || err.message);
  }

  // Test 3: GET /supervisor/assigned-sites
  console.log('\n🏗️  Test 3: GET /supervisor/assigned-sites');
  try {
    const res = await axios.get(`${BASE}/supervisor/assigned-sites`, { headers });
    if (res.status === 200 && res.data.success) {
      console.log('✅ WORKING - Status:', res.status);
      console.log('   Sites count:', res.data.sites?.length || 0);
      results.assignedSites = true;
    }
  } catch (err) {
    console.log('❌ FAILED - Status:', err.response?.status);
    console.log('   Error:', err.response?.data?.message || err.message);
  }

  // Test 4: GET /supervisor/team-list
  console.log('\n👥 Test 4: GET /supervisor/team-list?projectId=1');
  try {
    const res = await axios.get(`${BASE}/supervisor/team-list?projectId=1`, { headers });
    if (res.status === 200) {
      console.log('✅ WORKING - Status:', res.status);
      console.log('   Team count:', res.data.workers?.length || 0);
      results.teamList = true;
    }
  } catch (err) {
    console.log('❌ FAILED - Status:', err.response?.status);
    console.log('   Error:', err.response?.data?.message || err.message);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('Backend APIs:');
  console.log(results.getProfile ? '✅' : '❌', 'GET  /supervisor/profile');
  console.log(results.updateProfile ? '✅' : '❌', 'PUT  /supervisor/profile');
  console.log(results.assignedSites ? '✅' : '❌', 'GET  /supervisor/assigned-sites');
  console.log(results.teamList ? '✅' : '❌', 'GET  /supervisor/team-list');

  const allWorking = Object.values(results).every(v => v);
  console.log('\n' + (allWorking ? '✅ ALL APIS WORKING!' : '⚠️  SOME APIS FAILED'));
  
  console.log('\nCredentials Used:');
  console.log('  Email:', CREDS.email);
  console.log('  Password:', CREDS.password);
}

test();
