/**
 * Test Task Metrics in API Response
 */

import axios from 'axios';

const BASE_URL = 'http://192.168.1.6:5002/api';
const CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'password123'
};

async function testTaskMetricsInAPI() {
  try {
    console.log('🔍 Testing Task Metrics in API Response...\n');

    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    const headers = { Authorization: `Bearer ${token}` };
    const projectId = 1002;

    // Step 2: Test Daily Progress Reports with Date Range
    console.log('2️⃣ Testing Daily Progress Reports (Date Range)...');
    try {
      const response = await axios.get(`${BASE_URL}/supervisor/daily-progress/${projectId}?from=2026-02-06&to=2026-02-10`, { headers });
      console.log('✅ Daily Progress Reports API working!');
      console.log(`📊 Found ${response.data.data?.length || response.data.count || 0} reports`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('\n📋 Detailed Report Analysis:');
        response.data.data.forEach((report, index) => {
          console.log(`\n  ${index + 1}. Report ID: ${report.id} - ${new Date(report.date).toDateString()}`);
          console.log(`     Progress: ${report.overallProgress}%`);
          console.log(`     Status: ${report.approvalStatus}`);
          
          // Check for task metrics
          if (report.taskMetrics) {
            console.log(`     ✅ Task Metrics Found:`);
            console.log(`       Total Tasks: ${report.taskMetrics.totalTasks}`);
            console.log(`       Completed: ${report.taskMetrics.completedTasks}`);
            console.log(`       In Progress: ${report.taskMetrics.inProgressTasks}`);
            console.log(`       Queued: ${report.taskMetrics.queuedTasks}`);
            console.log(`       Completion Rate: ${report.taskMetrics.completionRate}%`);
            if (report.taskMetrics.overdueTasks > 0) {
              console.log(`       Overdue: ${report.taskMetrics.overdueTasks}`);
            }
          } else {
            console.log(`     ❌ Task Metrics Missing`);
          }
          
          // Check manpower usage
          if (report.manpowerUsage) {
            console.log(`     👥 Manpower: ${report.manpowerUsage.activeWorkers}/${report.manpowerUsage.totalWorkers} workers`);
            console.log(`     📊 Productivity: ${report.manpowerUsage.productivity}%`);
            if (report.manpowerUsage.tasksPerWorker) {
              console.log(`     📋 Tasks per Worker: ${report.manpowerUsage.tasksPerWorker}`);
            }
          }
          
          // Check material consumption
          if (report.materialConsumption && report.materialConsumption.length > 0) {
            console.log(`     🧱 Materials Used: ${report.materialConsumption.length} items`);
            report.materialConsumption.slice(0, 2).forEach(material => {
              console.log(`       - ${material.materialName}: ${material.consumed} ${material.unit}`);
            });
          }
        });
      }
    } catch (error) {
      console.log('❌ Daily Progress Reports API failed:');
      console.log(`Status: ${error.response?.status}`);
      console.log(`Error: ${error.response?.data?.message || error.message}`);
    }

    // Step 3: Test Specific Date Report
    console.log('\n3️⃣ Testing Specific Date Report...');
    try {
      const response = await axios.get(`${BASE_URL}/supervisor/daily-progress/${projectId}/2026-02-10`, { headers });
      console.log('✅ Specific Date Report API working!');
      
      if (response.data.data) {
        const report = response.data.data;
        console.log(`\n📊 Report for Feb 10, 2026:`);
        console.log(`   Progress: ${report.overallProgress}%`);
        console.log(`   Status: ${report.approvalStatus}`);
        console.log(`   Submitted: ${new Date(report.submittedAt).toLocaleString()}`);
        
        if (report.taskMetrics) {
          console.log(`   ✅ Task Metrics:`);
          console.log(`     Total: ${report.taskMetrics.totalTasks}`);
          console.log(`     Completed: ${report.taskMetrics.completedTasks}`);
          console.log(`     In Progress: ${report.taskMetrics.inProgressTasks}`);
          console.log(`     Queued: ${report.taskMetrics.queuedTasks}`);
        } else {
          console.log(`   ❌ Task Metrics Missing`);
        }
      }
    } catch (error) {
      console.log('❌ Specific Date Report API failed:');
      console.log(`Error: ${error.response?.data?.message || error.message}`);
    }

    // Step 4: Test with different project
    console.log('\n4️⃣ Testing with different project...');
    try {
      const response = await axios.get(`${BASE_URL}/supervisor/daily-progress/1001?from=2026-02-06&to=2026-02-10`, { headers });
      console.log('✅ Different Project API working!');
      console.log(`📊 Found ${response.data.data?.length || 0} reports for project 1001`);
      
      if (response.data.data && response.data.data.length > 0) {
        const firstReport = response.data.data[0];
        console.log(`   Sample Report: ${firstReport.overallProgress}% progress`);
        console.log(`   Task Metrics: ${firstReport.taskMetrics ? 'Present' : 'Missing'}`);
        if (firstReport.taskMetrics) {
          console.log(`     Tasks: ${firstReport.taskMetrics.totalTasks} total, ${firstReport.taskMetrics.completedTasks} completed`);
        }
      }
    } catch (error) {
      console.log('❌ Different Project API failed:');
      console.log(`Error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n✅ Task Metrics API testing completed');
    
    console.log('\n📋 Summary:');
    console.log('   - If task metrics are showing as "Missing", the API controller needs to be updated');
    console.log('   - If task metrics are "Present", the fix is working correctly');
    console.log('   - Task counts should show actual numbers instead of 0');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTaskMetricsInAPI();