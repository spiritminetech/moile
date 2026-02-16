/**
 * Simple Test Script for Supervisor APIs
 * Tests all supervisor endpoints with the created test data
 */

import axios from 'axios';

const BASE_URL = 'http://192.168.1.6:5002/api';
let authToken = '';

// Login and get token (two-step process)
async function login() {
  console.log('🔐 Logging in as supervisor...\n');
  try {
    // Step 1: Initial login
    console.log('Step 1: Initial login with email/password...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });
    
    console.log('✅ Initial login successful');
    
    // Check if company selection is needed
    if (loginResponse.data.companies && loginResponse.data.companies.length > 0) {
      console.log('\nStep 2: Selecting company...');
      const userId = loginResponse.data.userId;
      const companyId = loginResponse.data.companies[0].companyId;
      console.log(`   User ID: ${userId}, Company ID: ${companyId}`);
      
      const selectResponse = await axios.post(`${BASE_URL}/auth/select-company`, {
        userId: userId,
        companyId: companyId
      });
      
      if (selectResponse.data.success && selectResponse.data.token) {
        authToken = selectResponse.data.token;
        console.log('\n✅ Login complete!');
        console.log(`📝 Token: ${authToken.substring(0, 50)}...\n`);
        return true;
      }
    } else if (loginResponse.data.token) {
      // Direct token (old flow)
      authToken = loginResponse.data.token;
      console.log('✅ Login successful!');
      console.log(`📝 Token: ${authToken.substring(0, 50)}...\n`);
      return true;
    }
    
    console.error('❌ No token received');
    return false;
  } catch (error) {
    console.error('❌ Login failed:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Test Workers Assigned API
async function testWorkersAssigned(projectId) {
  console.log(`\n📋 Testing Workers Assigned - Project ${projectId}...`);
  try {
    const response = await axios.get(
      `${BASE_URL}/supervisor/workers-assigned?projectId=${projectId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Response received:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log(`\n📊 Total workers: ${response.data.workers?.length || 0}`);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Test Late/Absent Workers API
async function testLateAbsentWorkers(projectId) {
  console.log(`\n⏰ Testing Late/Absent Workers - Project ${projectId}...`);
  try {
    const response = await axios.get(
      `${BASE_URL}/supervisor/late-absent-workers?projectId=${projectId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Response received:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log(`\n📊 Summary:`);
    console.log(`   Late: ${response.data.lateWorkers?.length || 0}`);
    console.log(`   Absent: ${response.data.absentWorkers?.length || 0}`);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Test Geofence Violations API
async function testGeofenceViolations(projectId) {
  console.log(`\n🚨 Testing Geofence Violations - Project ${projectId}...`);
  try {
    const response = await axios.get(
      `${BASE_URL}/supervisor/geofence-violations?projectId=${projectId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Response received:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log(`\n📊 Total violations: ${response.data.violations?.length || 0}`);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Main test function
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🧪 SUPERVISOR API TEST SUITE');
  console.log('='.repeat(60));
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n❌ Cannot proceed without authentication');
    return;
  }
  
  // Test Project 1
  console.log('\n' + '='.repeat(60));
  console.log('📍 PROJECT 1 - Office Building Construction');
  console.log('='.repeat(60));
  await testWorkersAssigned(1);
  await testLateAbsentWorkers(1);
  await testGeofenceViolations(1);
  
  // Test Project 2
  console.log('\n' + '='.repeat(60));
  console.log('📍 PROJECT 2 - Residential Complex Phase 1');
  console.log('='.repeat(60));
  await testWorkersAssigned(2);
  await testLateAbsentWorkers(2);
  await testGeofenceViolations(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL TESTS COMPLETED!');
  console.log('='.repeat(60));
  console.log('\n📝 Summary:');
  console.log('   ✅ Login: Working (2-step auth flow)');
  console.log('   ✅ Workers Assigned API: Tested for both projects');
  console.log('   ✅ Late/Absent Workers API: Tested for both projects');
  console.log('   ✅ Geofence Violations API: Tested for both projects');
  console.log('\n🎯 You can now use these APIs in Postman!');
  console.log(`   Token: ${authToken.substring(0, 50)}...`);
}

// Run tests
runAllTests().catch(console.error);
