import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://192.168.1.6:5002/api';

// Test credentials (use your actual driver credentials)
const TEST_DRIVER = {
  email: 'driver1@gmail.com',
  password: 'Password123@'
};

const TEST_TASK_ID = 10005; // Use actual task ID from your database

async function testPickupPhotoUpload() {
  try {
    console.log('🧪 Testing Pickup Photo Upload Endpoint');
    console.log('========================================\n');

    // Step 1: Login to get token
    console.log('1️⃣ Logging in as driver...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_DRIVER);
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   Driver ID: ${loginResponse.data.user.id}`);
    console.log(`   Driver Name: ${loginResponse.data.user.name}\n`);

    // Step 2: Create a test image file
    console.log('2️⃣ Creating test image...');
    const testImagePath = path.join(__dirname, 'test-pickup-photo.jpg');
    
    // Create a simple test image (1x1 pixel JPEG)
    const testImageBuffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
      0x7F, 0xFF, 0xD9
    ]);
    
    fs.writeFileSync(testImagePath, testImageBuffer);
    console.log('✅ Test image created');
    console.log(`   Path: ${testImagePath}\n`);

    // Step 3: Test pickup photo upload
    console.log('3️⃣ Testing pickup photo upload...');
    console.log(`   Endpoint: POST ${BASE_URL}/driver/transport-tasks/${TEST_TASK_ID}/pickup-photo`);
    
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(testImagePath));
    formData.append('taskId', TEST_TASK_ID.toString());
    formData.append('locationId', '1000500'); // Example location ID
    formData.append('latitude', '25.2048');
    formData.append('longitude', '55.2708');
    formData.append('accuracy', '10');
    formData.append('timestamp', new Date().toISOString());
    formData.append('remarks', 'Test pickup photo from automated test');

    const uploadResponse = await axios.post(
      `${BASE_URL}/driver/transport-tasks/${TEST_TASK_ID}/pickup-photo`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000 // 30 second timeout
      }
    );

    console.log('✅ Pickup photo upload successful!');
    console.log('   Response:', JSON.stringify(uploadResponse.data, null, 2));
    console.log('\n========================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('========================================\n');

    // Cleanup
    fs.unlinkSync(testImagePath);
    console.log('🧹 Test image cleaned up');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('========================================');
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Request details:', {
        method: error.config?.method,
        url: error.config?.url,
        timeout: error.config?.timeout
      });
    } else {
      console.error('Error:', error.message);
    }
    
    console.error('========================================\n');
    process.exit(1);
  }
}

// Run the test
testPickupPhotoUpload();
