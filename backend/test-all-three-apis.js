/**
 * Test all three supervisor APIs:
 * 1. Workers Assigned (Attendance List)
 * 2. Late/Absent Workers
 * 3. Geofence Violations
 */

import axios from 'axios';

const BASE_URL = 'http://192.168.0.3:5002/api';

async function testAllAPIs() {
  try {
    console.log('🔐 Logging in...\n');
    
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
    console.log('='.repeat(70));
    
    // Test both projects
    for (const projectId of [1, 2]) {
      const projectName = projectId === 1 ? 'Office Building Construction' : 'Residential Complex Phase 1';
      
      console.log(`\n📍 PROJECT ${projectId}: ${projectName}`);
      console.log('='.repeat(70));
      
      // API 1: Workers Assigned
      console.log('\n1️⃣  WORKERS ASSIGNED (Attendance List)');
      console.log('-'.repeat(70));
      const workersResp = await axios.get(
        `${BASE_URL}/supervisor/workers-assigned?projectId=${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log(JSON.stringify(workersResp.data, null, 2));
      console.log(`\n📊 Total Workers: ${workersResp.data.workers?.length || 0}`);
      
      // API 2: Late/Absent Workers
      console.log('\n\n2️⃣  LATE/ABSENT WORKERS');
      console.log('-'.repeat(70));
      const lateAbsentResp = await axios.get(
        `${BASE_URL}/supervisor/late-absent-workers?projectId=${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log(JSON.stringify(lateAbsentResp.data, null, 2));
      console.log(`\n📊 Summary:`);
      console.log(`   Late Workers: ${lateAbsentResp.data.lateWorkers?.length || 0}`);
      console.log(`   Absent Workers: ${lateAbsentResp.data.absentWorkers?.length || 0}`);
      console.log(`   Total Assigned: ${lateAbsentResp.data.summary?.totalAssigned || 0}`);
      
      // API 3: Geofence Violations
      console.log('\n\n3️⃣  GEOFENCE VIOLATIONS');
      console.log('-'.repeat(70));
      const violationsResp = await axios.get(
        `${BASE_URL}/supervisor/geofence-violations?projectId=${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log(JSON.stringify(violationsResp.data, null, 2));
      console.log(`\n📊 Summary:`);
      console.log(`   Total Violations: ${violationsResp.data.summary?.totalViolations || 0}`);
      console.log(`   Active Violations: ${violationsResp.data.summary?.activeViolations || 0}`);
      console.log(`   Unique Workers: ${violationsResp.data.summary?.uniqueWorkers || 0}`);
      
      console.log('\n' + '='.repeat(70));
    }
    
    console.log('\n\n✅ ALL TESTS COMPLETED!');
    console.log('='.repeat(70));
    console.log('\n📝 Summary:');
    console.log('   ✅ Workers Assigned API: Working');
    console.log('   ✅ Late/Absent Workers API: Working');
    console.log('   ✅ Geofence Violations API: Working');
    console.log('\n🎯 All APIs are ready for Postman testing!');
    console.log(`\n🔑 Token for Postman: ${token.substring(0, 50)}...`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAllAPIs();
