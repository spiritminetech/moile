import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test credentials - update with your actual test supervisor
const TEST_SUPERVISOR = {
  email: 'supervisor4@example.com',
  password: 'password123'
};

let authToken = '';
let testEmployeeId = 107;
let testProjectId = 1;

async function login() {
  try {
    console.log('🔐 Logging in as supervisor...');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_SUPERVISOR);
    
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      return true;
    }
    console.log('❌ Login failed:', response.data.message);
    return false;
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return false;
  }
}

async function testMarkAbsenceReason() {
  try {
    console.log('\n📝 Testing Mark Absence Reason...');
    
    const response = await axios.post(
      `${BASE_URL}/supervisor/mark-absence-reason`,
      {
        employeeId: testEmployeeId,
        projectId: testProjectId,
        date: new Date().toISOString().split('T')[0],
        reason: 'LEAVE_APPROVED',
        notes: 'Medical appointment approved by HR'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✅ Absence reason marked successfully');
    console.log('   Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Mark absence error:', error.response?.data || error.message);
    return false;
  }
}

async function testCreateEscalation() {
  try {
    console.log('\n🚨 Testing Create Escalation...');
    
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await axios.post(
      `${BASE_URL}/supervisor/create-escalation`,
      {
        employeeId: testEmployeeId,
        projectId: testProjectId,
        escalationType: 'REPEATED_LATE',
        severity: 'MEDIUM',
        description: 'Worker has been late 3 times this week',
        occurrenceCount: 3,
        dateRange: {
          from: sevenDaysAgo,
          to: today
        },
        escalatedTo: 'MANAGER',
        notes: 'Needs immediate attention'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✅ Escalation created successfully');
    console.log('   Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Create escalation error:', error.response?.data || error.message);
    return false;
  }
}

async function testGetEscalations() {
  try {
    console.log('\n📋 Testing Get Escalations...');
    
    const response = await axios.get(
      `${BASE_URL}/supervisor/escalations`,
      {
        params: {
          projectId: testProjectId,
          status: 'PENDING'
        },
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✅ Escalations retrieved successfully');
    console.log(`   Found ${response.data.count} escalations`);
    if (response.data.data && response.data.data.length > 0) {
      console.log('   First escalation:', JSON.stringify(response.data.data[0], null, 2));
    }
    return true;
  } catch (error) {
    console.error('❌ Get escalations error:', error.response?.data || error.message);
    return false;
  }
}

async function testExportReport() {
  try {
    console.log('\n📊 Testing Export Report (JSON)...');
    
    const response = await axios.get(
      `${BASE_URL}/supervisor/export-attendance-report`,
      {
        params: {
          projectId: testProjectId,
          date: new Date().toISOString().split('T')[0],
          format: 'json'
        },
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✅ Report exported successfully');
    console.log('   Summary:', JSON.stringify(response.data.summary, null, 2));
    console.log(`   Total workers in report: ${response.data.data?.length || 0}`);
    
    if (response.data.data && response.data.data.length > 0) {
      const firstWorker = response.data.data[0];
      console.log('   First worker data:');
      console.log(`     Name: ${firstWorker.employeeName}`);
      console.log(`     Status: ${firstWorker.status}`);
      console.log(`     Regular Hours: ${firstWorker.regularHours}`);
      console.log(`     OT Hours: ${firstWorker.otHours}`);
      console.log(`     Total Hours: ${firstWorker.totalHours}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Export report error:', error.response?.data || error.message);
    return false;
  }
}

async function testAttendanceMonitoring() {
  try {
    console.log('\n👥 Testing Updated Attendance Monitoring...');
    
    const response = await axios.get(
      `${BASE_URL}/supervisor/attendance-monitoring`,
      {
        params: {
          projectId: testProjectId,
          date: new Date().toISOString().split('T')[0]
        },
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✅ Attendance monitoring data retrieved');
    console.log('   Summary:', JSON.stringify(response.data.summary, null, 2));
    console.log(`   Total workers: ${response.data.workers?.length || 0}`);
    
    if (response.data.workers && response.data.workers.length > 0) {
      const firstWorker = response.data.workers[0];
      console.log('   First worker data:');
      console.log(`     Name: ${firstWorker.workerName}`);
      console.log(`     Status: ${firstWorker.status}`);
      console.log(`     Regular Hours: ${firstWorker.regularHours || 'N/A'}`);
      console.log(`     OT Hours: ${firstWorker.otHours || 'N/A'}`);
      console.log(`     Lunch Duration: ${firstWorker.lunchDuration || 'N/A'}`);
      console.log(`     Absence Reason: ${firstWorker.absenceReason || 'N/A'}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Attendance monitoring error:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting Attendance Enhancements Tests\n');
  console.log('=' .repeat(60));
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  const results = {
    markAbsence: await testMarkAbsenceReason(),
    createEscalation: await testCreateEscalation(),
    getEscalations: await testGetEscalations(),
    exportReport: await testExportReport(),
    attendanceMonitoring: await testAttendanceMonitoring()
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary:');
  console.log('='.repeat(60));
  console.log(`Mark Absence Reason:      ${results.markAbsence ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Create Escalation:        ${results.createEscalation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Get Escalations:          ${results.getEscalations ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Export Report:            ${results.exportReport ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Attendance Monitoring:    ${results.attendanceMonitoring ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(60));

  const passCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passCount}/${totalCount} tests passed`);
  
  if (passCount === totalCount) {
    console.log('🎉 All tests passed! Attendance enhancements are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
