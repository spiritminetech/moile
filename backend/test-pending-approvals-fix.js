import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function testPendingApprovalsFix() {
  try {
    console.log('🧪 Testing Pending Approvals Fix\n');

    // First, login as supervisor to get token
    console.log('1️⃣ Logging in as supervisor...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Test the pending approvals endpoint
    console.log('\n2️⃣ Testing pending approvals endpoint...');
    const approvalsResponse = await axios.get(`${API_BASE_URL}/supervisor/pending-approvals`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });

    console.log('✅ Pending approvals API call successful!');
    console.log('📊 Response data:', {
      success: approvalsResponse.data.success,
      totalApprovals: approvalsResponse.data.data?.approvals?.length || 0,
      summary: approvalsResponse.data.data?.summary,
      pagination: approvalsResponse.data.data?.pagination
    });

    if (approvalsResponse.data.data?.approvals?.length > 0) {
      console.log('\n📋 Sample approvals:');
      approvalsResponse.data.data.approvals.slice(0, 3).forEach((approval, idx) => {
        console.log(`\n${idx + 1}. ${approval.requestType.toUpperCase()} Request:`);
        console.log(`   ID: ${approval.id}`);
        console.log(`   Requester: ${approval.requesterName}`);
        console.log(`   Requester ID: ${approval.requesterId} (type: ${typeof approval.requesterId})`);
        console.log(`   Status: ${approval.status}`);
        console.log(`   Date: ${approval.requestDate}`);
      });
    }

    console.log('\n✅ Test completed successfully - No type casting errors!');

  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response?.data?.error?.includes('Cast to Number failed')) {
      console.error('\n🚨 STILL GETTING TYPE CASTING ERROR - Fix not working');
    }
  }
}

testPendingApprovalsFix();