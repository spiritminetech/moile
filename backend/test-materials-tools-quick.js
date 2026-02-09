import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.8:5002/api';
const EMAIL = 'supervisor@gmail.com';
const PASSWORD = 'Password123';

async function testAPIs() {
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD
    });
    
    if (!loginRes.data.token) {
      console.log('❌ Login failed');
      return;
    }
    
    const token = loginRes.data.token;
    console.log('✅ Login successful\n');
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test 1: GET /supervisor/tool-usage-log
    console.log('1. Testing GET /supervisor/tool-usage-log');
    try {
      const res = await axios.get(`${API_BASE_URL}/supervisor/tool-usage-log?projectId=1`, { headers });
      console.log(`✅ GET /supervisor/tool-usage-log - ${res.data.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   Tools found: ${res.data.count || 0}\n`);
    } catch (err) {
      console.log(`❌ GET /supervisor/tool-usage-log - ${err.response?.data?.message || err.message}\n`);
    }
    
    // Test 2: POST /supervisor/log-tool-usage
    console.log('2. Testing POST /supervisor/log-tool-usage');
    try {
      const res = await axios.post(`${API_BASE_URL}/supervisor/log-tool-usage`, {
        toolId: 1,
        action: 'check_out',
        employeeId: 101,
        quantity: 1,
        location: 'Test Site',
        notes: 'Test checkout'
      }, { headers });
      console.log(`✅ POST /supervisor/log-tool-usage - ${res.data.success ? 'SUCCESS' : 'FAILED'}\n`);
    } catch (err) {
      console.log(`❌ POST /supervisor/log-tool-usage - ${err.response?.data?.message || err.message}\n`);
    }
    
    // Test 3: POST /supervisor/acknowledge-delivery/:deliveryId
    console.log('3. Testing POST /supervisor/acknowledge-delivery/:deliveryId');
    try {
      const res = await axios.post(`${API_BASE_URL}/supervisor/acknowledge-delivery/1`, {
        deliveredQuantity: 50,
        deliveryCondition: 'good',
        receivedBy: 'Test Supervisor',
        deliveryNotes: 'Test delivery'
      }, { headers });
      console.log(`✅ POST /supervisor/acknowledge-delivery - ${res.data.success ? 'SUCCESS' : 'FAILED'}\n`);
    } catch (err) {
      console.log(`❌ POST /supervisor/acknowledge-delivery - ${err.response?.data?.message || err.message}\n`);
    }
    
    // Test 4: POST /supervisor/return-materials
    console.log('4. Testing POST /supervisor/return-materials');
    try {
      const res = await axios.post(`${API_BASE_URL}/supervisor/return-materials`, {
        requestId: 1,
        returnQuantity: 10,
        returnReason: 'Excess materials',
        returnCondition: 'unused',
        returnNotes: 'Test return'
      }, { headers });
      console.log(`✅ POST /supervisor/return-materials - ${res.data.success ? 'SUCCESS' : 'FAILED'}\n`);
    } catch (err) {
      console.log(`❌ POST /supervisor/return-materials - ${err.response?.data?.message || err.message}\n`);
    }
    
    // Test 5: POST /supervisor/request-materials
    console.log('5. Testing POST /supervisor/request-materials');
    try {
      const res = await axios.post(`${API_BASE_URL}/supervisor/request-materials`, {
        projectId: 1,
        requestType: 'MATERIAL',
        itemName: 'Test Material',
        quantity: 100,
        unit: 'kg',
        urgency: 'medium',
        requiredDate: new Date().toISOString(),
        purpose: 'Testing'
      }, { headers });
      console.log(`✅ POST /supervisor/request-materials - ${res.data.success ? 'SUCCESS' : 'FAILED'}\n`);
    } catch (err) {
      console.log(`❌ POST /supervisor/request-materials - ${err.response?.data?.message || err.message}\n`);
    }
    
    console.log('═══════════════════════════════════════');
    console.log('SUMMARY:');
    console.log('Check results above for each endpoint');
    console.log('═══════════════════════════════════════');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPIs();
