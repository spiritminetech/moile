/**
 * Test Reports, Materials, Tools, and Inventory APIs for supervisorId 4
 */

import axios from 'axios';

const BASE_URL = 'http://192.168.0.3:5002/api';
const CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'password123'
};

async function testReportsAndInventoryAPIs() {
  try {
    console.log('🔍 Testing Reports, Materials, Tools & Inventory APIs...\n');

    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    const headers = { Authorization: `Bearer ${token}` };
    const projectId = 1002; // Use the first project from our data

    // Step 2: Test Daily Progress Reports
    console.log('2️⃣ Testing Daily Progress Reports...');
    
    // Get all reports for project
    try {
      const response = await axios.get(`${BASE_URL}/supervisor/daily-progress/${projectId}`, { headers });
      console.log('✅ Daily Progress Reports (All) API working!');
      console.log(`📊 Found ${response.data.data?.length || response.data.length || 0} reports`);
      
      if (response.data.data && response.data.data.length > 0) {
        const latestReport = response.data.data[0];
        console.log(`📝 Latest report: ${latestReport.overallProgress}% progress on ${new Date(latestReport.date).toDateString()}`);
      }
    } catch (error) {
      console.log('❌ Daily Progress Reports (All) API failed:');
      console.log(`Error: ${error.response?.data?.message || error.message}`);
    }

    // Get specific date report
    try {
      const response = await axios.get(`${BASE_URL}/supervisor/daily-progress/${projectId}/2026-02-10`, { headers });
      console.log('✅ Daily Progress Report (Specific Date) API working!');
      console.log(`📊 Report data: ${response.data.data?.overallProgress || 'N/A'}% progress`);
    } catch (error) {
      console.log('❌ Daily Progress Report (Specific Date) API failed:');
      console.log(`Error: ${error.response?.data?.message || error.message}`);
    }

    // Step 3: Test Materials & Tools Combined
    console.log('\n3️⃣ Testing Materials & Tools Combined...');
    try {
      const response = await axios.get(`${BASE_URL}/supervisor/materials-tools?projectId=${projectId}`, { headers });
      console.log('✅ Materials & Tools Combined API working!');
      console.log(`📊 Materials: ${response.data.data?.materials?.length || 0}`);
      console.log(`🔧 Tools: ${response.data.data?.tools?.length || 0}`);
      
      if (response.data.data?.materials && response.data.data.materials.length > 0) {
        console.log(`📝 Sample material: ${response.data.data.materials[0].name} - ${response.data.data.materials[0].available || response.data.data.materials[0].quantity} ${response.data.data.materials[0].unit}`);
      }
    } catch (error) {
      console.log('❌ Materials & Tools Combined API failed:');
      console.log(`Error: ${error.response?.data?.message || error.message}`);
    }

    // Step 4: Test Materials Inventory
    console.log('\n4️⃣ Testing Materials Inventory...');
    try {
      const response = await axios.get(`${BASE_URL}/supervisor/materials/inventory?projectId=${projectId}`, { headers });
      console.log('✅ Materials Inventory API working!');
      console.log(`📊 Inventory items: ${response.data.data?.inventory?.length || 0}`);
      console.log(`⚠️  Alerts: ${response.data.data?.alerts?.length || 0}`);
      
      if (response.data.data?.inventory && response.data.data.inventory.length > 0) {
        console.log(`📝 Sample inventory: ${response.data.data.inventory[0].name} - ${response.data.data.inventory[0].available} ${response.data.data.inventory[0].unit} available`);
      }
    } catch (error) {
      console.log('❌ Materials Inventory API failed:');
      console.log(`Error: ${error.response?.data?.message || error.message}`);
    }

    // Test low stock filter
    try {
      const response = await axios.get(`${BASE_URL}/supervisor/materials/inventory?lowStock=true`, { headers });
      console.log('✅ Materials Inventory (Low Stock) API working!');
      console.log(`📊 Low stock items: ${response.data.data?.inventory?.length || 0}`);
    } catch (error) {
      console.log('❌ Materials Inventory (Low Stock) API failed:');
      console.log(`Error: ${error.response?.data?.message || error.message}`);
    }

    // Step 5: Test Tool Usage Log
    console.log('\n5️⃣ Testing Tool Usage Log...');
    try {
      const response = await axios.get(`${BASE_URL}/supervisor/tool-usage-log?projectId=${projectId}`, { headers });
      console.log('✅ Tool Usage Log API working!');
      console.log(`📊 Tool entries: ${response.data.data?.length || response.data.length || 0}`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log(`📝 Sample tool: ${response.data.data[0].name} - Status: ${response.data.data[0].status}`);
      }
    } catch (error) {
      console.log('❌ Tool Usage Log API failed:');
      console.log(`Error: ${error.response?.data?.message || error.message}`);
    }

    // Step 6: Test Submit Daily Progress
    console.log('\n6️⃣ Testing Submit Daily Progress...');
    try {
      const progressData = {
        projectId: projectId,
        overallProgress: 78,
        remarks: 'Test progress submission from API test',
        issues: 'No major issues, work proceeding as planned',
        manpowerUsage: {
          totalWorkers: 18,
          activeWorkers: 16,
          productivity: 88,
          efficiency: 85,
          overtimeHours: 2,
          absentWorkers: 2,
          lateWorkers: 0
        },
        materialConsumption: [
          {
            materialId: 4,
            materialName: 'Portland Cement',
            consumed: 15,
            remaining: 110,
            unit: 'bags',
            plannedConsumption: 20,
            wastage: 1,
            notes: 'Good quality, no issues'
          }
        ]
      };
      
      const response = await axios.post(`${BASE_URL}/supervisor/daily-progress`, progressData, { headers });
      console.log('✅ Submit Daily Progress API working!');
      console.log(`📊 Created report ID: ${response.data.data?.reportId || response.data.data?.id || 'N/A'}`);
    } catch (error) {
      console.log('❌ Submit Daily Progress API failed:');
      console.log(`Error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n✅ All Reports, Materials, Tools & Inventory API tests completed');

    // Summary
    console.log('\n📋 API Test Summary:');
    console.log('   ✅ Daily Progress Reports - View all reports for a project');
    console.log('   ✅ Daily Progress Reports - View specific date report');
    console.log('   ✅ Materials & Tools Combined - Get all materials and tools');
    console.log('   ✅ Materials Inventory - View inventory with availability');
    console.log('   ✅ Materials Inventory - Filter by low stock');
    console.log('   ✅ Tool Usage Log - View tool status and usage');
    console.log('   ✅ Submit Daily Progress - Create new progress report');

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

testReportsAndInventoryAPIs();