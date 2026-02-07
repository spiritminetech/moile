import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const SUPERVISOR_CREDENTIALS = {
  email: 'supervisor4@example.com',
  password: 'password123'
};

let supervisorToken = '';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Login function
async function login() {
  try {
    log('\n🔐 Logging in as Supervisor...', 'cyan');
    const response = await axios.post(`${BASE_URL}/auth/login`, SUPERVISOR_CREDENTIALS);
    
    if (response.data.success && response.data.token) {
      supervisorToken = response.data.token;
      log('✅ Login successful!', 'green');
      return true;
    } else {
      log('❌ Login failed: No token received', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Login error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Test API endpoint
async function testEndpoint(method, endpoint, description, data = null) {
  try {
    const config = {
      headers: { Authorization: `Bearer ${supervisorToken}` }
    };

    let response;
    if (method === 'GET') {
      response = await axios.get(`${BASE_URL}${endpoint}`, config);
    } else if (method === 'POST') {
      response = await axios.post(`${BASE_URL}${endpoint}`, data || {}, config);
    } else if (method === 'PUT') {
      response = await axios.put(`${BASE_URL}${endpoint}`, data || {}, config);
    }

    if (response.status === 200 || response.status === 201) {
      log(`✅ ${description}`, 'green');
      log(`   Endpoint: ${method} ${endpoint}`, 'cyan');
      return { success: true, data: response.data };
    } else {
      log(`⚠️  ${description} - Unexpected status: ${response.status}`, 'yellow');
      return { success: false, status: response.status };
    }
  } catch (error) {
    if (error.response) {
      log(`❌ ${description}`, 'red');
      log(`   Endpoint: ${method} ${endpoint}`, 'cyan');
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Error: ${error.response.data?.message || 'Unknown error'}`, 'red');
    } else {
      log(`❌ ${description} - Network error`, 'red');
      log(`   ${error.message}`, 'red');
    }
    return { success: false, error: error.message };
  }
}

// Test Daily Progress APIs
async function testDailyProgressAPIs() {
  log('\n' + '='.repeat(70), 'blue');
  log('📊 TESTING DAILY PROGRESS APIS', 'blue');
  log('='.repeat(70), 'blue');

  const projectId = 1;
  const date = new Date().toISOString().split('T')[0];

  // Test Manpower Tracking
  log('\n1️⃣  Testing Manpower Tracking API...', 'yellow');
  const manpowerData = {
    projectId,
    date,
    manpowerUsed: [
      {
        category: 'Skilled Labor',
        count: 10,
        hours: 8,
        notes: 'Carpenters and electricians'
      },
      {
        category: 'Unskilled Labor',
        count: 15,
        hours: 8,
        notes: 'General helpers'
      }
    ]
  };
  await testEndpoint('POST', '/supervisor/daily-progress/manpower', 'POST /supervisor/daily-progress/manpower', manpowerData);

  // Test Issues/Safety Observations
  log('\n2️⃣  Testing Issues/Safety Observations API...', 'yellow');
  const issuesData = {
    projectId,
    date,
    issues: 'Minor delay due to material shortage. Safety inspection completed - all clear.',
    safetyObservations: [
      {
        type: 'Safety Inspection',
        severity: 'Low',
        description: 'All workers wearing proper PPE',
        actionTaken: 'Routine inspection completed'
      }
    ]
  };
  await testEndpoint('POST', '/supervisor/daily-progress/issues', 'POST /supervisor/daily-progress/issues', issuesData);

  // Test Material Consumption
  log('\n3️⃣  Testing Material Consumption API...', 'yellow');
  const materialsData = {
    projectId,
    date,
    materialsUsed: [
      {
        materialName: 'Cement',
        quantity: 50,
        unit: 'bags',
        notes: 'Used for foundation work'
      },
      {
        materialName: 'Steel Rods',
        quantity: 100,
        unit: 'kg',
        notes: 'Reinforcement for columns'
      }
    ]
  };
  await testEndpoint('POST', '/supervisor/daily-progress/materials', 'POST /supervisor/daily-progress/materials', materialsData);
}

// Test Requests & Approvals APIs
async function testRequestsApprovalsAPIs() {
  log('\n' + '='.repeat(70), 'blue');
  log('📋 TESTING REQUESTS & APPROVALS APIS', 'blue');
  log('='.repeat(70), 'blue');

  // Test Get Pending Leave Requests
  log('\n1️⃣  Testing Get Pending Leave Requests...', 'yellow');
  const leaveResult = await testEndpoint('GET', '/supervisor/pending-leave-requests', 'GET /supervisor/pending-leave-requests');

  // Test Approve Leave Request (if there are pending requests)
  if (leaveResult.success && leaveResult.data?.requests?.length > 0) {
    const requestId = leaveResult.data.requests[0].id;
    log('\n2️⃣  Testing Approve Leave Request...', 'yellow');
    const approveData = {
      action: 'approve',
      remarks: 'Approved - adequate coverage available'
    };
    await testEndpoint('POST', `/supervisor/approve-leave/${requestId}`, `POST /supervisor/approve-leave/${requestId}`, approveData);
  } else {
    log('\n2️⃣  ⚠️  Skipping Approve Leave - No pending requests', 'yellow');
  }

  // Test Get Pending Advance Requests
  log('\n3️⃣  Testing Get Pending Advance Requests...', 'yellow');
  const advanceResult = await testEndpoint('GET', '/supervisor/pending-advance-requests', 'GET /supervisor/pending-advance-requests');

  // Test Approve Advance Request (if there are pending requests)
  if (advanceResult.success && advanceResult.data?.requests?.length > 0) {
    const requestId = advanceResult.data.requests[0].id;
    log('\n4️⃣  Testing Approve Advance Request...', 'yellow');
    const approveData = {
      action: 'approve',
      approvedAmount: advanceResult.data.requests[0].requestedAmount,
      remarks: 'Approved as requested'
    };
    await testEndpoint('POST', `/supervisor/approve-advance/${requestId}`, `POST /supervisor/approve-advance/${requestId}`, approveData);
  } else {
    log('\n4️⃣  ⚠️  Skipping Approve Advance - No pending requests', 'yellow');
  }

  // Test Get Pending Material Requests
  log('\n5️⃣  Testing Get Pending Material Requests...', 'yellow');
  const materialResult = await testEndpoint('GET', '/supervisor/pending-material-requests', 'GET /supervisor/pending-material-requests');

  // Test Approve Material Request (if there are pending requests)
  if (materialResult.success && materialResult.data?.requests?.length > 0) {
    const requestId = materialResult.data.requests[0].id;
    log('\n6️⃣  Testing Approve Material Request...', 'yellow');
    const approveData = {
      action: 'approve',
      approvedQuantity: materialResult.data.requests[0].quantity,
      pickupLocation: 'Main warehouse',
      remarks: 'Approved - available in stock'
    };
    await testEndpoint('POST', `/supervisor/approve-material/${requestId}`, `POST /supervisor/approve-material/${requestId}`, approveData);
  } else {
    log('\n6️⃣  ⚠️  Skipping Approve Material - No pending requests', 'yellow');
  }

  // Test Get Pending Tool Requests
  log('\n7️⃣  Testing Get Pending Tool Requests...', 'yellow');
  const toolResult = await testEndpoint('GET', '/supervisor/pending-tool-requests', 'GET /supervisor/pending-tool-requests');

  // Test Approve Tool Request (if there are pending requests)
  if (toolResult.success && toolResult.data?.requests?.length > 0) {
    const requestId = toolResult.data.requests[0].id;
    log('\n8️⃣  Testing Approve Tool Request...', 'yellow');
    const approveData = {
      action: 'approve',
      approvedQuantity: toolResult.data.requests[0].quantity,
      pickupLocation: 'Tool shed',
      remarks: 'Approved - tools available'
    };
    await testEndpoint('POST', `/supervisor/approve-tool/${requestId}`, `POST /supervisor/approve-tool/${requestId}`, approveData);
  } else {
    log('\n8️⃣  ⚠️  Skipping Approve Tool - No pending requests', 'yellow');
  }

  // Test Escalate Issue
  log('\n9️⃣  Testing Escalate Issue...', 'yellow');
  // Note: This requires an existing issue ID from daily progress
  const issueId = 1; // You may need to adjust this
  const escalateData = {
    escalationReason: 'Critical safety concern requiring immediate management attention',
    urgency: 'high',
    additionalNotes: 'Requires immediate action from management'
  };
  await testEndpoint('POST', `/supervisor/escalate-issue/${issueId}`, `POST /supervisor/escalate-issue/${issueId}`, escalateData);
}

// Main execution
async function main() {
  log('\n' + '='.repeat(70), 'cyan');
  log('🚀 COMPREHENSIVE API VERIFICATION TEST', 'cyan');
  log('='.repeat(70), 'cyan');
  log('Testing all previously "missing" APIs to verify implementation', 'cyan');
  log('='.repeat(70) + '\n', 'cyan');

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ Cannot proceed without authentication', 'red');
    process.exit(1);
  }

  // Test all API groups
  await testDailyProgressAPIs();
  await testRequestsApprovalsAPIs();

  // Summary
  log('\n' + '='.repeat(70), 'cyan');
  log('✅ API VERIFICATION COMPLETE', 'cyan');
  log('='.repeat(70), 'cyan');
  log('\n📝 Summary:', 'yellow');
  log('   - All Daily Progress APIs tested (manpower, issues, materials)', 'cyan');
  log('   - All Requests & Approvals APIs tested', 'cyan');
  log('   - Check the output above for individual API results', 'cyan');
  log('\n💡 Note: Some approval APIs may show warnings if no pending requests exist', 'yellow');
  log('   This is expected behavior and does not indicate an API issue.\n', 'yellow');
}

// Run the tests
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
