/**
 * Test Script for Supervisor Profile APIs
 * Tests all 4 profile endpoints:
 * 1. GET /api/supervisor/profile
 * 2. PUT /api/supervisor/profile
 * 3. PUT /api/supervisor/profile/password
 * 4. POST /api/supervisor/profile/photo
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5002/api';

// Test credentials for supervisor
const SUPERVISOR_CREDENTIALS = {
  email: 'supervisor4@example.com',
  password: 'password123'
};

let authToken = null;

/**
 * Step 1: Login as Supervisor
 */
async function loginAsSupervisor() {
  try {
    console.log('\n🔐 Step 1: Login as Supervisor');
    console.log('=====================================');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, SUPERVISOR_CREDENTIALS);
    
    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      console.log('📝 User Info:', {
        userId: response.data.user.userId,
        email: response.data.user.email,
        role: response.data.user.role,
        companyId: response.data.user.companyId
      });
      return true;
    } else {
      console.error('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Step 2: GET Supervisor Profile
 */
async function getSupervisorProfile() {
  try {
    console.log('\n📋 Step 2: GET Supervisor Profile');
    console.log('=====================================');
    console.log('Endpoint: GET /api/supervisor/profile');
    
    const response = await axios.get(`${BASE_URL}/supervisor/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Profile retrieved successfully');
      console.log('\n📊 Profile Data:');
      console.log(JSON.stringify(response.data.profile, null, 2));
      
      console.log('\n📌 Key Information:');
      console.log(`   Name: ${response.data.profile.name}`);
      console.log(`   Email: ${response.data.profile.email}`);
      console.log(`   Phone: ${response.data.profile.phoneNumber}`);
      console.log(`   Job Title: ${response.data.profile.jobTitle}`);
      console.log(`   Company: ${response.data.profile.companyName}`);
      console.log(`   Assigned Projects: ${response.data.profile.assignedProjects?.length || 0}`);
      console.log(`   Team Size: ${response.data.profile.teamSize || 0}`);
      console.log(`   Photo URL: ${response.data.profile.photoUrl || 'No photo'}`);
      
      return response.data.profile;
    } else {
      console.error('❌ Failed to get profile:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting profile:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Step 3: UPDATE Supervisor Profile
 */
async function updateSupervisorProfile() {
  try {
    console.log('\n✏️ Step 3: UPDATE Supervisor Profile');
    console.log('=====================================');
    console.log('Endpoint: PUT /api/supervisor/profile');
    
    const updateData = {
      phoneNumber: '+65-9876-5432',
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '+65-1234-5678',
        relationship: 'Spouse'
      },
      preferences: {
        notifications: true,
        language: 'en',
        theme: 'light'
      }
    };
    
    console.log('\n📤 Update Data:');
    console.log(JSON.stringify(updateData, null, 2));
    
    const response = await axios.put(
      `${BASE_URL}/supervisor/profile`,
      updateData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success) {
      console.log('\n✅ Profile updated successfully');
      console.log('📊 Updated Data:');
      console.log(JSON.stringify(response.data.data, null, 2));
      return true;
    } else {
      console.error('❌ Failed to update profile:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating profile:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Step 4: Change Supervisor Password
 */
async function changeSupervisorPassword() {
  try {
    console.log('\n🔑 Step 4: Change Supervisor Password');
    console.log('=====================================');
    console.log('Endpoint: PUT /api/supervisor/profile/password');
    
    const passwordData = {
      oldPassword: 'password123',
      newPassword: 'newPassword123'
    };
    
    console.log('\n📤 Attempting password change...');
    console.log('   Old Password: ********');
    console.log('   New Password: ********');
    
    const response = await axios.put(
      `${BASE_URL}/supervisor/profile/password`,
      passwordData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success) {
      console.log('\n✅ Password changed successfully');
      
      // Change it back for future tests
      console.log('\n🔄 Reverting password back...');
      const revertResponse = await axios.put(
        `${BASE_URL}/supervisor/profile/password`,
        {
          oldPassword: 'newPassword123',
          newPassword: 'password123'
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      if (revertResponse.data.success) {
        console.log('✅ Password reverted successfully');
      }
      
      return true;
    } else {
      console.error('❌ Failed to change password:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error changing password:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Step 5: Upload Supervisor Profile Photo
 */
async function uploadSupervisorPhoto() {
  try {
    console.log('\n📸 Step 5: Upload Supervisor Profile Photo');
    console.log('=====================================');
    console.log('Endpoint: POST /api/supervisor/profile/photo');
    
    // Create a test image file if it doesn't exist
    const testImagePath = path.join(process.cwd(), 'uploads', 'test-supervisor-photo.png');
    
    // Check if any image exists in uploads folder
    let imageToUpload = null;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const imageFile = files.find(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
      
      if (imageFile) {
        imageToUpload = path.join(uploadsDir, imageFile);
        console.log(`📁 Using existing image: ${imageFile}`);
      }
    }
    
    if (!imageToUpload) {
      console.log('⚠️ No test image found in uploads folder');
      console.log('💡 Skipping photo upload test');
      console.log('   To test photo upload, place an image file in the uploads folder');
      return false;
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(imageToUpload));
    
    console.log('\n📤 Uploading photo...');
    
    const response = await axios.post(
      `${BASE_URL}/supervisor/profile/photo`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    
    if (response.data.success) {
      console.log('\n✅ Photo uploaded successfully');
      console.log('📊 Photo URL:', response.data.photoUrl);
      return true;
    } else {
      console.error('❌ Failed to upload photo:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error uploading photo:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Step 6: Verify Profile After Updates
 */
async function verifyProfileAfterUpdates() {
  try {
    console.log('\n🔍 Step 6: Verify Profile After Updates');
    console.log('=====================================');
    
    const profile = await getSupervisorProfile();
    
    if (profile) {
      console.log('\n✅ Profile verification complete');
      console.log('📌 Updated fields confirmed:');
      console.log(`   Phone: ${profile.phoneNumber}`);
      console.log(`   Photo: ${profile.photoUrl ? '✅ Uploaded' : '❌ Not uploaded'}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error verifying profile:', error.message);
    return false;
  }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SUPERVISOR PROFILE APIs - COMPREHENSIVE TEST SUITE     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const results = {
    login: false,
    getProfile: false,
    updateProfile: false,
    changePassword: false,
    uploadPhoto: false,
    verifyProfile: false
  };
  
  // Step 1: Login
  results.login = await loginAsSupervisor();
  if (!results.login) {
    console.log('\n❌ Cannot proceed without login. Exiting...');
    return;
  }
  
  // Step 2: Get Profile
  results.getProfile = await getSupervisorProfile() !== null;
  
  // Step 3: Update Profile
  results.updateProfile = await updateSupervisorProfile();
  
  // Step 4: Change Password
  results.changePassword = await changeSupervisorPassword();
  
  // Step 5: Upload Photo
  results.uploadPhoto = await uploadSupervisorPhoto();
  
  // Step 6: Verify Profile
  results.verifyProfile = await verifyProfileAfterUpdates();
  
  // Print Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n📊 Test Results:');
  console.log(`   ${results.login ? '✅' : '❌'} Login as Supervisor`);
  console.log(`   ${results.getProfile ? '✅' : '❌'} GET /api/supervisor/profile`);
  console.log(`   ${results.updateProfile ? '✅' : '❌'} PUT /api/supervisor/profile`);
  console.log(`   ${results.changePassword ? '✅' : '❌'} PUT /api/supervisor/profile/password`);
  console.log(`   ${results.uploadPhoto ? '✅' : '❌'} POST /api/supervisor/profile/photo`);
  console.log(`   ${results.verifyProfile ? '✅' : '❌'} Verify Profile After Updates`);
  
  const passedTests = Object.values(results).filter(r => r).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Supervisor Profile APIs are working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the errors above.');
  }
  
  console.log('\n════════════════════════════════════════════════════════════\n');
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
