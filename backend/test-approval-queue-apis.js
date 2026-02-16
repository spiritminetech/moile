/**
 * Test approval queue APIs for supervisorId 4
 */

import axios from 'axios';

const BASE_URL = 'http://192.168.1.6:5002/api';
const CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'password123'
};

async function testApprovalQueueAPIs() {
  try {
    console.log('🔍 Testing Approval Queue APIs for Supervisor ID 4...\n');

    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Test Pending Approvals Summary
    console.log('2️⃣ Testing Pending Approvals Summary...');
    try {
      const response = await axios.get(`${BASE_URL}/supervisor/pending-approvals`, { headers });
      console.log('✅ Pending Approvals Summary API working!');
      console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Pending Approvals Summary API failed:');
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Error: ${error.response.data.message || error.response.data.error || 'Unknown error'}`);
      } else {
        console.log(`Error: ${error.message}`);
      }
    }

    // Step 3: Test Dashboard Data (includes approvals)
    console.log('\n3️⃣ Testing Dashboard Data...');
    try {
      const response = await axios.get(`${BASE_URL}/supervisor/dashboard`, { headers });
      console.log('✅ Dashboard API working!');
      if (response.data.data && response.data.data.pendingApprovals) {
        console.log(`📊 Pending Approvals in Dashboard:`, JSON.stringify(response.data.data.pendingApprovals, null, 2));
      } else {
        console.log('⚠️  No pendingApprovals section found in dashboard response');
      }
    } catch (error) {
      console.log('❌ Dashboard API failed:');
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Error: ${error.response.data.message || error.response.data.error || 'Unknown error'}`);
      } else {
        console.log(`Error: ${error.message}`);
      }
    }

    // Step 4: Test Individual Approval APIs
    const approvalAPIs = [
      { name: 'Pending Leave Requests', endpoint: '/supervisor/pending-leave-requests' },
      { name: 'Pending Payment Requests', endpoint: '/supervisor/pending-advance-requests' },
      { name: 'Pending Material Requests', endpoint: '/supervisor/pending-material-requests' },
      { name: 'Pending Tool Requests', endpoint: '/supervisor/pending-tool-requests' }
    ];

    for (const api of approvalAPIs) {
      console.log(`\n4️⃣ Testing ${api.name}...`);
      try {
        const response = await axios.get(`${BASE_URL}${api.endpoint}`, { headers });
        console.log(`✅ ${api.name} API working!`);
        console.log(`📊 Found ${response.data.data?.length || response.data.length || 0} requests`);
        
        if (response.data.data && response.data.data.length > 0) {
          console.log(`📝 First request: ${response.data.data[0].reason || response.data.data[0].itemName || 'No description'}`);
        } else if (response.data.length > 0) {
          console.log(`📝 First request: ${response.data[0].reason || response.data[0].itemName || 'No description'}`);
        }
      } catch (error) {
        console.log(`❌ ${api.name} API failed:`);
        if (error.response) {
          console.log(`Status: ${error.response.status}`);
          console.log(`Error: ${error.response.data.message || error.response.data.error || 'Unknown error'}`);
        } else {
          console.log(`Error: ${error.message}`);
        }
      }
    }

    console.log('\n✅ All approval queue API tests completed');

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

testApprovalQueueAPIs();