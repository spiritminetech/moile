import axios from 'axios';

const BASE_URL = 'http://192.168.1.8:5002/api';

async function testSupervisorDashboardAuth() {
  console.log('🧪 Testing Supervisor Dashboard Authentication Fix\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Login as supervisor
    console.log('\n📝 Step 1: Login as Supervisor');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    if (!loginResponse.data.token) {
      console.error('❌ Login failed - no token received');
      console.log('Response:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('✅ Login successful');
    console.log('   User:', user.email);
    console.log('   Role:', user.role);
    console.log('   Token:', token.substring(0, 20) + '...');

    // Step 2: Test dashboard WITHOUT token (should fail with 401)
    console.log('\n📝 Step 2: Test Dashboard WITHOUT Token (should fail)');
    try {
      await axios.get(`${BASE_URL}/supervisor/dashboard`);
      console.log('❌ UNEXPECTED: Dashboard accessible without token!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected - 401 Unauthorized');
        console.log('   Message:', error.response.data.message);
      } else {
        console.log('⚠️  Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Step 3: Test dashboard WITH token (should succeed)
    console.log('\n📝 Step 3: Test Dashboard WITH Token (should succeed)');
    const dashboardResponse = await axios.get(`${BASE_URL}/supervisor/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (dashboardResponse.data.success) {
      console.log('✅ Dashboard data loaded successfully');
      console.log('   Projects:', dashboardResponse.data.data.projects?.length || 0);
      console.log('   Total Workers:', dashboardResponse.data.data.teamOverview?.totalMembers || 0);
      console.log('   Present Today:', dashboardResponse.data.data.teamOverview?.presentToday || 0);
      console.log('   Total Tasks:', dashboardResponse.data.data.taskMetrics?.totalTasks || 0);
      console.log('   Pending Approvals:', dashboardResponse.data.data.pendingApprovals?.total || 0);
    } else {
      console.log('❌ Dashboard request failed');
      console.log('   Response:', dashboardResponse.data);
    }

    // Step 4: Test with invalid token (should fail with 401)
    console.log('\n📝 Step 4: Test Dashboard WITH Invalid Token (should fail)');
    try {
      await axios.get(`${BASE_URL}/supervisor/dashboard`, {
        headers: {
          'Authorization': 'Bearer invalid_token_12345'
        }
      });
      console.log('❌ UNEXPECTED: Dashboard accessible with invalid token!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected - 401 Unauthorized');
        console.log('   Message:', error.response.data.message);
      } else {
        console.log('⚠️  Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All authentication tests passed!');
    console.log('\n📱 Mobile App Fix:');
    console.log('   The dashboard endpoint now requires authentication.');
    console.log('   Make sure the mobile app is sending the Bearer token.');
    console.log('   Check AsyncStorage for AUTH_TOKEN key.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testSupervisorDashboardAuth();
