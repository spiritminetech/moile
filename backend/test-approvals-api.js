import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5002/api';

async function testApprovalsAPI() {
  try {
    console.log('🧪 Testing Approvals API\n');
    console.log('='.repeat(60));

    // Step 1: Login as supervisor
    console.log('\n📝 Step 1: Login as supervisor...');
    
    // Try the credentials from the mobile app logs
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'  // Common default password
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.token || loginResponse.data.data?.token;
    if (!token) {
      console.log('❌ No token received');
      console.log('   Response:', JSON.stringify(loginResponse.data, null, 2));
      return;
    }
    
    console.log('✅ Login successful');
    console.log('   Token:', token.substring(0, 50) + '...');

    // Step 2: Get pending approvals
    console.log('\n📝 Step 2: Fetching pending approvals...');
    const approvalsResponse = await axios.get(`${API_BASE_URL}/supervisor/approvals/pending`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        limit: 50,
        offset: 0
      }
    });

    if (!approvalsResponse.data.success) {
      console.log('❌ Failed to fetch approvals:', approvalsResponse.data.message);
      return;
    }

    const { approvals, summary, pagination } = approvalsResponse.data.data;

    console.log('✅ Approvals fetched successfully\n');
    
    // Display summary
    console.log('='.repeat(60));
    console.log('📊 APPROVALS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Pending: ${summary.totalPending}`);
    console.log(`Urgent Count: ${summary.urgentCount}`);
    console.log(`Overdue Count: ${summary.overdueCount}`);
    console.log('\nBy Type:');
    console.log(`  - Leave: ${summary.byType.leave}`);
    console.log(`  - Material: ${summary.byType.material}`);
    console.log(`  - Tool: ${summary.byType.tool}`);
    console.log(`  - Advance Payment: ${summary.byType.advance_payment}`);
    console.log(`  - Reimbursement: ${summary.byType.reimbursement}`);

    // Display pagination
    console.log('\n' + '='.repeat(60));
    console.log('📄 PAGINATION');
    console.log('='.repeat(60));
    console.log(`Total: ${pagination.total}`);
    console.log(`Limit: ${pagination.limit}`);
    console.log(`Offset: ${pagination.offset}`);
    console.log(`Has More: ${pagination.hasMore}`);

    // Display approvals
    console.log('\n' + '='.repeat(60));
    console.log('📋 PENDING APPROVALS');
    console.log('='.repeat(60));
    
    if (approvals.length === 0) {
      console.log('❌ No approvals returned (but summary shows pending count)');
      console.log('   This indicates the API is not returning approval details');
    } else {
      console.log(`✅ Found ${approvals.length} approvals:\n`);
      
      approvals.forEach((approval, index) => {
        console.log(`${index + 1}. ${approval.requestType.toUpperCase()}`);
        console.log(`   ID: ${approval.id}`);
        console.log(`   Requester: ${approval.requesterName}`);
        console.log(`   Date: ${new Date(approval.requestDate).toLocaleString()}`);
        console.log(`   Urgency: ${approval.urgency}`);
        console.log(`   Status: ${approval.status}`);
        
        // Display type-specific details
        if (approval.requestType === 'leave') {
          console.log(`   Leave Type: ${approval.details.leaveType}`);
          console.log(`   From: ${new Date(approval.details.fromDate).toLocaleDateString()}`);
          console.log(`   To: ${new Date(approval.details.toDate).toLocaleDateString()}`);
          console.log(`   Days: ${approval.details.totalDays}`);
          console.log(`   Reason: ${approval.details.reason}`);
        } else if (approval.requestType === 'advance_payment') {
          console.log(`   Amount: ${approval.details.currency} ${approval.details.amount}`);
          console.log(`   Reason: ${approval.details.reason}`);
        } else if (approval.requestType === 'material' || approval.requestType === 'tool') {
          console.log(`   Item: ${approval.details.itemName}`);
          console.log(`   Quantity: ${approval.details.quantity} ${approval.details.unit}`);
          console.log(`   Project: ${approval.details.projectName}`);
          console.log(`   Required: ${new Date(approval.details.requiredDate).toLocaleDateString()}`);
          console.log(`   Purpose: ${approval.details.purpose}`);
        }
        console.log('');
      });
    }

    console.log('='.repeat(60));
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error testing approvals API:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data?.message || error.response.statusText);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
  }
}

testApprovalsAPI();
