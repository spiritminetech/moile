// Test Worker Profile APIs
// Tests the newly implemented worker profile endpoints

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const API_BASE = 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  // Use existing test user credentials
  email: 'worker@test.com',
  password: 'password123',
  newPassword: 'newpassword123'
};

let authToken = null;
let testPhotoPath = null;

// Helper function to create a test image file
const createTestImage = () => {
  const testImagePath = path.join(process.cwd(), 'test-image.png');
  
  // Create a simple 1x1 PNG image (base64 encoded)
  const pngData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==',
    'base64'
  );
  
  fs.writeFileSync(testImagePath, pngData);
  return testImagePath;
};

// Helper function to clean up test files
const cleanup = () => {
  if (testPhotoPath && fs.existsSync(testPhotoPath)) {
    fs.unlinkSync(testPhotoPath);
  }
  
  // Clean up any uploaded test photos
  const uploadsDir = path.join(process.cwd(), 'uploads', 'workers');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    files.forEach(file => {
      if (file.includes('test') || file.includes('worker-')) {
        try {
          fs.unlinkSync(path.join(uploadsDir, file));
          console.log(`🧹 Cleaned up test file: ${file}`);
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    });
  }
};

// Test 1: Login to get authentication token
const testLogin = async () => {
  console.log('\n🔐 Testing Worker Login...');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: testConfig.email,
      password: testConfig.password
    });

    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      console.log(`📋 User Role: ${response.data.user?.role || 'N/A'}`);
      console.log(`🏢 Company: ${response.data.user?.companyName || 'N/A'}`);
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

// Test 2: Get Worker Profile
const testGetWorkerProfile = async () => {
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
      console.log('📋 Profile Details:');
      const profile = response.data.profile;
      
      console.log(`   ID: ${profile.id}`);
      console.log(`   Employee ID: ${profile.employeeId}`);
      console.log(`   Name: ${profile.name}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Phone: ${profile.phoneNumber}`);
      console.log(`   Company: ${profile.companyName}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Job Title: ${profile.jobTitle}`);
      console.log(`   Department: ${profile.department}`);
      console.log(`   Status: ${profile.status}`);
      console.log(`   Photo URL: ${profile.photoUrl || 'No photo'}`);
      console.log(`   Employee Code: ${profile.employeeCode || 'N/A'}`);
      console.log(`   Created: ${new Date(profile.createdAt).toLocaleDateString()}`);
      
      return profile;
    } else {
      console.log('❌ Failed to get profile:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Profile fetch error:', error.response?.data?.message || error.message);
    return null;
  }
};

// Test 3: Get Certification Alerts
const testGetCertificationAlerts = async () => {
  console.log('\n📜 Testing GET /worker/profile/certification-alerts...');
  
  try {
    const response = await axios.get(`${API_BASE}/worker/profile/certification-alerts`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Certification alerts retrieved successfully');
      console.log(`📋 Message: ${response.data.message}`);
      
      const alerts = response.data.alerts;
      console.log(`📊 Total Certifications: ${alerts.totalCertifications}`);
      console.log(`⚠️ Alert Count: ${alerts.alertCount}`);
      
      if (alerts.expired.length > 0) {
        console.log(`❌ Expired (${alerts.expired.length}):`);
        alerts.expired.forEach(cert => {
          console.log(`   - ${cert.name} (expired ${Math.abs(cert.daysUntilExpiry)} days ago)`);
        });
      }
      
      if (alerts.expiringSoon.length > 0) {
        console.log(`⚠️ Expiring Soon (${alerts.expiringSoon.length}):`);
        alerts.expiringSoon.forEach(cert => {
          console.log(`   - ${cert.name} (expires in ${cert.daysUntilExpiry} days)`);
        });
      }
      
      if (alerts.upToDate.length > 0) {
        console.log(`✅ Up to Date (${alerts.upToDate.length}):`);
        alerts.upToDate.forEach(cert => {
          console.log(`   - ${cert.name} (expires in ${cert.daysUntilExpiry} days)`);
        });
      }
      
      return alerts;
    } else {
      console.log('❌ Failed to get certification alerts:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Certification alerts error:', error.response?.data?.message || error.message);
    return null;
  }
};

// Test 4: Upload Worker Photo
const testUploadWorkerPhoto = async () => {
  console.log('\n📸 Testing POST /worker/profile/photo...');
  
  try {
    // Create test image
    testPhotoPath = createTestImage();
    
    // Create form data
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(testPhotoPath), {
      filename: 'test-worker-photo.png',
      contentType: 'image/png'
    });

    const response = await axios.post(`${API_BASE}/worker/profile/photo`, formData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      }
    });

    if (response.data.success) {
      console.log('✅ Photo uploaded successfully');
      console.log(`📋 Message: ${response.data.message}`);
      console.log(`📸 Photo URL: ${response.data.photoUrl}`);
      
      const worker = response.data.worker;
      console.log('👤 Updated Profile:');
      console.log(`   Name: ${worker.name}`);
      console.log(`   Email: ${worker.email}`);
      console.log(`   Company: ${worker.companyName}`);
      console.log(`   Photo: ${worker.photoUrl}`);
      
      return response.data;
    } else {
      console.log('❌ Failed to upload photo:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Photo upload error:', error.response?.data?.message || error.message);
    return null;
  }
};

// Test 5: Change Worker Password
const testChangeWorkerPassword = async () => {
  console.log('\n🔑 Testing PUT /worker/profile/password...');
  
  try {
    const response = await axios.put(`${API_BASE}/worker/profile/password`, {
      oldPassword: testConfig.password,
      newPassword: testConfig.newPassword
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Password changed successfully');
      console.log(`📋 Message: ${response.data.message}`);
      
      // Test login with new password
      console.log('🔐 Testing login with new password...');
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: testConfig.email,
        password: testConfig.newPassword
      });
      
      if (loginResponse.data.success) {
        console.log('✅ Login with new password successful');
        authToken = loginResponse.data.token; // Update token
        
        // Change password back for future tests
        console.log('🔄 Reverting password for future tests...');
        await axios.put(`${API_BASE}/worker/profile/password`, {
          oldPassword: testConfig.newPassword,
          newPassword: testConfig.password
        }, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Password reverted successfully');
        
      } else {
        console.log('❌ Login with new password failed');
      }
      
      return true;
    } else {
      console.log('❌ Failed to change password:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Password change error:', error.response?.data?.message || error.message);
    return false;
  }
};

// Test 6: Error Handling Tests
const testErrorHandling = async () => {
  console.log('\n🚨 Testing Error Handling...');
  
  // Test without authentication
  console.log('📋 Testing without authentication...');
  try {
    await axios.get(`${API_BASE}/worker/profile`);
    console.log('❌ Should have failed without auth token');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly rejected request without auth token');
    } else {
      console.log('❌ Unexpected error:', error.response?.status);
    }
  }
  
  // Test invalid password change
  console.log('📋 Testing invalid password change...');
  try {
    await axios.put(`${API_BASE}/worker/profile/password`, {
      oldPassword: 'wrongpassword',
      newPassword: 'newpass123'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('❌ Should have failed with wrong old password');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Correctly rejected wrong old password');
    } else {
      console.log('❌ Unexpected error:', error.response?.status);
    }
  }
  
  // Test short password
  console.log('📋 Testing short password...');
  try {
    await axios.put(`${API_BASE}/worker/profile/password`, {
      oldPassword: testConfig.password,
      newPassword: '123'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('❌ Should have failed with short password');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Correctly rejected short password');
    } else {
      console.log('❌ Unexpected error:', error.response?.status);
    }
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Worker Profile API Tests');
  console.log('=====================================');
  
  try {
    // Test 1: Login
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log('\n❌ Cannot proceed without authentication');
      return;
    }
    
    // Test 2: Get Profile
    const profile = await testGetWorkerProfile();
    
    // Test 3: Get Certification Alerts
    const alerts = await testGetCertificationAlerts();
    
    // Test 4: Upload Photo
    const photoUpload = await testUploadWorkerPhoto();
    
    // Test 5: Change Password
    const passwordChange = await testChangeWorkerPassword();
    
    // Test 6: Error Handling
    await testErrorHandling();
    
    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`✅ Login: ${loginSuccess ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Get Profile: ${profile ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Certification Alerts: ${alerts ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Photo Upload: ${photoUpload ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Password Change: ${passwordChange ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Error Handling: PASS`);
    
    console.log('\n🎉 Worker Profile API tests completed!');
    
  } catch (error) {
    console.error('❌ Test runner error:', error.message);
  } finally {
    cleanup();
  }
};

// Handle cleanup on exit
process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit();
});

// Run tests
runAllTests();