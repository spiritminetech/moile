/**
 * Test Script for Supervisor Request Materials API
 * Tests the new POST /api/supervisor/request-materials endpoint
 */

import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.6:5002/api';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const printSection = (title) => {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
};

async function testSupervisorRequestMaterials() {
  let authToken = null;
  const results = {
    login: false,
    requestMaterial: false,
    requestTool: false,
    verifyRequest: false
  };

  try {
    // Step 1: Login as Supervisor
    printSection('🔐 STEP 1: LOGIN AS SUPERVISOR');
    
    const loginData = {
      email: 'supervisor4@example.com',
      password: 'password123'
    };

    log('Attempting login...', 'yellow');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    
    if (loginResponse.data.success && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      results.login = true;
      log('✅ Login successful!', 'green');
      console.log('Token:', authToken.substring(0, 20) + '...');
      console.log('User:', loginResponse.data.user.fullName);
      console.log('Role:', loginResponse.data.user.role);
    } else {
      throw new Error('Login failed - no token received');
    }

    // Step 2: Request Material
    printSection('📦 STEP 2: REQUEST MATERIAL');
    
    const materialRequestData = {
      projectId: 1,
      requestType: 'MATERIAL',
      itemName: 'Cement Bags (50kg)',
      itemCategory: 'concrete',
      quantity: 100,
      unit: 'bags',
      urgency: 'HIGH',
      requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      purpose: 'Foundation work for Building A',
      justification: 'Current stock running low, need for continuous construction',
      specifications: 'Portland Cement Grade 43, OPC',
      estimatedCost: 45000
    };

    log('Submitting material request...', 'yellow');
    console.log('Request Data:', JSON.stringify(materialRequestData, null, 2));

    const materialResponse = await axios.post(
      `${API_BASE_URL}/supervisor/request-materials`,
      materialRequestData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (materialResponse.data.success) {
      results.requestMaterial = true;
      log('✅ Material request submitted successfully!', 'green');
      console.log('Request ID:', materialResponse.data.requestId);
      console.log('Request Details:', JSON.stringify(materialResponse.data.request, null, 2));
    }

    // Step 3: Request Tool
    printSection('🔨 STEP 3: REQUEST TOOL');
    
    const toolRequestData = {
      projectId: 1,
      requestType: 'TOOL',
      itemName: 'Concrete Mixer (Electric)',
      itemCategory: 'power_tools',
      quantity: 2,
      unit: 'units',
      urgency: 'NORMAL',
      requiredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      purpose: 'Concrete mixing for foundation work',
      justification: 'Additional mixer needed to speed up construction',
      specifications: '1.5 HP, 200L capacity, electric motor',
      estimatedCost: 35000
    };

    log('Submitting tool request...', 'yellow');
    console.log('Request Data:', JSON.stringify(toolRequestData, null, 2));

    const toolResponse = await axios.post(
      `${API_BASE_URL}/supervisor/request-materials`,
      toolRequestData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (toolResponse.data.success) {
      results.requestTool = true;
      log('✅ Tool request submitted successfully!', 'green');
      console.log('Request ID:', toolResponse.data.requestId);
      console.log('Request Details:', JSON.stringify(toolResponse.data.request, null, 2));
    }

    // Step 4: Verify Requests in Pending List
    printSection('📋 STEP 4: VERIFY PENDING REQUESTS');
    
    log('Fetching pending material requests...', 'yellow');
    const pendingMaterialResponse = await axios.get(
      `${API_BASE_URL}/supervisor/pending-material-requests`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (pendingMaterialResponse.data.success) {
      results.verifyRequest = true;
      log('✅ Pending requests fetched successfully!', 'green');
      console.log('Total Pending Requests:', pendingMaterialResponse.data.count);
      
      if (pendingMaterialResponse.data.requests && pendingMaterialResponse.data.requests.length > 0) {
        console.log('\nRecent Requests:');
        pendingMaterialResponse.data.requests.slice(0, 5).forEach((req, index) => {
          console.log(`\n${index + 1}. ${req.itemName}`);
          console.log(`   Type: ${req.requestType}`);
          console.log(`   Quantity: ${req.quantity} ${req.unit}`);
          console.log(`   Urgency: ${req.urgency}`);
          console.log(`   Status: ${req.status}`);
          console.log(`   Requested By: ${req.employeeName}`);
        });
      }
    }

    // Step 5: Test Pending Tool Requests
    printSection('🔧 STEP 5: VERIFY PENDING TOOL REQUESTS');
    
    log('Fetching pending tool requests...', 'yellow');
    const pendingToolResponse = await axios.get(
      `${API_BASE_URL}/supervisor/pending-tool-requests`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (pendingToolResponse.data.success) {
      log('✅ Pending tool requests fetched successfully!', 'green');
      console.log('Total Pending Tool Requests:', pendingToolResponse.data.count);
      
      if (pendingToolResponse.data.requests && pendingToolResponse.data.requests.length > 0) {
        console.log('\nRecent Tool Requests:');
        pendingToolResponse.data.requests.slice(0, 5).forEach((req, index) => {
          console.log(`\n${index + 1}. ${req.itemName}`);
          console.log(`   Quantity: ${req.quantity} ${req.unit}`);
          console.log(`   Urgency: ${req.urgency}`);
          console.log(`   Status: ${req.status}`);
          console.log(`   Requested By: ${req.employeeName}`);
        });
      }
    }

  } catch (error) {
    log(`\n❌ Test execution failed: ${error.message}`, 'red');
    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  // Print Summary
  printSection('📊 TEST SUMMARY');
  
  console.log('\n📋 Test Results:');
  log(`   ${results.login ? '✅' : '❌'} Login as Supervisor`, results.login ? 'green' : 'red');
  log(`   ${results.requestMaterial ? '✅' : '❌'} POST /supervisor/request-materials (Material)`, results.requestMaterial ? 'green' : 'red');
  log(`   ${results.requestTool ? '✅' : '❌'} POST /supervisor/request-materials (Tool)`, results.requestTool ? 'green' : 'red');
  log(`   ${results.verifyRequest ? '✅' : '❌'} Verify Pending Requests`, results.verifyRequest ? 'green' : 'red');

  const passedTests = Object.values(results).filter(r => r).length;
  const totalTests = Object.keys(results).length;

  console.log('\n' + '='.repeat(60));
  if (passedTests === totalTests) {
    log(`✅ ALL TESTS PASSED (${passedTests}/${totalTests})`, 'green');
  } else {
    log(`⚠️  SOME TESTS FAILED (${passedTests}/${totalTests})`, 'yellow');
  }
  console.log('='.repeat(60));

  console.log('\n📝 NEW API ENDPOINT IMPLEMENTED:');
  console.log('='.repeat(60));
  log('✅ POST /api/supervisor/request-materials', 'green');
  console.log('\n📦 Request Body:');
  console.log('   - projectId (required): number');
  console.log('   - requestType (required): "MATERIAL" | "TOOL"');
  console.log('   - itemName (required): string');
  console.log('   - quantity (required): number');
  console.log('   - requiredDate (required): Date');
  console.log('   - purpose (required): string');
  console.log('   - itemCategory (optional): string');
  console.log('   - unit (optional): string (default: "pieces")');
  console.log('   - urgency (optional): "LOW" | "NORMAL" | "HIGH" | "URGENT"');
  console.log('   - justification (optional): string');
  console.log('   - specifications (optional): string');
  console.log('   - estimatedCost (optional): number');
  console.log('='.repeat(60));
}

// Run the test
testSupervisorRequestMaterials();
