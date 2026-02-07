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
async function apiCall(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

// Test 1: Login as Supervisor
async function testLogin() {
  console.log('\n🔐 TEST 1: Supervisor Login');
  console.log('='.repeat(50));
  
  const result = await apiCall('POST', '/auth/login', SUPERVISOR_CREDENTIALS);
  
  if (result.success && result.data.token) {
    authToken = result.data.token;
    console.log('✅ Login successful');
    console.log(`Token: ${authToken.substring(0, 20)}...`);
    console.log(`User ID: ${result.data.user?.id}`);
    console.log(`Role: ${result.data.user?.role}`);
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    return false;
  }
}

// Test 2: Submit Daily Progress (to get dailyProgressId)
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
    console.log('❌ Failed to submit daily progress:', result.error);
    return false;
  }
}

// Test 3: Track Manpower Usage ✅
async function testTrackManpowerUsage() {
  console.log('\n👷 TEST 3: Track Manpower Usage');
  console.log('='.repeat(50));
  
  const data = {
    projectId: 1,
    dailyProgressId: dailyProgressId,
    date: new Date().toISOString().split('T')[0],
    totalWorkers: 25,
    activeWorkers: 22,
    productivity: 85,
    efficiency: 78,
    overtimeHours: 12,
    absentWorkers: 2,
    lateWorkers: 1,
    workerBreakdown: [
      {
        category: 'Masons',
        count: 8,
        hoursWorked: 64,
        productivity: 90
      },
      {
        category: 'Carpenters',
        count: 6,
        hoursWorked: 48,
        productivity: 85
      },
      {
        category: 'Electricians',
        count: 4,
        hoursWorked: 32,
        productivity: 80
      },
      {
        category: 'Plumbers',
        count: 4,
        hoursWorked: 32,
        productivity: 75
      }
    ]
  };

  const result = await apiCall('POST', '/supervisor/daily-progress/manpower', data);
  
  if (result.success) {
    console.log('✅ Manpower usage tracked successfully');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to track manpower usage:', result.error);
    return false;
  }
}

// Test 4: Log Issues / Safety Observations ✅
async function testLogIssues() {
  console.log('\n⚠️  TEST 4: Log Issues / Safety Observations');
  console.log('='.repeat(50));
  
  const data = {
    projectId: 1,
    dailyProgressId: dailyProgressId,
    date: new Date().toISOString().split('T')[0],
    issues: [
      {
        type: 'safety',
        severity: 'high',
        description: 'Scaffolding not properly secured on 3rd floor',
        location: 'Building A - 3rd Floor',
        actionTaken: 'Immediate repair ordered, area cordoned off',
        status: 'resolved'
      },
      {
        type: 'quality',
        severity: 'medium',
        description: 'Concrete mix ratio inconsistent in batch #45',
        location: 'Foundation - Section C',
        actionTaken: 'Batch rejected, new mix prepared',
        status: 'resolved'
      },
      {
        type: 'equipment',
        severity: 'low',
        description: 'Crane #2 making unusual noise',
        location: 'Main site',
        actionTaken: 'Maintenance scheduled for tomorrow',
        status: 'open'
      },
      {
        type: 'safety',
        severity: 'critical',
        description: 'Worker found without safety harness at height',
        location: 'Building B - Roof',
        actionTaken: 'Worker removed from site, safety briefing conducted',
        status: 'resolved'
      }
    ]
  };

  const result = await apiCall('POST', '/supervisor/daily-progress/issues', data);
  
  if (result.success) {
    console.log('✅ Issues logged successfully');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to log issues:', result.error);
    return false;
  }
}

// Test 5: Track Material Consumption ✅
async function testTrackMaterialConsumption() {
  console.log('\n🧱 TEST 5: Track Material Consumption');
  console.log('='.repeat(50));
  
  const data = {
    projectId: 1,
    dailyProgressId: dailyProgressId,
    date: new Date().toISOString().split('T')[0],
    materials: [
      {
        materialId: 1,
        materialName: 'Cement (50kg bags)',
        consumed: 120,
        remaining: 380,
        unit: 'bags',
        plannedConsumption: 100,
        wastage: 5,
        notes: 'Higher consumption due to additional foundation work'
      },
      {
        materialId: 2,
        materialName: 'Steel Rebar (12mm)',
        consumed: 850,
        remaining: 2150,
        unit: 'kg',
        plannedConsumption: 800,
        wastage: 15,
        notes: 'On track with planned usage'
      },
      {
        materialId: 3,
        materialName: 'Bricks',
        consumed: 5000,
        remaining: 15000,
        unit: 'pieces',
        plannedConsumption: 5000,
        wastage: 50,
        notes: 'Normal consumption rate'
      },
      {
        materialId: 4,
        materialName: 'Sand',
        consumed: 8,
        remaining: 12,
        unit: 'cubic meters',
        plannedConsumption: 10,
        wastage: 0.5,
        notes: 'Below planned consumption'
      },
      {
        materialId: 5,
        materialName: 'Paint (White)',
        consumed: 25,
        remaining: 15,
        unit: 'liters',
        plannedConsumption: 20,
        wastage: 2,
        notes: 'Low stock - reorder needed'
      }
    ]
  };

  const result = await apiCall('POST', '/supervisor/daily-progress/materials', data);
  
  if (result.success) {
    console.log('✅ Material consumption tracked successfully');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to track material consumption:', result.error);
    return false;
  }
}

// Test 6: Get Daily Progress by Date (Verify all data)
async function testGetDailyProgress() {
  console.log('\n📅 TEST 6: Get Daily Progress by Date (Verification)');
  console.log('='.repeat(50));

  const today = new Date().toISOString().split('T')[0];
  const result = await apiCall('GET', `/supervisor/daily-progress/1/${today}`);
  
  if (result.success) {
    console.log('✅ Daily progress retrieved successfully');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to get daily progress:', result.error);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 DAILY PROGRESS MISSING APIs - COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(70));
  console.log('Testing the following APIs:');
  console.log('  ✅ POST /supervisor/daily-progress/manpower');
  console.log('  ✅ POST /supervisor/daily-progress/issues');
  console.log('  ✅ POST /supervisor/daily-progress/materials');
  console.log('='.repeat(70));

  const results = {
    total: 6,
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

  // Test 3: Track Manpower Usage ✅
  if (await testTrackManpowerUsage()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 4: Log Issues ✅
  if (await testLogIssues()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 5: Track Material Consumption ✅
  if (await testTrackMaterialConsumption()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 6: Get Daily Progress (Verification)
  if (await testGetDailyProgress()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  console.log('='.repeat(70));

  if (results.passed === results.total) {
    console.log('\n🎉 ALL TESTS PASSED! All Daily Progress APIs are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
