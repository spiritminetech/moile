import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5002';
const API_URL = `${BASE_URL}/api`;

/**
 * Test script for GET /api/supervisor/pending-approvals
 * Tests the new pending approvals summary endpoint
 */

async function testPendingApprovalsAPI() {
  console.log('🧪 Testing Pending Approvals Summary API\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Login as supervisor
    console.log('\n📝 Step 1: Login as Supervisor');
    console.log('-'.repeat(60));
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.token;
    const supervisorInfo = loginResponse.data.user;

    console.log('✅ Login successful');
    console.log('   User:', supervisorInfo.name);
    console.log('   Role:', supervisorInfo.role);
    console.log('   Company:', supervisorInfo.companyName);
    console.log('   Token:', token.substring(0, 20) + '...');

    // Step 2: Get pending approvals summary
    console.log('\n📊 Step 2: Get Pending Approvals Summary');
    console.log('-'.repeat(60));

    const approvalsResponse = await axios.get(
      `${API_URL}/supervisor/pending-approvals`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!approvalsResponse.data.success) {
      console.error('❌ Failed to get pending approvals:', approvalsResponse.data.message);
      return;
    }

    const approvals = approvalsResponse.data.data;

    console.log('✅ Pending Approvals Summary Retrieved:');
    console.log('\n📋 Approval Counts:');
    console.log('   Leave Requests:    ', approvals.leaveRequests);
    console.log('   Advance Requests:  ', approvals.advanceRequests);
    console.log('   Material Requests: ', approvals.materialRequests);
    console.log('   Tool Requests:     ', approvals.toolRequests);
    console.log('   ─────────────────────────────────');
    console.log('   Total Pending:     ', approvals.total);
    console.log('   🔴 Urgent (>24h):  ', approvals.urgent);

    // Step 3: Display breakdown
    console.log('\n📈 Approval Breakdown:');
    console.log('-'.repeat(60));

    if (approvals.total === 0) {
      console.log('✅ No pending approvals - All caught up!');
    } else {
      console.log(`⚠️  ${approvals.total} total approvals pending`);
      
      if (approvals.urgent > 0) {
        console.log(`🔴 ${approvals.urgent} urgent approvals (older than 24 hours)`);
      }

      console.log('\nBreakdown by type:');
      if (approvals.leaveRequests > 0) {
        console.log(`   🏥 ${approvals.leaveRequests} Leave Requests`);
      }
      if (approvals.advanceRequests > 0) {
        console.log(`   💰 ${approvals.advanceRequests} Advance Payment Requests`);
      }
      if (approvals.materialRequests > 0) {
        console.log(`   📦 ${approvals.materialRequests} Material Requests`);
      }
      if (approvals.toolRequests > 0) {
        console.log(`   🔧 ${approvals.toolRequests} Tool Requests`);
      }
    }

    // Step 4: Test response format
    console.log('\n✅ Step 3: Verify Response Format');
    console.log('-'.repeat(60));

    const expectedFields = [
      'leaveRequests',
      'advanceRequests', 
      'materialRequests',
      'toolRequests',
      'urgent',
      'total'
    ];

    let formatValid = true;
    for (const field of expectedFields) {
      if (typeof approvals[field] !== 'number') {
        console.error(`❌ Field '${field}' is not a number`);
        formatValid = false;
      }
    }

    if (formatValid) {
      console.log('✅ Response format is valid');
      console.log('   All fields are present and have correct types');
    }

    // Step 5: Performance check
    console.log('\n⚡ Step 4: Performance Check');
    console.log('-'.repeat(60));

    const startTime = Date.now();
    await axios.get(
      `${API_URL}/supervisor/pending-approvals`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`✅ Response time: ${responseTime}ms`);
    if (responseTime < 500) {
      console.log('   🚀 Excellent performance!');
    } else if (responseTime < 1000) {
      console.log('   ✅ Good performance');
    } else {
      console.log('   ⚠️  Slow response - consider optimization');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   Total Pending Approvals: ${approvals.total}`);
    console.log(`   Urgent Approvals: ${approvals.urgent}`);
    console.log(`   Response Time: ${responseTime}ms`);
    console.log(`   API Status: ✅ Working`);

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('='.repeat(60));
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data?.message || error.response.statusText);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Is the backend running on', BASE_URL, '?');
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testPendingApprovalsAPI();
