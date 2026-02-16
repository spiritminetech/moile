import axios from 'axios';

/**
 * Test script for Supervisor Materials & Tools APIs
 * Tests: Acknowledge Delivery, Return Materials, Tool Usage Log
 */

const API_BASE_URL = 'http://192.168.1.6:5002/api';

// Test configuration
const TEST_CONFIG = {
  supervisorEmail: 'supervisor4@example.com',
  supervisorPassword: 'password123',
  projectId: 1,
  testEmployeeId: 101
};

let authToken = '';

/* ===============================
   HELPER FUNCTIONS
================================ */

async function loginSupervisor() {
  try {
    console.log('\n🔐 Logging in as supervisor...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_CONFIG.supervisorEmail,
      password: TEST_CONFIG.supervisorPassword
    });

    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.error('❌ Login failed: No token received');
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
}

/* ===============================
   TEST 1: ACKNOWLEDGE DELIVERY
================================ */
async function testAcknowledgeDelivery() {
  try {
    console.log('\n📦 TEST 1: Acknowledge Delivery');
    console.log('=' .repeat(60));

    // First, get pending material requests to find one to acknowledge
    console.log('\n1️⃣  Getting approved material requests...');
    const pendingResponse = await axios.get(
      `${API_BASE_URL}/supervisor/pending-material-requests`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (pendingResponse.data.requests && pendingResponse.data.requests.length > 0) {
      console.log(`   Found ${pendingResponse.data.requests.length} pending requests`);
      
      // Find an approved request (you may need to approve one first)
      // For testing, we'll use the first pending request ID
      const testRequestId = pendingResponse.data.requests[0].id;
      console.log(`   Using request ID: ${testRequestId}`);

      // Acknowledge delivery
      console.log('\n2️⃣  Acknowledging delivery...');
      const deliveryData = {
        deliveredQuantity: 50,
        deliveryCondition: 'good',
        receivedBy: 'Site Supervisor',
        deliveryNotes: 'All items received in good condition'
      };

      const response = await axios.post(
        `${API_BASE_URL}/supervisor/acknowledge-delivery/${testRequestId}`,
        deliveryData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.data.success) {
        console.log('✅ Delivery acknowledged successfully');
        console.log('   Response:', JSON.stringify(response.data, null, 2));
        return true;
      } else {
        console.log('⚠️  Delivery acknowledgment response:', response.data.message);
        return false;
      }
    } else {
      console.log('⚠️  No pending material requests found');
      console.log('   Note: You need to have approved material requests to test delivery acknowledgment');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/* ===============================
   TEST 2: RETURN MATERIALS
================================ */
async function testReturnMaterials() {
  try {
    console.log('\n🔄 TEST 2: Return Materials');
    console.log('=' .repeat(60));

    // Get fulfilled requests to find one to return
    console.log('\n1️⃣  Finding fulfilled material requests...');
    
    const returnData = {
      requestId: 1, // You'll need to use an actual fulfilled request ID
      returnQuantity: 10,
      returnReason: 'Excess materials not needed',
      returnCondition: 'unused',
      returnNotes: 'Materials in original packaging'
    };

    console.log('\n2️⃣  Processing material return...');
    console.log('   Return data:', JSON.stringify(returnData, null, 2));

    const response = await axios.post(
      `${API_BASE_URL}/supervisor/return-materials`,
      returnData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.data.success) {
      console.log('✅ Material return processed successfully');
      console.log('   Response:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.log('⚠️  Material return response:', response.data.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/* ===============================
   TEST 3: GET TOOL USAGE LOG
================================ */
async function testGetToolUsageLog() {
  try {
    console.log('\n🔧 TEST 3: Get Tool Usage Log');
    console.log('=' .repeat(60));

    console.log('\n1️⃣  Getting tool usage log for project...');
    const response = await axios.get(
      `${API_BASE_URL}/supervisor/tool-usage-log`,
      { 
        headers: { Authorization: `Bearer ${authToken}` },
        params: { projectId: TEST_CONFIG.projectId }
      }
    );

    if (response.data.success) {
      console.log('✅ Tool usage log retrieved successfully');
      console.log(`   Total tools: ${response.data.count}`);
      
      if (response.data.tools && response.data.tools.length > 0) {
        console.log('\n   Tool Details:');
        response.data.tools.forEach((tool, index) => {
          console.log(`\n   Tool ${index + 1}:`);
          console.log(`   - Name: ${tool.toolName}`);
          console.log(`   - Category: ${tool.category}`);
          console.log(`   - Quantity: ${tool.totalQuantity}`);
          console.log(`   - Status: ${tool.status}`);
          console.log(`   - Condition: ${tool.condition}`);
          console.log(`   - Allocation History: ${tool.allocationHistory.length} records`);
        });
      } else {
        console.log('   No tools found for this project');
      }
      return true;
    } else {
      console.log('⚠️  Tool usage log response:', response.data.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/* ===============================
   TEST 4: LOG TOOL USAGE (Check-out)
================================ */
async function testLogToolCheckOut() {
  try {
    console.log('\n📤 TEST 4: Log Tool Check-Out');
    console.log('=' .repeat(60));

    const checkOutData = {
      toolId: 1, // You'll need to use an actual tool ID
      action: 'check_out',
      employeeId: TEST_CONFIG.testEmployeeId,
      quantity: 1,
      location: 'Construction Site - Zone A',
      notes: 'Tool checked out for concrete work'
    };

    console.log('\n1️⃣  Checking out tool...');
    console.log('   Check-out data:', JSON.stringify(checkOutData, null, 2));

    const response = await axios.post(
      `${API_BASE_URL}/supervisor/log-tool-usage`,
      checkOutData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.data.success) {
      console.log('✅ Tool checked out successfully');
      console.log('   Response:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.log('⚠️  Tool check-out response:', response.data.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/* ===============================
   TEST 5: LOG TOOL USAGE (Check-in)
================================ */
async function testLogToolCheckIn() {
  try {
    console.log('\n📥 TEST 5: Log Tool Check-In');
    console.log('=' .repeat(60));

    const checkInData = {
      toolId: 1, // Same tool ID as check-out
      action: 'check_in',
      employeeId: TEST_CONFIG.testEmployeeId,
      quantity: 1,
      condition: 'good',
      location: 'Tool Storage Area',
      notes: 'Tool returned in good condition'
    };

    console.log('\n1️⃣  Checking in tool...');
    console.log('   Check-in data:', JSON.stringify(checkInData, null, 2));

    const response = await axios.post(
      `${API_BASE_URL}/supervisor/log-tool-usage`,
      checkInData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.data.success) {
      console.log('✅ Tool checked in successfully');
      console.log('   Response:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.log('⚠️  Tool check-in response:', response.data.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/* ===============================
   TEST 6: GET MATERIAL RETURNS HISTORY
================================ */
async function testGetMaterialReturns() {
  try {
    console.log('\n📋 TEST 6: Get Material Returns History');
    console.log('=' .repeat(60));

    console.log('\n1️⃣  Getting material returns history...');
    const response = await axios.get(
      `${API_BASE_URL}/supervisor/material-returns`,
      { 
        headers: { Authorization: `Bearer ${authToken}` },
        params: { projectId: TEST_CONFIG.projectId }
      }
    );

    if (response.data.success) {
      console.log('✅ Material returns history retrieved successfully');
      console.log(`   Total returns: ${response.data.count}`);
      
      if (response.data.returns && response.data.returns.length > 0) {
        console.log('\n   Return Details:');
        response.data.returns.forEach((ret, index) => {
          console.log(`\n   Return ${index + 1}:`);
          console.log(`   - Request ID: ${ret.requestId}`);
          console.log(`   - Item: ${ret.itemName}`);
          console.log(`   - Type: ${ret.requestType}`);
          console.log(`   - Original Quantity: ${ret.originalQuantity} ${ret.unit}`);
          console.log(`   - Employee: ${ret.employeeName}`);
          console.log(`   - Project: ${ret.projectName}`);
          console.log(`   - Return Info: ${ret.returnInfo}`);
        });
      } else {
        console.log('   No material returns found');
      }
      return true;
    } else {
      console.log('⚠️  Material returns response:', response.data.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/* ===============================
   MAIN TEST RUNNER
================================ */
async function runAllTests() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('🧪 SUPERVISOR MATERIALS & TOOLS API TESTS');
  console.log('═'.repeat(60));

  // Login first
  const loginSuccess = await loginSupervisor();
  if (!loginSuccess) {
    console.error('\n❌ Cannot proceed without authentication');
    return;
  }

  // Run all tests
  const tests = [
    { name: 'Acknowledge Delivery', fn: testAcknowledgeDelivery },
    { name: 'Return Materials', fn: testReturnMaterials },
    { name: 'Get Tool Usage Log', fn: testGetToolUsageLog },
    { name: 'Log Tool Check-Out', fn: testLogToolCheckOut },
    { name: 'Log Tool Check-In', fn: testLogToolCheckIn },
    { name: 'Get Material Returns History', fn: testGetMaterialReturns }
  ];

  const results = [];
  for (const test of tests) {
    const result = await test.fn();
    results.push({ name: test.name, passed: result });
  }

  // Print summary
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);
  });

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log('\n' + '═'.repeat(60));
  console.log(`Total: ${passedCount}/${totalCount} tests passed`);
  console.log('═'.repeat(60));

  // API Endpoints Summary
  console.log('\n📝 NEW API ENDPOINTS IMPLEMENTED:');
  console.log('=' .repeat(60));
  console.log('✅ POST /api/supervisor/acknowledge-delivery/:requestId');
  console.log('✅ POST /api/supervisor/return-materials');
  console.log('✅ GET  /api/supervisor/tool-usage-log');
  console.log('✅ POST /api/supervisor/log-tool-usage');
  console.log('✅ GET  /api/supervisor/material-returns');
  console.log('=' .repeat(60));
}

// Run tests
runAllTests().catch(console.error);
