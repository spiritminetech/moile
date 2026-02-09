// Test Materials & Tools API Integration
// This script tests all Materials & Tools endpoints to verify they work correctly

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let supervisorId = 4; // Supervisor Gmail
let projectId = 1;
let testRequestId = null;
let testAllocationId = null;

// Helper function to make authenticated requests
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} failed:`, error.response?.data || error.message);
    throw error;
  }
};

// Test 1: Login as supervisor
async function testLogin() {
  console.log('\n📝 Test 1: Login as Supervisor');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });
    
    authToken = response.data.token;
    supervisorId = response.data.user.id;
    
    console.log('✅ Login successful');
    console.log(`   Supervisor ID: ${supervisorId}`);
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Request Materials
async function testRequestMaterials() {
  console.log('\n📝 Test 2: Request Materials');
  console.log('='.repeat(50));
  
  try {
    const requestData = {
      projectId: projectId,
      requesterId: supervisorId,
      itemName: 'Test Cement Bags',
      category: 'Construction Materials',
      quantity: 100,
      unit: 'bags',
      urgency: 'high',
      requiredDate: new Date('2026-02-15'),
      purpose: 'Foundation work for Phase 2',
      justification: 'Required for upcoming construction phase',
      estimatedCost: 5000
    };
    
    const response = await apiCall('POST', '/supervisor/request-materials', requestData);
    
    testRequestId = response.data?.requestId || response.requestId;
    
    console.log('✅ Material request created successfully');
    console.log(`   Request ID: ${testRequestId}`);
    console.log(`   Item: ${requestData.itemName}`);
    console.log(`   Quantity: ${requestData.quantity} ${requestData.unit}`);
    console.log(`   Status: ${response.data?.status || response.status || 'pending'}`);
    return true;
  } catch (error) {
    console.error('❌ Request materials failed');
    return false;
  }
}

// Test 3: Get Materials and Tools
async function testGetMaterialsAndTools() {
  console.log('\n📝 Test 3: Get Materials and Tools');
  console.log('='.repeat(50));
  
  try {
    const response = await apiCall('GET', `/supervisor/materials-tools?projectId=${projectId}`);
    
    const materialRequests = response.data?.materialRequests || response.materialRequests || [];
    const toolAllocations = response.data?.toolAllocations || response.toolAllocations || [];
    
    console.log('✅ Materials and tools retrieved successfully');
    console.log(`   Material Requests: ${materialRequests.length}`);
    console.log(`   Tool Allocations: ${toolAllocations.length}`);
    
    if (materialRequests.length > 0) {
      console.log('\n   Recent Material Requests:');
      materialRequests.slice(0, 3).forEach(req => {
        console.log(`   - ${req.itemName} (${req.quantity} ${req.unit}) - Status: ${req.status}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Get materials and tools failed');
    return false;
  }
}

// Test 4: Acknowledge Delivery
async function testAcknowledgeDelivery() {
  console.log('\n📝 Test 4: Acknowledge Delivery');
  console.log('='.repeat(50));
  
  if (!testRequestId) {
    console.log('⚠️  Skipping - no test request ID available');
    return true;
  }
  
  try {
    const deliveryData = {
      deliveredQuantity: 95,
      deliveryCondition: 'partial',
      receivedBy: 'Test Supervisor',
      deliveryNotes: 'Received 95 bags, 5 bags were damaged during transport',
      deliveryPhotos: []
    };
    
    const response = await apiCall('POST', `/supervisor/acknowledge-delivery/${testRequestId}`, deliveryData);
    
    console.log('✅ Delivery acknowledged successfully');
    console.log(`   Request ID: ${testRequestId}`);
    console.log(`   Delivered: ${deliveryData.deliveredQuantity} units`);
    console.log(`   Condition: ${deliveryData.deliveryCondition}`);
    console.log(`   Received by: ${deliveryData.receivedBy}`);
    return true;
  } catch (error) {
    console.error('❌ Acknowledge delivery failed');
    return false;
  }
}

// Test 5: Return Materials
async function testReturnMaterials() {
  console.log('\n📝 Test 5: Return Materials');
  console.log('='.repeat(50));
  
  if (!testRequestId) {
    console.log('⚠️  Skipping - no test request ID available');
    return true;
  }
  
  try {
    const returnData = {
      requestId: testRequestId,
      returnQuantity: 10,
      returnReason: 'excess',
      returnCondition: 'unused',
      returnNotes: 'Excess materials after project completion',
      returnPhotos: []
    };
    
    const response = await apiCall('POST', '/supervisor/return-materials', returnData);
    
    console.log('✅ Materials returned successfully');
    console.log(`   Request ID: ${testRequestId}`);
    console.log(`   Returned: ${returnData.returnQuantity} units`);
    console.log(`   Reason: ${returnData.returnReason}`);
    console.log(`   Condition: ${returnData.returnCondition}`);
    return true;
  } catch (error) {
    console.error('❌ Return materials failed');
    return false;
  }
}

// Test 6: Allocate Tool
async function testAllocateTool() {
  console.log('\n📝 Test 6: Allocate Tool');
  console.log('='.repeat(50));
  
  try {
    const allocationData = {
      toolId: 1,
      toolName: 'Test Power Drill',
      allocatedTo: 107,
      allocatedToName: 'Test Worker',
      allocationDate: new Date(),
      expectedReturnDate: new Date('2026-02-15'),
      condition: 'good',
      location: 'Site A - Zone 1'
    };
    
    const response = await apiCall('POST', '/supervisor/allocate-tool', allocationData);
    
    testAllocationId = response.data?.allocationId || response.allocationId;
    
    console.log('✅ Tool allocated successfully');
    console.log(`   Allocation ID: ${testAllocationId}`);
    console.log(`   Tool: ${allocationData.toolName}`);
    console.log(`   Allocated to: ${allocationData.allocatedToName}`);
    console.log(`   Expected return: ${allocationData.expectedReturnDate.toLocaleDateString()}`);
    return true;
  } catch (error) {
    console.error('❌ Allocate tool failed');
    return false;
  }
}

// Test 7: Get Tool Usage Log
async function testGetToolUsageLog() {
  console.log('\n📝 Test 7: Get Tool Usage Log');
  console.log('='.repeat(50));
  
  try {
    const response = await apiCall('GET', `/supervisor/tool-usage-log?projectId=${projectId}`);
    
    const tools = response.data?.tools || response.tools || [];
    
    console.log('✅ Tool usage log retrieved successfully');
    console.log(`   Total tools tracked: ${tools.length}`);
    
    if (tools.length > 0) {
      console.log('\n   Tool Details:');
      tools.slice(0, 3).forEach(tool => {
        console.log(`   - ${tool.toolName} (${tool.category})`);
        console.log(`     Status: ${tool.status}, Condition: ${tool.condition}`);
        console.log(`     Location: ${tool.location}`);
        if (tool.allocationHistory && tool.allocationHistory.length > 0) {
          console.log(`     Allocations: ${tool.allocationHistory.length}`);
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Get tool usage log failed');
    return false;
  }
}

// Test 8: Log Tool Usage
async function testLogToolUsage() {
  console.log('\n📝 Test 8: Log Tool Usage');
  console.log('='.repeat(50));
  
  try {
    const usageData = {
      toolId: 1,
      action: 'check_out',
      employeeId: 107,
      quantity: 1,
      condition: 'good',
      location: 'Site A - Zone 1',
      notes: 'Checked out for foundation work'
    };
    
    const response = await apiCall('POST', '/supervisor/log-tool-usage', usageData);
    
    console.log('✅ Tool usage logged successfully');
    console.log(`   Action: ${usageData.action}`);
    console.log(`   Tool ID: ${usageData.toolId}`);
    console.log(`   Employee ID: ${usageData.employeeId}`);
    console.log(`   Condition: ${usageData.condition}`);
    return true;
  } catch (error) {
    console.error('❌ Log tool usage failed');
    return false;
  }
}

// Test 9: Return Tool
async function testReturnTool() {
  console.log('\n📝 Test 9: Return Tool');
  console.log('='.repeat(50));
  
  if (!testAllocationId) {
    console.log('⚠️  Skipping - no test allocation ID available');
    return true;
  }
  
  try {
    const returnData = {
      condition: 'good',
      notes: 'Tool returned in good condition after use'
    };
    
    const response = await apiCall('POST', `/supervisor/return-tool/${testAllocationId}`, returnData);
    
    console.log('✅ Tool returned successfully');
    console.log(`   Allocation ID: ${testAllocationId}`);
    console.log(`   Condition: ${returnData.condition}`);
    console.log(`   Notes: ${returnData.notes}`);
    return true;
  } catch (error) {
    console.error('❌ Return tool failed');
    return false;
  }
}

// Test 10: Get Material Inventory
async function testGetMaterialInventory() {
  console.log('\n📝 Test 10: Get Material Inventory');
  console.log('='.repeat(50));
  
  try {
    const response = await apiCall('GET', `/supervisor/materials/inventory?projectId=${projectId}`);
    
    const inventory = response.data?.inventory || response.inventory || [];
    const alerts = response.data?.alerts || response.alerts || [];
    
    console.log('✅ Material inventory retrieved successfully');
    console.log(`   Inventory items: ${inventory.length}`);
    console.log(`   Alerts: ${alerts.length}`);
    
    if (inventory.length > 0) {
      console.log('\n   Inventory Status:');
      inventory.slice(0, 3).forEach(item => {
        console.log(`   - ${item.name} (${item.category})`);
        console.log(`     Available: ${item.available} ${item.unit}`);
        console.log(`     Status: ${item.status}${item.isLowStock ? ' ⚠️ LOW STOCK' : ''}`);
      });
    }
    
    if (alerts.length > 0) {
      console.log('\n   Active Alerts:');
      alerts.forEach(alert => {
        console.log(`   ⚠️  ${alert.message}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Get material inventory failed');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 MATERIALS & TOOLS API INTEGRATION TEST SUITE');
  console.log('='.repeat(70));
  console.log(`Testing against: ${API_BASE_URL}`);
  console.log(`Date: ${new Date().toLocaleString()}`);
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Request Materials', fn: testRequestMaterials },
    { name: 'Get Materials and Tools', fn: testGetMaterialsAndTools },
    { name: 'Acknowledge Delivery', fn: testAcknowledgeDelivery },
    { name: 'Return Materials', fn: testReturnMaterials },
    { name: 'Allocate Tool', fn: testAllocateTool },
    { name: 'Get Tool Usage Log', fn: testGetToolUsageLog },
    { name: 'Log Tool Usage', fn: testLogToolUsage },
    { name: 'Return Tool', fn: testReturnTool },
    { name: 'Get Material Inventory', fn: testGetMaterialInventory }
  ];
  
  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Materials & Tools integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  console.log('\n✨ Test suite completed\n');
}

// Run the tests
runAllTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});
