import axios from 'axios';

const BASE_URL = 'http://localhost:5002/api';

// Test credentials
const SUPERVISOR_CREDENTIALS = {
  email: 'supervisor4@example.com',
  password: 'password123'
};

let authToken = '';
let dailyProgressId = null;
let manpowerRecordId = null;
let issueRecordId = null;
let materialRecordId = null;

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
      status: error.response?.status,
      fullError: error.response?.data
    };
  }
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

async function testLogin() {
  console.log('\n🔐 STEP 1: Supervisor Login');
  console.log('='.repeat(70));
  
  const result = await apiCall('POST', '/auth/login', SUPERVISOR_CREDENTIALS);
  
  if (result.success && result.data.token) {
    authToken = result.data.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${authToken.substring(0, 30)}...`);
    console.log(`   User ID: ${result.data.user?.id}`);
    console.log(`   Role: ${result.data.user?.role}`);
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    return false;
  }
}

// ============================================================================
// DAILY PROGRESS - CREATE BASE RECORD
// ============================================================================

async function createDailyProgress() {
  console.log('\n📊 STEP 2: Create Daily Progress Base Record');
  console.log('='.repeat(70));
  
  const data = {
    projectId: 1,
    remarks: 'Initial daily progress report - Testing CRUD operations',
    issues: 'No major issues at start of day'
  };

  const result = await apiCall('POST', '/supervisor/daily-progress', data);
  
  if (result.success) {
    console.log('✅ Daily progress created successfully');
    dailyProgressId = result.data.dailyProgress?.id;
    console.log(`   Daily Progress ID: ${dailyProgressId}`);
    console.log(`   Project ID: ${result.data.dailyProgress?.projectId}`);
    console.log(`   Overall Progress: ${result.data.dailyProgress?.overallProgress}%`);
    return true;
  } else {
    console.log('❌ Failed to create daily progress:', result.error);
    console.log('   Full error:', JSON.stringify(result.fullError, null, 2));
    return false;
  }
}

// ============================================================================
// MANPOWER USAGE - CREATE (INSERT)
// ============================================================================

async function insertManpowerUsage() {
  console.log('\n👷 STEP 3: INSERT - Track Manpower Usage');
  console.log('='.repeat(70));
  
  const data = {
    projectId: 1,
    dailyProgressId: dailyProgressId,
    date: new Date().toISOString().split('T')[0],
    totalWorkers: 30,
    activeWorkers: 28,
    productivity: 85,
    efficiency: 80,
    overtimeHours: 15,
    absentWorkers: 2,
    lateWorkers: 0,
    workerBreakdown: [
      {
        category: 'Masons',
        count: 10,
        hoursWorked: 80,
        productivity: 90
      },
      {
        category: 'Carpenters',
        count: 8,
        hoursWorked: 64,
        productivity: 85
      },
      {
        category: 'Electricians',
        count: 6,
        hoursWorked: 48,
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
    manpowerRecordId = result.data.data?.id;
    console.log(`   Record ID: ${manpowerRecordId}`);
    console.log(`   Total Workers: ${data.totalWorkers}`);
    console.log(`   Active Workers: ${data.activeWorkers}`);
    console.log(`   Utilization Rate: ${result.data.data?.utilizationRate}%`);
    console.log(`   Productivity Score: ${result.data.data?.productivityScore}%`);
    console.log(`   Worker Categories: ${data.workerBreakdown.length}`);
    return true;
  } else {
    console.log('❌ Failed to track manpower usage:', result.error);
    console.log('   Full error:', JSON.stringify(result.fullError, null, 2));
    return false;
  }
}

// ============================================================================
// MANPOWER USAGE - UPDATE
// ============================================================================

async function updateManpowerUsage() {
  console.log('\n👷 STEP 4: UPDATE - Modify Manpower Usage');
  console.log('='.repeat(70));
  
  const data = {
    projectId: 1,
    dailyProgressId: dailyProgressId,
    date: new Date().toISOString().split('T')[0],
    totalWorkers: 32,  // Updated: 2 more workers arrived
    activeWorkers: 30,  // Updated: all workers now active
    productivity: 90,   // Updated: improved productivity
    efficiency: 85,     // Updated: improved efficiency
    overtimeHours: 18,  // Updated: more overtime
    absentWorkers: 0,   // Updated: no absences now
    lateWorkers: 2,     // Updated: 2 workers were late
    workerBreakdown: [
      {
        category: 'Masons',
        count: 12,  // Updated: 2 more masons
        hoursWorked: 96,
        productivity: 92
      },
      {
        category: 'Carpenters',
        count: 8,
        hoursWorked: 64,
        productivity: 88
      },
      {
        category: 'Electricians',
        count: 6,
        hoursWorked: 48,
        productivity: 85
      },
      {
        category: 'Plumbers',
        count: 4,
        hoursWorked: 32,
        productivity: 80
      },
      {
        category: 'Helpers',  // New category added
        count: 2,
        hoursWorked: 16,
        productivity: 70
      }
    ]
  };

  const result = await apiCall('POST', '/supervisor/daily-progress/manpower', data);
  
  if (result.success) {
    console.log('✅ Manpower usage updated successfully');
    console.log(`   Record ID: ${result.data.data?.id}`);
    console.log(`   Total Workers: ${data.totalWorkers} (was 30)`);
    console.log(`   Active Workers: ${data.activeWorkers} (was 28)`);
    console.log(`   Utilization Rate: ${result.data.data?.utilizationRate}%`);
    console.log(`   Productivity Score: ${result.data.data?.productivityScore}% (was 85%)`);
    console.log(`   Worker Categories: ${data.workerBreakdown.length} (added Helpers)`);
    return true;
  } else {
    console.log('❌ Failed to update manpower usage:', result.error);
    console.log('   Full error:', JSON.stringify(result.fullError, null, 2));
    return false;
  }
}

// ============================================================================
// ISSUES - CREATE (INSERT)
// ============================================================================

async function insertIssues() {
  console.log('\n⚠️  STEP 5: INSERT - Log Issues / Safety Observations');
  console.log('='.repeat(70));
  
  const data = {
    projectId: 1,
    dailyProgressId: dailyProgressId,
    date: new Date().toISOString().split('T')[0],
    issues: [
      {
        type: 'safety',
        severity: 'critical',
        description: 'Worker found without safety harness at height',
        location: 'Building A - 5th Floor',
        actionTaken: 'Worker removed from site, safety briefing conducted for all workers',
        status: 'resolved'
      },
      {
        type: 'quality',
        severity: 'high',
        description: 'Concrete mix ratio inconsistent in batch #78',
        location: 'Foundation - Section D',
        actionTaken: 'Batch rejected, new mix prepared with proper supervision',
        status: 'resolved'
      },
      {
        type: 'equipment',
        severity: 'medium',
        description: 'Crane #3 hydraulic system showing pressure drop',
        location: 'Main construction site',
        actionTaken: 'Maintenance team notified, crane taken out of service',
        status: 'open'
      }
    ]
  };

  const result = await apiCall('POST', '/supervisor/daily-progress/issues', data);
  
  if (result.success) {
    console.log('✅ Issues logged successfully');
    issueRecordId = result.data.data?.dailyProgressId;
    console.log(`   Daily Progress ID: ${issueRecordId}`);
    console.log(`   Issues Recorded: ${result.data.data?.issuesRecorded}`);
    console.log(`   Critical Issues: ${result.data.data?.criticalIssues}`);
    console.log(`   High Severity: ${result.data.data?.highSeverity}`);
    console.log('\n   Issue Details:');
    data.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.description}`);
    });
    return true;
  } else {
    console.log('❌ Failed to log issues:', result.error);
    console.log('   Full error:', JSON.stringify(result.fullError, null, 2));
    return false;
  }
}

// ============================================================================
// ISSUES - UPDATE (ADD MORE ISSUES)
// ============================================================================

async function updateIssues() {
  console.log('\n⚠️  STEP 6: UPDATE - Add More Issues');
  console.log('='.repeat(70));
  
  const data = {
    projectId: 1,
    dailyProgressId: dailyProgressId,
    date: new Date().toISOString().split('T')[0],
    issues: [
      {
        type: 'safety',
        severity: 'high',
        description: 'Electrical panel left open and unattended',
        location: 'Building B - Ground Floor',
        actionTaken: 'Panel secured, electrician warned',
        status: 'resolved'
      },
      {
        type: 'material',
        severity: 'medium',
        description: 'Cement bags stored in open area, risk of moisture damage',
        location: 'Storage Area - Zone 2',
        actionTaken: 'Materials moved to covered storage',
        status: 'resolved'
      },
      {
        type: 'environmental',
        severity: 'low',
        description: 'Dust levels higher than normal due to demolition work',
        location: 'Demolition Zone',
        actionTaken: 'Water spraying increased, workers provided with masks',
        status: 'monitoring'
      }
    ]
  };

  const result = await apiCall('POST', '/supervisor/daily-progress/issues', data);
  
  if (result.success) {
    console.log('✅ Additional issues logged successfully');
    console.log(`   Daily Progress ID: ${result.data.data?.dailyProgressId}`);
    console.log(`   New Issues Recorded: ${result.data.data?.issuesRecorded}`);
    console.log(`   Critical Issues: ${result.data.data?.criticalIssues}`);
    console.log(`   High Severity: ${result.data.data?.highSeverity}`);
    console.log('\n   New Issue Details:');
    data.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.description}`);
    });
    return true;
  } else {
    console.log('❌ Failed to add more issues:', result.error);
    console.log('   Full error:', JSON.stringify(result.fullError, null, 2));
    return false;
  }
}

// ============================================================================
// MATERIALS - CREATE (INSERT)
// ============================================================================

async function insertMaterialConsumption() {
  console.log('\n🧱 STEP 7: INSERT - Track Material Consumption');
  console.log('='.repeat(70));
  
  const data = {
    projectId: 1,
    dailyProgressId: dailyProgressId,
    date: new Date().toISOString().split('T')[0],
    materials: [
      {
        materialId: 1,
        materialName: 'Cement (50kg bags)',
        consumed: 150,
        remaining: 350,
        unit: 'bags',
        plannedConsumption: 120,
        wastage: 5,
        notes: 'Higher consumption due to additional foundation work'
      },
      {
        materialId: 2,
        materialName: 'Steel Rebar (12mm)',
        consumed: 900,
        remaining: 2100,
        unit: 'kg',
        plannedConsumption: 850,
        wastage: 20,
        notes: 'Slightly over planned usage'
      },
      {
        materialId: 3,
        materialName: 'Bricks',
        consumed: 6000,
        remaining: 14000,
        unit: 'pieces',
        plannedConsumption: 6000,
        wastage: 100,
        notes: 'On track with planned usage'
      },
      {
        materialId: 4,
        materialName: 'Sand',
        consumed: 10,
        remaining: 10,
        unit: 'cubic meters',
        plannedConsumption: 12,
        wastage: 0.5,
        notes: 'Below planned consumption'
      }
    ]
  };

  const result = await apiCall('POST', '/supervisor/daily-progress/materials', data);
  
  if (result.success) {
    console.log('✅ Material consumption tracked successfully');
    materialRecordId = result.data.data?.materials?.length;
    console.log(`   Materials Tracked: ${result.data.data?.materialsTracked}`);
    console.log(`   Total Wastage: ${result.data.data?.totalWastage} units`);
    console.log(`   Over Consumption Items: ${result.data.data?.overConsumption}`);
    console.log(`   Low Stock Alerts: ${result.data.data?.lowStockAlerts?.length || 0}`);
    
    if (result.data.data?.lowStockAlerts?.length > 0) {
      console.log('\n   ⚠️  Low Stock Alerts:');
      result.data.data.lowStockAlerts.forEach(alert => {
        console.log(`      - ${alert.materialName}: ${alert.remaining} ${alert.unit} remaining`);
      });
    }
    
    console.log('\n   Material Details:');
    data.materials.forEach((material, index) => {
      console.log(`   ${index + 1}. ${material.materialName}: ${material.consumed} ${material.unit} consumed`);
    });
    return true;
  } else {
    console.log('❌ Failed to track material consumption:', result.error);
    console.log('   Full error:', JSON.stringify(result.fullError, null, 2));
    return false;
  }
}

// ============================================================================
// MATERIALS - UPDATE
// ============================================================================

async function updateMaterialConsumption() {
  console.log('\n🧱 STEP 8: UPDATE - Modify Material Consumption');
  console.log('='.repeat(70));
  
  const data = {
    projectId: 1,
    dailyProgressId: dailyProgressId,
    date: new Date().toISOString().split('T')[0],
    materials: [
      {
        materialId: 1,
        materialName: 'Cement (50kg bags)',
        consumed: 180,  // Updated: 30 more bags used
        remaining: 320,  // Updated: less remaining
        unit: 'bags',
        plannedConsumption: 120,
        wastage: 8,  // Updated: more wastage
        notes: 'Additional work required more cement than planned'
      },
      {
        materialId: 2,
        materialName: 'Steel Rebar (12mm)',
        consumed: 950,  // Updated: 50 more kg used
        remaining: 2050,  // Updated
        unit: 'kg',
        plannedConsumption: 850,
        wastage: 25,  // Updated
        notes: 'Completed rebar work for section A'
      },
      {
        materialId: 3,
        materialName: 'Bricks',
        consumed: 7500,  // Updated: 1500 more bricks
        remaining: 12500,  // Updated
        unit: 'pieces',
        plannedConsumption: 6000,
        wastage: 150,  // Updated
        notes: 'Accelerated brickwork progress'
      },
      {
        materialId: 4,
        materialName: 'Sand',
        consumed: 15,  // Updated: 5 more cubic meters
        remaining: 5,  // Updated: LOW STOCK
        unit: 'cubic meters',
        plannedConsumption: 12,
        wastage: 1,  // Updated
        notes: 'URGENT: Need to reorder sand immediately'
      },
      {
        materialId: 5,
        materialName: 'Paint (White)',  // New material added
        consumed: 30,
        remaining: 10,
        unit: 'liters',
        plannedConsumption: 25,
        wastage: 2,
        notes: 'Started painting work on Building A'
      }
    ]
  };

  const result = await apiCall('POST', '/supervisor/daily-progress/materials', data);
  
  if (result.success) {
    console.log('✅ Material consumption updated successfully');
    console.log(`   Materials Tracked: ${result.data.data?.materialsTracked} (added Paint)`);
    console.log(`   Total Wastage: ${result.data.data?.totalWastage} units (was 125.5)`);
    console.log(`   Over Consumption Items: ${result.data.data?.overConsumption}`);
    console.log(`   Low Stock Alerts: ${result.data.data?.lowStockAlerts?.length || 0}`);
    
    if (result.data.data?.lowStockAlerts?.length > 0) {
      console.log('\n   ⚠️  Low Stock Alerts:');
      result.data.data.lowStockAlerts.forEach(alert => {
        console.log(`      - ${alert.materialName}: ${alert.remaining} ${alert.unit} remaining`);
      });
    }
    
    console.log('\n   Updated Material Details:');
    data.materials.forEach((material, index) => {
      console.log(`   ${index + 1}. ${material.materialName}: ${material.consumed} ${material.unit} consumed`);
    });
    return true;
  } else {
    console.log('❌ Failed to update material consumption:', result.error);
    console.log('   Full error:', JSON.stringify(result.fullError, null, 2));
    return false;
  }
}

// ============================================================================
// VERIFICATION - GET DAILY PROGRESS
// ============================================================================

async function verifyDailyProgress() {
  console.log('\n📅 STEP 9: VERIFY - Get Complete Daily Progress');
  console.log('='.repeat(70));

  const today = new Date().toISOString().split('T')[0];
  const result = await apiCall('GET', `/supervisor/daily-progress/1/${today}`);
  
  if (result.success) {
    console.log('✅ Daily progress retrieved successfully');
    console.log('\n   Complete Daily Progress Data:');
    console.log(JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to get daily progress:', result.error);
    console.log('   Full error:', JSON.stringify(result.fullError, null, 2));
    return false;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 DAILY PROGRESS APIs - COMPLETE CRUD TEST SUITE');
  console.log('='.repeat(70));
  console.log('Testing APIs:');
  console.log('  ✅ POST /supervisor/daily-progress/manpower (INSERT & UPDATE)');
  console.log('  ✅ POST /supervisor/daily-progress/issues (INSERT & UPDATE)');
  console.log('  ✅ POST /supervisor/daily-progress/materials (INSERT & UPDATE)');
  console.log('='.repeat(70));

  const results = {
    total: 9,
    passed: 0,
    failed: 0,
    tests: []
  };

  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Create Daily Progress', fn: createDailyProgress },
    { name: 'INSERT Manpower Usage', fn: insertManpowerUsage },
    { name: 'UPDATE Manpower Usage', fn: updateManpowerUsage },
    { name: 'INSERT Issues', fn: insertIssues },
    { name: 'UPDATE Issues', fn: updateIssues },
    { name: 'INSERT Material Consumption', fn: insertMaterialConsumption },
    { name: 'UPDATE Material Consumption', fn: updateMaterialConsumption },
    { name: 'VERIFY Daily Progress', fn: verifyDailyProgress }
  ];

  for (const test of tests) {
    const passed = await test.fn();
    results.tests.push({ name: test.name, passed });
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
      if (test.name === 'Login' || test.name === 'Create Daily Progress') {
        console.log('\n❌ Critical test failed. Stopping execution.');
        break;
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  console.log('\n' + 'Test Results:');
  results.tests.forEach((test, index) => {
    console.log(`  ${index + 1}. ${test.passed ? '✅' : '❌'} ${test.name}`);
  });
  console.log('='.repeat(70));

  if (results.passed === results.total) {
    console.log('\n🎉 ALL TESTS PASSED! All Daily Progress CRUD operations working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }

  console.log('\n📝 Note: This test demonstrates:');
  console.log('   - INSERT: Creating new records for manpower, issues, and materials');
  console.log('   - UPDATE: Modifying existing records (same endpoint, overwrites data)');
  console.log('   - READ: Retrieving complete daily progress data');
  console.log('   - DELETE: Not implemented (data is appended/overwritten, not deleted)');
}

// Run the tests
runAllTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
