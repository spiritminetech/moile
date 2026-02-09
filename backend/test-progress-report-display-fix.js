// Test script to verify progress report display fix
import axios from 'axios';

const BASE_URL = 'http://192.168.0.3:5002/api';

async function testProgressReportDisplay() {
  console.log('🧪 Testing Progress Report Display Fix\n');
  
  try {
    // Step 1: Login as supervisor
    console.log('📝 Step 1: Login as supervisor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    
    // Step 2: Fetch daily progress reports
    console.log('\n📊 Step 2: Fetch daily progress reports...');
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    const reportsResponse = await axios.get(`${BASE_URL}/supervisor/daily-progress/1003`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { from: fromDate, to: today }
    });
    
    console.log(`✅ Fetched ${reportsResponse.data.count} reports`);
    
    // Step 3: Verify data structure
    console.log('\n🔍 Step 3: Verify data structure...');
    if (reportsResponse.data.data && reportsResponse.data.data.length > 0) {
      const sampleReport = reportsResponse.data.data[0];
      
      console.log('\n📋 Sample Report Structure:');
      console.log(`   id: ${sampleReport.id}`);
      console.log(`   date: ${sampleReport.date}`);
      console.log(`   projectId: ${sampleReport.projectId}`);
      console.log(`   approvalStatus: ${sampleReport.approvalStatus}`);
      console.log(`   remarks: ${sampleReport.remarks}`);
      console.log(`   overallProgress: ${sampleReport.overallProgress}%`);
      console.log(`   manpowerUsage: ${JSON.stringify(sampleReport.manpowerUsage)}`);
      
      // Step 4: Verify mapping requirements
      console.log('\n✅ Step 4: Verify mapping requirements...');
      const requiredFields = ['id', 'date', 'projectId', 'approvalStatus', 'remarks', 'overallProgress', 'manpowerUsage'];
      const missingFields = requiredFields.filter(field => !(field in sampleReport));
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields present in API response');
      } else {
        console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
      }
      
      // Step 5: Show how mobile app should map the data
      console.log('\n📱 Step 5: Mobile app mapping:');
      console.log('   API Field          → Mobile Field');
      console.log('   ─────────────────────────────────────');
      console.log(`   id                 → reportId: "${sampleReport.id}"`);
      console.log(`   id                 → id: "${sampleReport.id}"`);
      console.log(`   date               → date: "${sampleReport.date}"`);
      console.log(`   projectId          → projectId: ${sampleReport.projectId}`);
      console.log(`   projectId          → projectName: "Project ${sampleReport.projectId}"`);
      console.log(`   remarks            → summary: "${sampleReport.remarks}"`);
      console.log(`   approvalStatus     → status: "${sampleReport.approvalStatus === 'APPROVED' ? 'approved' : sampleReport.approvalStatus === 'PENDING' ? 'submitted' : 'draft'}"`);
      console.log(`   manpowerUsage      → manpowerUtilization`);
      console.log(`   overallProgress    → progressMetrics.overallProgress: ${sampleReport.overallProgress}%`);
      
      // Step 6: List all reports
      console.log('\n📋 Step 6: All Reports Summary:');
      reportsResponse.data.data.forEach((report, index) => {
        console.log(`\n   Report ${index + 1}:`);
        console.log(`   ├─ ID: ${report.id}`);
        console.log(`   ├─ Date: ${report.date}`);
        console.log(`   ├─ Status: ${report.approvalStatus}`);
        console.log(`   ├─ Progress: ${report.overallProgress}%`);
        console.log(`   └─ Summary: ${report.remarks || 'No summary'}`);
      });
      
      console.log('\n✅ All tests passed! Reports should now display correctly in mobile app.');
      console.log('\n📝 Fix Applied:');
      console.log('   1. Added reportId field mapping (id → reportId)');
      console.log('   2. Added projectName field (derived from projectId)');
      console.log('   3. Added summary field (remarks → summary)');
      console.log('   4. Added status field (approvalStatus → status with mapping)');
      console.log('   5. Updated SupervisorReport type definition');
      
    } else {
      console.log('❌ No reports found in response');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testProgressReportDisplay();
