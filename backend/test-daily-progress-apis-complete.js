import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

// Test credentials
const SUPERVISOR_CREDENTIALS = {
  email: 'supervisor4@example.com',
  password: 'password123'
};

let authToken = '';
let dailyProgressId = null;

// Helper function to make authenticated requests
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

// Test 1: Login
async function testLogin() {
  console.log('\n🔐 TEST 1: Supervisor Login');
  console.log('=' .repeat(50));

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, SUPERVISOR_CREDENTIALS);
    
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      console.log(`Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Login failed - no token received');
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Submit Daily Progress
async function testSubmitDailyProgress() {
  console.log('\n📊 TEST 2: Submit Daily Progress Report');
  console.log('='.repeat(50));

  const data = {
    projectId: 1,
    remarks: 'Good progress today. All tasks on schedule.',
    issues: 'Minor delay in material delivery'
  };

  const result = await apiCall('POST', '/supervisor/daily-progress', data);
  
  if (result.success) {
    console.log('✅ Daily progress submitted successfully');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    dailyProgressId = result.data.dailyProgress?.id;
    console.log(`Daily Progress ID: ${dailyProgressId}`);
    return true;
  } else {
    console.log('❌ Failed to submit daily progress');
    console.log('Error:', result.error);
    return false;
  }
}

// Test 3: Track Manpower Usage (NEW)
async function testTrackManpower() {
  console.log('\n👷 TEST 3: Track Manpower Usage');
  console.log('='.repeat(50));

  const data = {
    projectId: 1,
    date: new Date().toISOString().split('T')[0],
    totalWorkers: 25,
    activeWorkers: 23,
    productivity: 85,
    efficiency: 90,
    overtimeHours: 5,
    absentWorkers: 2,
    lateWorkers: 3,
    workerBreakdown: [
      {
        role: 'Mason',
        planned: 10,
        actual: 9,
        hoursWorked: 72
      },
      {
        role: 'Carpenter',
        planned: 8,
        actual: 8,
        hoursWorked: 64
      },
      {
        role: 'Laborer',
        planned: 7,
        actual: 6,
        hoursWorked: 48
      }
    ]
  };

  const result = await apiCall('POST', '/supervisor/daily-progress/manpower', data);
  
  if (result.success) {
    console.log('✅ Manpower usage tracked successfully');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to track manpower usage');
    console.log('Error:', result.error);
    return false;
  }
}

// Test 4: Log Issues and Safety (NEW)
async function testLogIssues() {
  console.log('\n⚠️  TEST 4: Log Issues and Safety Observations');
  console.log('='.repeat(50));

  const data = {
    projectId: 1,
    dailyProgressId: dailyProgressId,
    date: new Date().toISOString().split('T')[0],
    issues: [
      {
        type: 'safety',
        description: 'Worker slipped on wet floor in Building A',
        severity: 'medium',
        status: 'open',
        location: 'Building A - 2nd Floor',
        reportedBy: 'Supervisor 4',
        actionTaken: 'Area cordoned off, warning signs placed'
      },
      {
        type: 'quality',
        description: 'Concrete mix not meeting specifications',
        severity: 'high',
        status: 'in_progress',
        location: 'Foundation Section C',
        reportedBy: 'Supervisor 4',
        actionTaken: 'Stopped work, contacted supplier'
      },
      {
        type: 'delay',
        description: 'Material delivery delayed by 2 hours',
        severity: 'low',
        status: 'resolved',
        location: 'Main Gate',
        reportedBy: 'Supervisor 4',
        actionTaken: 'Rescheduled tasks, no impact on timeline'
      }
    ]
  };

  const result = await apiCall('POST', '/supervisor/daily-progress/issues', data);
  
  if (result.success) {
    console.log('✅ Issues logged successfully');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to log issues');
    console.log('Error:', result.error);
    return false;
  }
}

// Test 5: Track Material Consumption (NEW)
async function testTrackMaterials() {
  console.log('\n🧱 TEST 5: Track Material Consumption');
  console.log('='.repeat(50));

  const data = {
    projectId: 1,
    dailyProgressId: dailyProgressId,
    date: new Date().toISOString().split('T')[0],
    materials: [
      {
        materialId: 101,
        materialName: 'Cement',
        consumed: 50,
        remaining: 150,
        unit: 'bags',
        plannedConsumption: 45,
        wastage: 5,
        notes: 'Extra bags used for foundation repair'
      },
      {
        materialId: 102,
        materialName: 'Steel Rebar',
        consumed: 200,
        remaining: 800,
        unit: 'kg',
        plannedConsumption: 200,
        wastage: 0,
        notes: 'As per plan'
      },
      {
        materialId: 103,
        materialName: 'Sand',
        consumed: 5,
        remaining: 3,
        unit: 'cubic meters',
        plannedConsumption: 6,
        wastage: 0.5,
        notes: 'Low stock - need to reorder'
      }
    ]
  };

  const result = await apiCall('POST', '/supervisor/daily-progress/materials', data);
  
  if (result.success) {
    console.log('✅ Material consumption tracked successfully');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to track material consumption');
    console.log('Error:', result.error);
    return false;
  }
}

// Test 6: Get Daily Progress by Date
async function testGetDailyProgress() {
  console.log('\n📅 TEST 6: Get Daily Progress by Date');
  console.log('='.repeat(50));

  const today = new Date().toISOString().split('T')[0];
  const result = await apiCall('GET', `/supervisor/daily-progress/1/${today}`);
  
  if (result.success) {
    console.log('✅ Daily progress retrieved successfully');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to get daily progress');
    console.log('Error:', result.error);
    return false;
  }
}

// Test 7: Get Daily Progress Range
async function testGetDailyProgressRange() {
  console.log('\n📆 TEST 7: Get Daily Progress Range');
  console.log('='.repeat(50));

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const from = weekAgo.toISOString().split('T')[0];
  const to = today.toISOString().split('T')[0];

  const result = await apiCall('GET', `/supervisor/daily-progress/1?from=${from}&to=${to}`);
  
  if (result.success) {
    console.log('✅ Daily progress range retrieved successfully');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to get daily progress range');
    console.log('Error:', result.error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 DAILY PROGRESS REPORT API TESTS');
  console.log('='.repeat(50));
  console.log('Testing all Daily Progress Report APIs');
  console.log('='.repeat(50));

  const results = {
    total: 7,
    passed: 0,
    failed: 0
  };

  // Test 1: Login
  if (await testLogin()) {
    results.passed++;
  } else {
    results.failed++;
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  // Test 2: Submit Daily Progress
  if (await testSubmitDailyProgress()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 3: Track Manpower (NEW)
  if (await testTrackManpower()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 4: Log Issues (NEW)
  if (await testLogIssues()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 5: Track Materials (NEW)
  if (await testTrackMaterials()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 6: Get Daily Progress by Date
  if (await testGetDailyProgress()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 7: Get Daily Progress Range
  if (await testGetDailyProgressRange()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));
}

// Run tests
runAllTests().catch(console.error);
