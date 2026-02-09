import axios from 'axios';

const BASE_URL = 'http://192.168.1.8:5002';

async function testDashboardAPI() {
  try {
    console.log('🔐 Step 1: Login as supervisor...');
    
    // Login as supervisor
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'kawaja@gmail.com',
      password: 'kawaja123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('   Token:', token.substring(0, 50) + '...');

    console.log('\n📊 Step 2: Fetch dashboard data...');
    
    // Get dashboard data
    const dashboardResponse = await axios.get(`${BASE_URL}/api/supervisor/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Dashboard API response:');
    console.log(JSON.stringify(dashboardResponse.data, null, 2));

    console.log('\n📋 Pending Approvals Breakdown:');
    const approvals = dashboardResponse.data.data.pendingApprovals;
    console.log('  Leave Requests:', approvals.leaveRequests);
    console.log('  Material Requests:', approvals.materialRequests);
    console.log('  Tool Requests:', approvals.toolRequests);
    console.log('  Urgent:', approvals.urgent);
    console.log('  Total:', approvals.total);

    console.log('\n📊 Step 3: Fetch approvals screen data...');
    
    // Get approvals screen data
    const approvalsResponse = await axios.get(`${BASE_URL}/api/supervisor/approvals/pending`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Approvals API response summary:');
    const approvalsData = approvalsResponse.data.data;
    console.log('  Total Approvals:', approvalsData.approvals.length);
    console.log('  Summary:', approvalsData.summary);

    console.log('\n📝 Approval Items:');
    approvalsData.approvals.forEach((approval, index) => {
      console.log(`  ${index + 1}. ${approval.requestType} - ${approval.requesterName}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDashboardAPI();
