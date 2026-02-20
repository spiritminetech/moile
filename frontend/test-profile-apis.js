// Test script for Profile API endpoints
// Tests the missing profile APIs: password change and photo upload

const API_BASE_URL = 'http://192.168.1.100:3000/api';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'worker@test.com',
  password: 'password123'
};

let authToken = '';

// Helper function to make API requests
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  console.log(`\n🔗 ${config.method || 'GET'} ${url}`);
  if (config.body && typeof config.body === 'string') {
    console.log('📤 Request Body:', JSON.parse(config.body));
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log('📥 Response:', data);
    
    return { response, data };
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return { error };
  }
}

// Test authentication
async function testLogin() {
  console.log('\n🔐 Testing Login...');
  
  const { response, data } = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(TEST_CREDENTIALS)
  });

  if (response?.ok && data?.token) {
    authToken = data.token;
    console.log('✅ Login successful');
    return true;
  } else {
    console.log('❌ Login failed');
    return false;
  }
}

// Test get profile
async function testGetProfile() {
  console.log('\n👤 Testing GET /worker/profile...');
  
  const { response, data } = await makeRequest('/worker/profile');
  
  if (response?.ok) {
    console.log('✅ Profile retrieved successfully');
    return data;
  } else {
    console.log('❌ Failed to get profile');
    return null;
  }
}

// Test get certification alerts
async function testGetCertificationAlerts() {
  console.log('\n🏆 Testing GET /worker/profile/certification-alerts...');
  
  const { response, data } = await makeRequest('/worker/profile/certification-alerts');
  
  if (response?.ok) {
    console.log('✅ Certification alerts retrieved successfully');
    return data;
  } else {
    console.log('❌ Failed to get certification alerts');
    return null;
  }
}
// Test password change
async function testChangePassword() {
  console.log('\n🔒 Testing PUT /worker/profile/password...');
  
  const passwordData = {
    oldPassword: 'password123',
    newPassword: 'NewPassword123!'
  };
  
  const { response, data } = await makeRequest('/worker/profile/password', {
    method: 'PUT',
    body: JSON.stringify(passwordData)
  });
  
  if (response?.ok) {
    console.log('✅ Password changed successfully');
    
    // Test reverting password back
    console.log('\n🔄 Reverting password back...');
    const revertData = {
      oldPassword: 'NewPassword123!',
      newPassword: 'password123'
    };
    
    const { response: revertResponse } = await makeRequest('/worker/profile/password', {
      method: 'PUT',
      body: JSON.stringify(revertData)
    });
    
    if (revertResponse?.ok) {
      console.log('✅ Password reverted successfully');
    }
    
    return true;
  } else {
    console.log('❌ Failed to change password');
    return false;
  }
}

// Test profile photo upload
async function testUploadProfilePhoto() {
  console.log('\n📷 Testing POST /worker/profile/photo...');
  
  // Create a mock file for testing
  const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
  
  // Convert base64 to blob for testing
  const byteCharacters = atob(mockImageData.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/jpeg' });
  
  const formData = new FormData();
  formData.append('photo', blob, 'test-profile-photo.jpg');
  
  const { response, data } = await makeRequest('/worker/profile/photo', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
      // Don't set Content-Type for FormData, let browser set it
    },
    body: formData
  });
  
  if (response?.ok) {
    console.log('✅ Profile photo uploaded successfully');
    return data;
  } else {
    console.log('❌ Failed to upload profile photo');
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting Profile API Tests...');
  console.log('=' .repeat(50));
  
  // Test login first
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }
  
  // Test existing profile APIs
  await testGetProfile();
  await testGetCertificationAlerts();
  
  // Test new profile APIs
  await testChangePassword();
  await testUploadProfilePhoto();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Profile API Tests Complete');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
}

module.exports = {
  testGetProfile,
  testGetCertificationAlerts,
  testChangePassword,
  testUploadProfilePhoto,
  runAllTests
};