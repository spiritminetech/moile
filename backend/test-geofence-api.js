/**
 * Test Geofence Violations API
 */

import axios from 'axios';

const BASE_URL = 'http://192.168.0.3:5002/api';

async function testGeofenceAPI() {
  try {
    console.log('🔐 Logging in...');
    
    // Step 1: Login
    const loginResp = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });
    
    // Step 2: Select company
    const selectResp = await axios.post(`${BASE_URL}/auth/select-company`, {
      userId: loginResp.data.userId,
      companyId: loginResp.data.companies[0].companyId
    });
    
    const token = selectResp.data.token;
    console.log('✅ Logged in successfully\n');
    
    // Test Project 1
    console.log('📍 Testing Geofence Violations - Project 1');
    console.log('='.repeat(60));
    const resp1 = await axios.get(
      `${BASE_URL}/supervisor/geofence-violations?projectId=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log(JSON.stringify(resp1.data, null, 2));
    console.log('\n📊 Summary:');
    console.log(`   Total Violations: ${resp1.data.summary.totalViolations}`);
    console.log(`   Active: ${resp1.data.summary.activeViolations}`);
    console.log(`   Unique Workers: ${resp1.data.summary.uniqueWorkers}`);
    
    // Test Project 2
    console.log('\n\n📍 Testing Geofence Violations - Project 2');
    console.log('='.repeat(60));
    const resp2 = await axios.get(
      `${BASE_URL}/supervisor/geofence-violations?projectId=2`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log(JSON.stringify(resp2.data, null, 2));
    console.log('\n📊 Summary:');
    console.log(`   Total Violations: ${resp2.data.summary.totalViolations}`);
    console.log(`   Active: ${resp2.data.summary.activeViolations}`);
    console.log(`   Unique Workers: ${resp2.data.summary.uniqueWorkers}`);
    
    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testGeofenceAPI();
