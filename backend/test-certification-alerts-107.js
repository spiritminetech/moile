// Test certification alerts API for employeeId 107
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// Test configuration
const testConfig = {
  email: 'worker1@gmail.com', // Actual worker email for employeeId 107
  password: 'password123'
};

let authToken = '';

// Test 1: Login to get auth token
const testLogin = async () => {
  console.log('\n🔐 Testing login...');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: testConfig.email,
      password: testConfig.password
    });

    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      console.log('📋 User Info:', {
        name: response.data.user?.name,
        role: response.data.user?.role,
        employeeId: response.data.user?.employeeId
      });
      return response.data;
    } else {
      throw new Error(response.data.message || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
};

// Test 2: Get certification alerts
const testCertificationAlerts = async () => {
  console.log('\n📜 Testing GET /worker/profile/certification-alerts...');
  
  try {
    const response = await axios.get(`${API_BASE}/worker/profile/certification-alerts`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 API Response Status:', response.status);
    console.log('📊 API Response:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('✅ Certification alerts retrieved successfully');
      
      const alerts = response.data.data || response.data.alerts;
      if (Array.isArray(alerts)) {
        console.log(`📋 Found ${alerts.length} alerts:`);
        alerts.forEach((alert, index) => {
          console.log(`   ${index + 1}. ${alert.name}`);
          console.log(`      Level: ${alert.alertLevel}`);
          console.log(`      Days until expiry: ${alert.daysUntilExpiry}`);
          console.log(`      Expiry date: ${alert.expiryDate}`);
        });
      } else if (alerts && typeof alerts === 'object') {
        console.log('📋 Alerts structure:', alerts);
        if (alerts.expired) console.log(`   Expired: ${alerts.expired.length}`);
        if (alerts.expiringSoon) console.log(`   Expiring soon: ${alerts.expiringSoon.length}`);
      } else {
        console.log('⚠️ Unexpected alerts format:', typeof alerts);
      }
    } else {
      console.log('❌ API returned success: false');
      console.log('📋 Message:', response.data.message);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Certification alerts test failed:', error.response?.data || error.message);
    throw error;
  }
};

// Test 3: Get worker profile
const testWorkerProfile = async () => {
  console.log('\n👤 Testing GET /worker/profile...');
  
  try {
    const response = await axios.get(`${API_BASE}/worker/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Worker profile retrieved successfully');
      const profile = response.data.profile;
      console.log('📋 Profile Info:');
      console.log(`   Name: ${profile.name}`);
      console.log(`   Employee ID: ${profile.employeeId}`);
      console.log(`   Work Pass Number: ${profile.workPassNumber}`);
      console.log(`   Certifications: ${profile.certifications?.length || 0}`);
      
      if (profile.workPass) {
        console.log('📋 Work Pass Details:');
        console.log(`   Pass Number: ${profile.workPass.passNumber}`);
        console.log(`   Status: ${profile.workPass.status}`);
        console.log(`   Expiry: ${profile.workPass.expiryDate}`);
      }
    } else {
      console.log('❌ Profile API returned success: false');
      console.log('📋 Message:', response.data.message);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Worker profile test failed:', error.response?.data || error.message);
    throw error;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Certification Alerts API Tests');
  console.log('==========================================');
  
  try {
    // Test 1: Login
    await testLogin();
    
    // Test 2: Get certification alerts
    await testCertificationAlerts();
    
    // Test 3: Get worker profile
    await testWorkerProfile();
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
};

// Run the tests
runTests();