/**
 * Test Material Request Creation
 * Tests the POST /api/supervisor/request-materials endpoint
 */

import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.6:5002/api';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function testMaterialRequestCreation() {
  try {
    log('\n🔧 Testing Material Request Creation', 'cyan');
    log('='.repeat(60), 'cyan');

    // Step 1: Login as supervisor
    log('\n1️⃣ Logging in as supervisor...', 'yellow');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      log('❌ Login failed', 'red');
      return;
    }

    const token = loginResponse.data.token;
    log('✅ Login successful', 'green');
    log(`   Token: ${token.substring(0, 20)}...`, 'cyan');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // Step 2: Test with properly formatted date
    log('\n2️⃣ Creating material request with ISO date string...', 'yellow');
    
    const requestData = {
      projectId: 1003, // School Campus Renovation - supervisor's project
      requestType: 'MATERIAL',
      itemName: 'Test Material',
      itemCategory: 'concrete', // Valid enum value
      quantity: 10,
      unit: 'pieces',
      urgency: 'NORMAL',
      requiredDate: new Date().toISOString(), // ISO string format
      purpose: 'Testing material request creation',
      justification: 'Test justification',
      specifications: 'Test specifications',
      estimatedCost: 100
    };

    log('   Request data:', 'cyan');
    log(JSON.stringify(requestData, null, 2), 'cyan');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/supervisor/request-materials`,
        requestData,
        { headers }
      );

      if (response.data.success) {
        log('✅ Material request created successfully', 'green');
        log(`   Request ID: ${response.data.requestId}`, 'cyan');
        log(`   Status: ${response.data.status}`, 'cyan');
      } else {
        log('❌ Material request creation failed', 'red');
        log(`   Message: ${response.data.message}`, 'red');
      }
    } catch (error) {
      log('❌ Error creating material request', 'red');
      if (error.response) {
        log(`   Status: ${error.response.status}`, 'red');
        log(`   Message: ${error.response.data.message}`, 'red');
        log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
      } else {
        log(`   Error: ${error.message}`, 'red');
      }
    }

    // Step 3: Test with date string (YYYY-MM-DD format)
    log('\n3️⃣ Creating material request with YYYY-MM-DD date...', 'yellow');
    
    const requestData2 = {
      projectId: 1003, // School Campus Renovation - supervisor's project
      requestType: 'TOOL',
      itemName: 'Test Tool',
      itemCategory: 'power_tools', // Valid enum value
      quantity: 5,
      unit: 'pieces',
      urgency: 'HIGH',
      requiredDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      purpose: 'Testing tool request creation',
      justification: 'Test justification',
      specifications: 'Test specifications',
      estimatedCost: 200
    };

    log('   Request data:', 'cyan');
    log(JSON.stringify(requestData2, null, 2), 'cyan');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/supervisor/request-materials`,
        requestData2,
        { headers }
      );

      if (response.data.success) {
        log('✅ Tool request created successfully', 'green');
        log(`   Request ID: ${response.data.requestId}`, 'cyan');
        log(`   Status: ${response.data.status}`, 'cyan');
      } else {
        log('❌ Tool request creation failed', 'red');
        log(`   Message: ${response.data.message}`, 'red');
      }
    } catch (error) {
      log('❌ Error creating tool request', 'red');
      if (error.response) {
        log(`   Status: ${error.response.status}`, 'red');
        log(`   Message: ${error.response.data.message}`, 'red');
        log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
      } else {
        log(`   Error: ${error.message}`, 'red');
      }
    }

    log('\n✅ Test completed', 'green');
    log('='.repeat(60), 'cyan');

  } catch (error) {
    log('\n❌ Test failed', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

// Run the test
testMaterialRequestCreation();
