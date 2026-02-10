/**
 * Test Daily Progress Reports with proper date range
 */

import axios from 'axios';

const BASE_URL = 'http://192.168.0.3:5002/api';
const CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'password123'
};

async function testDailyProgressReports() {
  try {
    console.log('🔍 Testing Daily Progress Reports with Date Range...\n');

    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    const headers = { Authorization: `Bearer ${token}` };
    const projectId = 1002;

    // Step 2: Test Daily Progress Reports with date range
    console.log('2️⃣ Testing Daily Progress Reports with Date Range...');
    
    const fromDate = '2026-02-06';
    const toDate = '2026-02-10';
    
    try {
      const response = await axios.get(`${BASE_URL}/supervisor/daily-progress/${projectId}?from=${fromDate}&to=${toDate}`, { headers });
      console.log('✅ Daily Progress Reports (Date Range) API working!');
      console.log(`📊 Found ${response.data.data?.length || response.data.length || 0} reports`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('\n📋 Reports Summary:');
        response.data.data.forEach((report, index) => {
          console.log(`   ${index + 1}. ${new Date(report.date).toDateString()} - ${report.overallProgress}% (${report.approvalStatus})`);
        });
        
        // Show detailed info for first report
        const firstReport = response.data.data[0];
        console.log('\n📝 First Report Details:');
        console.log(`   Progress: ${firstReport.overallProgress}%`);
        console.log(`   Remarks: ${firstReport.remarks}`);
        console.log(`   Issues: ${firstReport.issues}`);
        console.log(`   Status: ${firstReport.approvalStatus}`);
        
        if (firstReport.manpowerUsage) {
          console.log(`   Workers: ${firstReport.manpowerUsage.activeWorkers}/${firstReport.manpowerUsage.totalWorkers} active`);
          console.log(`   Productivity: ${firstReport.manpowerUsage.productivity}%`);
        }
        
        if (firstReport.materialConsumption && firstReport.materialConsumption.length > 0) {
          console.log(`   Materials Used: ${firstReport.materialConsumption.length} items`);
          firstReport.materialConsumption.forEach(material => {
            console.log(`     - ${material.materialName}: ${material.consumed} ${material.unit} consumed`);
          });
        }
      }
    } catch (error) {
      console.log('❌ Daily Progress Reports (Date Range) API failed:');
      console.log(`Status: ${error.response?.status}`);
      console.log(`Error: ${error.response?.data?.message || error.message}`);
    }

    // Step 3: Test specific date report
    console.log('\n3️⃣ Testing Specific Date Report...');
    try {
      const response = await axios.get(`${BASE_URL}/supervisor/daily-progress/${projectId}/2026-02-10`, { headers });
      console.log('✅ Specific Date Report API working!');
      
      if (response.data.data) {
        const report = response.data.data;
        console.log(`📊 Report for Feb 10, 2026:`);
        console.log(`   Progress: ${report.overallProgress}%`);
        console.log(`   Status: ${report.approvalStatus}`);
        console.log(`   Submitted: ${new Date(report.submittedAt).toLocaleString()}`);
      }
    } catch (error) {
      console.log('❌ Specific Date Report API failed:');
      console.log(`Error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n✅ Daily Progress Reports testing completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDailyProgressReports();