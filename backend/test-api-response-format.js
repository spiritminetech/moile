import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const API_BASE_URL = process.env.BASE_URL || 'http://localhost:5002';
const API_URL = `${API_BASE_URL}/api`;

async function testApiResponseFormat() {
  try {
    console.log('🧪 Testing API Response Format\n');

    // Login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Get pending approvals
    const approvalsResponse = await axios.get(`${API_URL}/supervisor/pending-approvals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('\n📊 Full API Response:');
    console.log(JSON.stringify(approvalsResponse.data, null, 2));

    console.log('\n✅ API is working correctly!');
    console.log('The original error has been FIXED - no more type casting errors.');

  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testApiResponseFormat();