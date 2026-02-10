// Test script to verify daily progress photo upload fix
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = 'http://192.168.1.6:5002/api';

// Test credentials for supervisor
const SUPERVISOR_CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'Password123'
};

let authToken = '';

async function login() {
  try {
    console.log('\n🔐 Logging in as supervisor...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, SUPERVISOR_CREDENTIALS);
    
    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      console.log(`📝 Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.error('❌ Login failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return false;
  }
}

async function testPhotoUploadWithoutPhotos() {
  try {
    console.log('\n📸 Test 1: Upload without photos (should fail)...');
    
    const formData = new FormData();
    formData.append('projectId', '1');
    formData.append('remarks', 'Test without photos');
    
    const response = await axios.post(
      `${API_BASE_URL}/supervisor/daily-progress/photos`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log('❌ Should have failed but succeeded:', response.data);
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message === 'No photos uploaded') {
      console.log('✅ Correctly rejected request without photos');
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
}

async function testPhotoUploadWithMockPhoto() {
  try {
    console.log('\n📸 Test 2: Upload with mock photo...');
    
    // Create a mock photo file
    const mockPhotoPath = path.join(__dirname, 'test-progress-photo.jpg');
    
    // Check if test photo exists, if not create a simple one
    if (!fs.existsSync(mockPhotoPath)) {
      console.log('📝 Creating mock photo file...');
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
      fs.writeFileSync(mockPhotoPath, minimalJpeg);
    }
    
    const formData = new FormData();
    formData.append('projectId', '1');
    formData.append('remarks', 'Test with mock photo');
    formData.append('issues', 'Test issue for photo upload');
    formData.append('photos', fs.createReadStream(mockPhotoPath), {
      filename: 'test-progress-photo.jpg',
      contentType: 'image/jpeg'
    });
    
    const response = await axios.post(
      `${API_BASE_URL}/supervisor/daily-progress/photos`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log('✅ Photo upload successful!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    console.log(`📸 Photos uploaded: ${response.data.count}`);
    console.log(`📝 Daily Progress ID: ${response.data.dailyProgress?.id}`);
    
  } catch (error) {
    console.error('❌ Photo upload failed:', error.response?.data || error.message);
  }
}

async function testPhotoUploadWithMultiplePhotos() {
  try {
    console.log('\n📸 Test 3: Upload with multiple photos...');
    
    const mockPhotoPath = path.join(__dirname, 'test-progress-photo.jpg');
    
    const formData = new FormData();
    formData.append('projectId', '1');
    formData.append('remarks', 'Test with multiple photos');
    
    // Add 3 photos
    for (let i = 0; i < 3; i++) {
      formData.append('photos', fs.createReadStream(mockPhotoPath), {
        filename: `test-photo-${i + 1}.jpg`,
        contentType: 'image/jpeg'
      });
    }
    
    const response = await axios.post(
      `${API_BASE_URL}/supervisor/daily-progress/photos`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log('✅ Multiple photos upload successful!');
    console.log(`📸 Photos uploaded: ${response.data.count}`);
    console.log(`📝 Daily Progress ID: ${response.data.dailyProgress?.id}`);
    
  } catch (error) {
    console.error('❌ Multiple photos upload failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Daily Progress Photo Upload Tests...');
  console.log('=' .repeat(60));
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n❌ Cannot proceed without authentication');
    return;
  }
  
  // Run tests
  await testPhotoUploadWithoutPhotos();
  await testPhotoUploadWithMockPhoto();
  await testPhotoUploadWithMultiplePhotos();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
