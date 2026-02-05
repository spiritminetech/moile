// Test script to verify profile photo upload and display functionality

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://192.168.1.8:5002/api';
let authToken = null;

// Test 1: Login to get auth token
const testLogin = async () => {
  console.log('\n🔐 Testing login...');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'worker1@gmail.com',
      password: 'password123'
    });

    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      console.log(`📋 Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
};

// Test 2: Get current profile
const testGetProfile = async () => {
  console.log('\n👤 Testing GET /worker/profile...');
  
  try {
    const response = await axios.get(`${API_BASE}/worker/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Profile retrieved successfully');
      console.log(`📋 Name: ${response.data.profile.name}`);
      console.log(`📋 Employee ID: ${response.data.profile.employeeId}`);
      console.log(`📋 Photo URL: ${response.data.profile.photoUrl || 'None'}`);
      console.log(`📋 Work Pass: ${response.data.profile.workPass?.passNumber || 'N/A'}`);
      return response.data.profile;
    } else {
      console.log('❌ Failed to get profile:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Profile error:', error.response?.data?.message || error.message);
    return null;
  }
};

// Test 3: Create a test image file
const createTestImage = () => {
  console.log('\n🖼️ Creating test image...');
  
  // Create a simple test image (1x1 pixel PNG)
  const testImageBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x5C, 0xCD, 0x90, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  const testImagePath = path.join(__dirname, 'test-profile-photo.png');
  fs.writeFileSync(testImagePath, testImageBuffer);
  
  console.log(`✅ Test image created: ${testImagePath}`);
  return testImagePath;
};

// Test 4: Upload profile photo
const testUploadPhoto = async () => {
  console.log('\n📸 Testing POST /worker/profile/photo...');
  
  try {
    const testImagePath = createTestImage();
    
    // Create form data
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(testImagePath), {
      filename: 'test-profile-photo.png',
      contentType: 'image/png'
    });

    const response = await axios.post(`${API_BASE}/worker/profile/photo`, formData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      },
      timeout: 30000 // 30 second timeout
    });

    // Clean up test file
    fs.unlinkSync(testImagePath);

    if (response.data.success) {
      console.log('✅ Photo uploaded successfully');
      console.log(`📋 Message: ${response.data.message}`);
      console.log(`📋 Photo URL: ${response.data.photoUrl}`);
      console.log(`📋 Worker Data:`, response.data.worker);
      return response.data;
    } else {
      console.log('❌ Failed to upload photo:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Photo upload error:', error.response?.data?.message || error.message);
    console.log('❌ Error details:', {
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    return null;
  }
};

// Test 5: Verify profile after photo upload
const testProfileAfterUpload = async () => {
  console.log('\n🔍 Testing profile after photo upload...');
  
  // Wait a moment for the database to update
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const profile = await testGetProfile();
  
  if (profile && profile.photoUrl) {
    console.log('✅ Profile photo URL updated successfully');
    return true;
  } else {
    console.log('❌ Profile photo URL not updated');
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('🧪 Starting Profile Photo Upload Tests...');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Login
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log('\n❌ Cannot proceed without login');
      return;
    }
    
    // Test 2: Get initial profile
    const initialProfile = await testGetProfile();
    
    // Test 3: Upload photo
    const uploadResult = await testUploadPhoto();
    
    // Test 4: Verify profile after upload
    const profileUpdated = await testProfileAfterUpload();
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST SUMMARY:');
    console.log(`✅ Login: ${loginSuccess ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Get Profile: ${initialProfile ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Upload Photo: ${uploadResult ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Profile Updated: ${profileUpdated ? 'PASS' : 'FAIL'}`);
    
    if (loginSuccess && initialProfile && uploadResult && profileUpdated) {
      console.log('\n🎉 All tests passed! Photo upload functionality is working.');
    } else {
      console.log('\n⚠️ Some tests failed. Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error.message);
  }
};

// Run the tests
runTests();