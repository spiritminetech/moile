// Test Photo Upload Endpoints
// Tests pickup and dropoff photo upload functionality

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api/driver';

// Test credentials (replace with actual driver credentials)
const TEST_DRIVER = {
  email: 'driver@example.com',
  password: 'password123'
};

let authToken = null;
let testTaskId = null;

// ==============================
// Helper Functions
// ==============================

async function loginDriver() {
  try {
    console.log('🔐 Logging in driver...');
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: TEST_DRIVER.email,
      password: TEST_DRIVER.password
    });
    
    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login successful');
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

async function getTodaysTasks() {
  try {
    console.log('\n📋 Fetching today\'s tasks...');
    const response = await axios.get(`${BASE_URL}/transport-tasks`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success && response.data.data.length > 0) {
      testTaskId = response.data.data[0].taskId;
      console.log(`✅ Found ${response.data.data.length} tasks`);
      console.log(`   Using task ID: ${testTaskId}`);
      return true;
    } else {
      console.log('⚠️ No tasks found for today');
      return false;
    }
  } catch (error) {
    console.error('❌ Error fetching tasks:', error.response?.data || error.message);
    return false;
  }
}

async function createTestImage() {
  try {
    // Create a simple test image file
    const testImagePath = path.join(process.cwd(), 'test-pickup-photo.jpg');
    
    // Check if test image exists, if not create a placeholder
    if (!fs.existsSync(testImagePath)) {
      console.log('⚠️ Test image not found, creating placeholder...');
      // Create a minimal valid JPEG file (1x1 pixel)
      const minimalJpeg = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
        0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
        0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D,
        0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
        0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
        0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
        0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4,
        0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x03, 0xFF, 0xDA, 0x00, 0x08,
        0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x37, 0xFF,
        0xD9
      ]);
      fs.writeFileSync(testImagePath, minimalJpeg);
      console.log('✅ Test image created');
    }
    
    return testImagePath;
  } catch (error) {
    console.error('❌ Error creating test image:', error.message);
    return null;
  }
}

// ==============================
// Test Functions
// ==============================

async function testUploadPickupPhoto() {
  try {
    console.log('\n📸 Testing pickup photo upload...');
    
    if (!testTaskId) {
      console.log('⚠️ No task ID available, skipping test');
      return false;
    }
    
    const testImagePath = await createTestImage();
    if (!testImagePath) {
      console.log('⚠️ Could not create test image, skipping test');
      return false;
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(testImagePath));
    formData.append('taskId', testTaskId.toString());
    formData.append('locationId', '1');
    formData.append('latitude', '12.9716');
    formData.append('longitude', '77.5946');
    formData.append('accuracy', '10');
    formData.append('timestamp', new Date().toISOString());
    
    const response = await axios.post(
      `${BASE_URL}/transport-tasks/${testTaskId}/pickup-photo`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...formData.getHeaders()
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Pickup photo uploaded successfully');
      console.log('   Photo URL:', response.data.photoUrl);
      console.log('   Photo ID:', response.data.photoId);
      console.log('   GPS Tagged:', response.data.data?.gpsTagged);
      return true;
    } else {
      console.log('❌ Upload failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error uploading pickup photo:', error.response?.data || error.message);
    return false;
  }
}

async function testUploadDropoffPhoto() {
  try {
    console.log('\n📸 Testing dropoff photo upload...');
    
    if (!testTaskId) {
      console.log('⚠️ No task ID available, skipping test');
      return false;
    }
    
    const testImagePath = await createTestImage();
    if (!testImagePath) {
      console.log('⚠️ Could not create test image, skipping test');
      return false;
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(testImagePath));
    formData.append('taskId', testTaskId.toString());
    formData.append('latitude', '12.9716');
    formData.append('longitude', '77.5946');
    formData.append('accuracy', '10');
    formData.append('timestamp', new Date().toISOString());
    
    const response = await axios.post(
      `${BASE_URL}/transport-tasks/${testTaskId}/dropoff-photo`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...formData.getHeaders()
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Dropoff photo uploaded successfully');
      console.log('   Photo URL:', response.data.photoUrl);
      console.log('   Photo ID:', response.data.photoId);
      console.log('   GPS Tagged:', response.data.data?.gpsTagged);
      return true;
    } else {
      console.log('❌ Upload failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error uploading dropoff photo:', error.response?.data || error.message);
    return false;
  }
}

async function testUploadWithoutPhoto() {
  try {
    console.log('\n🧪 Testing upload without photo (should fail)...');
    
    if (!testTaskId) {
      console.log('⚠️ No task ID available, skipping test');
      return false;
    }
    
    const formData = new FormData();
    formData.append('taskId', testTaskId.toString());
    formData.append('locationId', '1');
    
    const response = await axios.post(
      `${BASE_URL}/transport-tasks/${testTaskId}/pickup-photo`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...formData.getHeaders()
        }
      }
    );
    
    console.log('❌ Should have failed but succeeded:', response.data);
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Correctly rejected upload without photo');
      console.log('   Error message:', error.response.data.message);
      return true;
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
      return false;
    }
  }
}

async function testUploadWithInvalidTask() {
  try {
    console.log('\n🧪 Testing upload with invalid task ID (should fail)...');
    
    const testImagePath = await createTestImage();
    if (!testImagePath) {
      console.log('⚠️ Could not create test image, skipping test');
      return false;
    }
    
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(testImagePath));
    formData.append('taskId', '99999');
    formData.append('locationId', '1');
    
    const response = await axios.post(
      `${BASE_URL}/transport-tasks/99999/pickup-photo`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...formData.getHeaders()
        }
      }
    );
    
    console.log('❌ Should have failed but succeeded:', response.data);
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Correctly rejected upload for invalid task');
      console.log('   Error message:', error.response.data.message);
      return true;
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
      return false;
    }
  }
}

// ==============================
// Run All Tests
// ==============================

async function runAllTests() {
  console.log('🚀 Starting Photo Upload Endpoint Tests\n');
  console.log('=' .repeat(60));
  
  // Step 1: Login
  const loginSuccess = await loginDriver();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }
  
  // Step 2: Get tasks
  const tasksSuccess = await getTodaysTasks();
  if (!tasksSuccess) {
    console.log('\n⚠️ No tasks available for testing');
    console.log('   You can still test error cases');
  }
  
  // Step 3: Run tests
  const results = {
    pickupPhoto: await testUploadPickupPhoto(),
    dropoffPhoto: await testUploadDropoffPhoto(),
    noPhoto: await testUploadWithoutPhoto(),
    invalidTask: await testUploadWithInvalidTask()
  };
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary:');
  console.log('='.repeat(60));
  console.log(`Pickup Photo Upload:        ${results.pickupPhoto ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Dropoff Photo Upload:       ${results.dropoffPhoto ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`No Photo Validation:        ${results.noPhoto ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Invalid Task Validation:    ${results.invalidTask ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(60));
  
  const passCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.values(results).length;
  console.log(`\n🎯 Overall: ${passCount}/${totalCount} tests passed`);
  
  if (passCount === totalCount) {
    console.log('✅ All tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
