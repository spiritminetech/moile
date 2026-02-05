// Test script to verify profile photo upload fix
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5002/api';

// Test credentials - update these with valid worker credentials
const TEST_CREDENTIALS = {
  email: 'worker@gmail.com',
  password: 'password123'
};

let authToken = '';

// Test 1: Login to get auth token
const testLogin = async () => {
  console.log('\n🔐 Testing login...');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, TEST_CREDENTIALS);
    
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
    console.error('❌ Login error:', error.response?.data || error.message);
    return false;
  }
};

// Test 2: Get current profile
const testGetProfile = async () => {
  console.log('\n👤 Testing GET /worker/profile...');
  
  try {
    const response = await axios.get(`${API_BASE}/worker/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      const profile = response.data.profile;
      console.log('✅ Profile retrieved successfully');
      console.log(`📋 Name: ${profile.name}`);
      console.log(`📋 Employee ID: ${profile.employeeId}`);
      console.log(`📋 Current Photo URL: ${profile.photoUrl || 'None'}`);
      return profile;
    } else {
      console.log('❌ Profile retrieval failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Profile error:', error.response?.data || error.message);
    return null;
  }
};

// Create a test image
const createTestImage = () => {
  console.log('\n🖼️ Creating test image...');
  
  // Create a simple PNG image buffer (1x1 pixel red image)
  const testImageBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8E, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  const testImagePath = path.join(__dirname, 'test-profile-photo.png');
  fs.writeFileSync(testImagePath, testImageBuffer);
  
  console.log('✅ Test image created:', testImagePath);
  return testImagePath;
};

// Test 3: Upload profile photo
const testUploadPhoto = async () => {
  console.log('\n📸 Testing POST /worker/profile/photo...');
  
  const testImagePath = createTestImage();
  
  try {
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(testImagePath), {
      filename: 'test-profile-photo.png',
      contentType: 'image/png'
    });

    const response = await axios.post(`${API_BASE}/worker/profile/photo`, formData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('📥 Upload response:', {
      success: response.data.success,
      message: response.data.message,
      hasData: !!response.data.data,
      hasPhotoUrl: !!(response.data.photoUrl || response.data.data?.photoUrl),
      photoUrl: response.data.photoUrl || response.data.data?.photoUrl
    });
    
    if (response.data.success) {
      console.log('✅ Photo upload successful');
      const photoUrl = response.data.photoUrl || response.data.data?.photoUrl;
      console.log(`📋 Photo URL: ${photoUrl}`);
      
      // Clean up test image
      fs.unlinkSync(testImagePath);
      
      return photoUrl;
    } else {
      console.log('❌ Photo upload failed:', response.data.message);
      fs.unlinkSync(testImagePath);
      return null;
    }
  } catch (error) {
    console.error('❌ Upload error:', error.response?.data || error.message);
    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    return null;
  }
};

// Test 4: Verify profile after photo upload
const testProfileAfterUpload = async () => {
  console.log('\n🔍 Testing profile after photo upload...');
  
  // Wait a moment for the database to update
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const profile = await testGetProfile();
  
  if (profile && profile.photoUrl) {
    console.log('✅ Profile photo URL updated successfully');
    console.log(`📋 New Photo URL: ${profile.photoUrl}`);
    return true;
  } else {
    console.log('❌ Profile photo URL not updated');
    return false;
  }
};

// Test 5: Test photo URL accessibility
const testPhotoAccess = async (photoUrl) => {
  if (!photoUrl) {
    console.log('\n⚠️ No photo URL to test');
    return false;
  }
  
  console.log('\n🌐 Testing photo URL accessibility...');
  console.log(`🔗 Testing URL: ${photoUrl}`);
  
  try {
    const response = await axios.get(photoUrl, {
      responseType: 'arraybuffer',
      timeout: 5000
    });
    
    if (response.status === 200) {
      console.log('✅ Photo URL is accessible');
      console.log(`📋 Content-Type: ${response.headers['content-type']}`);
      console.log(`📋 Content-Length: ${response.headers['content-length']} bytes`);
      return true;
    } else {
      console.log(`❌ Photo URL returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Photo access error:', error.message);
    if (error.response) {
      console.log(`📋 Response status: ${error.response.status}`);
      console.log(`📋 Response data: ${error.response.data}`);
    }
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('🧪 Starting Profile Photo Upload Fix Tests...');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Login
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log('\n❌ Cannot proceed without authentication');
      return;
    }
    
    // Test 2: Get current profile
    const initialProfile = await testGetProfile();
    
    // Test 3: Upload photo
    const photoUrl = await testUploadPhoto();
    
    // Test 4: Verify profile update
    const profileUpdated = await testProfileAfterUpload();
    
    // Test 5: Test photo accessibility
    const photoAccessible = await testPhotoAccess(photoUrl);
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST SUMMARY:');
    console.log(`🔐 Login: ${loginSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`👤 Profile Retrieval: ${initialProfile ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📸 Photo Upload: ${photoUrl ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔄 Profile Update: ${profileUpdated ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🌐 Photo Access: ${photoAccessible ? '✅ PASS' : '❌ FAIL'}`);
    
    const allTestsPassed = loginSuccess && initialProfile && photoUrl && profileUpdated && photoAccessible;
    console.log(`\n🎯 OVERALL: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allTestsPassed) {
      console.log('\n🎉 Profile photo upload functionality is working correctly!');
      console.log('📱 The mobile app should now be able to upload and display profile photos.');
    } else {
      console.log('\n🔧 Some issues were found. Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('\n💥 Unexpected error during testing:', error);
  }
};

// Run the tests
runTests();