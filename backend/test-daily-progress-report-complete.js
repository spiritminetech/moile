import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5002/api';

// Test credentials
const SUPERVISOR_CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'Password123'
};

let authToken = '';
let supervisorId = null;
let projectId = 1; // Using existing project
let dailyProgressId = null;

console.log('🧪 DAILY PROGRESS REPORT - END-TO-END TEST');
console.log('='.repeat(60));

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, isFormData = false) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...(isFormData ? {} : { 'Content-Type': 'application/json' })
      }
    };

    if (data) {
      if (isFormData) {
        config.data = data;
        config.headers = {
          ...config.headers,
          ...data.getHeaders()
        };
      } else {
        config.data = data;
      }
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Request failed:', {
      url: `${BASE_URL}${endpoint}`,
      method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
      fullError: error
    };
  }
};

// Test 1: Login as Supervisor
async function testLogin() {
  console.log('\n📝 Test 1: Supervisor Login');
  console.log('-'.repeat(60));

  const result = await makeRequest('post', '/auth/login', SUPERVISOR_CREDENTIALS);

  if (result.success && result.data.token) {
    authToken = result.data.token;
    supervisorId = result.data.user?.id || result.data.user?.employeeId;
    console.log('✅ Login successful');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    console.log(`   Supervisor ID: ${supervisorId}`);
    console.log(`   Role: ${result.data.user?.role}`);
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    return false;
  }
}

// Test 2: Submit Daily Progress (Basic)
async function testSubmitDailyProgress() {
  console.log('\n📝 Test 2: Submit Daily Progress Report');
  console.log('-'.repeat(60));

  const progressData = {
    projectId: projectId,
    remarks: 'Foundation work completed. Concrete pouring in progress.',
    issues: 'Minor delay due to weather conditions. Safety protocols maintained.',
    overallProgress: 75 // Manual progress percentage
  };

  console.log('Request Data:', JSON.stringify(progressData, null, 2));

  const result = await makeRequest('post', '/supervisor/daily-progress', progressData);

  if (result.success) {
    dailyProgressId = result.data.dailyProgress?.id;
    console.log('✅ Daily progress submitted successfully');
    console.log(`   Progress ID: ${dailyProgressId}`);
    console.log(`   Project ID: ${result.data.dailyProgress?.projectId}`);
    console.log(`   Overall Progress: ${result.data.dailyProgress?.overallProgress}%`);
    console.log(`   Date: ${result.data.dailyProgress?.date}`);
    return true;
  } else {
    console.log('❌ Failed to submit daily progress');
    console.log('   Error:', result.error);
    console.log('   Status:', result.status);
    return false;
  }
}

// Test 3: Track Manpower Usage
async function testTrackManpower() {
  console.log('\n📝 Test 3: Track Manpower Usage');
  console.log('-'.repeat(60));

  const manpowerData = {
    projectId: projectId,
    dailyProgressId: dailyProgressId,
    totalWorkers: 25,
    activeWorkers: 22,
    productivity: 88,
    efficiency: 85,
    overtimeHours: 5,
    absentWorkers: 2,
    lateWorkers: 1,
    workerBreakdown: [
      { role: 'Mason', count: 8 },
      { role: 'Carpenter', count: 6 },
      { role: 'Laborer', count: 8 },
      { role: 'Electrician', count: 3 }
    ]
  };

  console.log('Request Data:', JSON.stringify(manpowerData, null, 2));

  const result = await makeRequest('post', '/supervisor/daily-progress/manpower', manpowerData);

  if (result.success) {
    console.log('✅ Manpower data tracked successfully');
    console.log(`   Utilization Rate: ${result.data.data?.utilizationRate}%`);
    console.log(`   Productivity Score: ${result.data.data?.productivityScore}`);
    console.log(`   Total Workers: ${manpowerData.totalWorkers}`);
    console.log(`   Active Workers: ${manpowerData.activeWorkers}`);
    return true;
  } else {
    console.log('❌ Failed to track manpower');
    console.log('   Error:', result.error);
    return false;
  }
}

// Test 4: Log Issues and Safety Observations
async function testLogIssues() {
  console.log('\n📝 Test 4: Log Issues & Safety Observations');
  console.log('-'.repeat(60));

  const issuesData = {
    projectId: projectId,
    dailyProgressId: dailyProgressId,
    issues: [
      {
        type: 'safety',
        description: 'Scaffolding inspection required on north side',
        severity: 'high',
        status: 'open',
        location: 'North Wing - Level 3',
        actionTaken: 'Cordoned off area, inspection scheduled'
      },
      {
        type: 'quality',
        description: 'Concrete mix consistency needs adjustment',
        severity: 'medium',
        status: 'in_progress',
        location: 'Foundation Area B',
        actionTaken: 'Notified supplier, adjusting water ratio'
      },
      {
        type: 'delay',
        description: 'Material delivery delayed by 2 hours',
        severity: 'low',
        status: 'resolved',
        location: 'Main Gate',
        actionTaken: 'Rescheduled work sequence'
      }
    ]
  };

  console.log('Request Data:', JSON.stringify(issuesData, null, 2));

  const result = await makeRequest('post', '/supervisor/daily-progress/issues', issuesData);

  if (result.success) {
    console.log('✅ Issues logged successfully');
    console.log(`   Issues Recorded: ${result.data.data?.issuesRecorded}`);
    console.log(`   Critical Issues: ${result.data.data?.criticalIssues}`);
    console.log(`   High Severity: ${result.data.data?.highSeverity}`);
    return true;
  } else {
    console.log('❌ Failed to log issues');
    console.log('   Error:', result.error);
    return false;
  }
}

// Test 5: Track Material Consumption
async function testTrackMaterials() {
  console.log('\n📝 Test 5: Track Material Consumption');
  console.log('-'.repeat(60));

  const materialsData = {
    projectId: projectId,
    dailyProgressId: dailyProgressId,
    materials: [
      {
        materialId: 101,
        materialName: 'Cement (50kg bags)',
        consumed: 120,
        remaining: 380,
        unit: 'bags',
        plannedConsumption: 100,
        wastage: 5,
        notes: 'Higher consumption due to additional foundation work'
      },
      {
        materialId: 102,
        materialName: 'Steel Rebar (12mm)',
        consumed: 2500,
        remaining: 7500,
        unit: 'kg',
        plannedConsumption: 2400,
        wastage: 50,
        notes: 'Within acceptable range'
      },
      {
        materialId: 103,
        materialName: 'Sand',
        consumed: 15,
        remaining: 35,
        unit: 'm³',
        plannedConsumption: 15,
        wastage: 0.5,
        notes: 'On track'
      },
      {
        materialId: 104,
        materialName: 'Bricks',
        consumed: 5000,
        remaining: 2000,
        unit: 'pcs',
        plannedConsumption: 4500,
        wastage: 100,
        notes: 'Low stock - reorder needed'
      }
    ]
  };

  console.log('Request Data:', JSON.stringify(materialsData, null, 2));

  const result = await makeRequest('post', '/supervisor/daily-progress/materials', materialsData);

  if (result.success) {
    console.log('✅ Material consumption tracked successfully');
    console.log(`   Materials Tracked: ${result.data.data?.materialsTracked}`);
    console.log(`   Total Wastage: ${result.data.data?.totalWastage}`);
    console.log(`   Over Consumption: ${result.data.data?.overConsumption}`);
    if (result.data.data?.lowStockAlerts?.length > 0) {
      console.log('   ⚠️  Low Stock Alerts:');
      result.data.data.lowStockAlerts.forEach(alert => {
        console.log(`      - ${alert.materialName}: ${alert.remaining} ${alert.unit}`);
      });
    }
    return true;
  } else {
    console.log('❌ Failed to track materials');
    console.log('   Error:', result.error);
    return false;
  }
}

// Test 6: Upload Progress Photos
async function testUploadPhotos() {
  console.log('\n📝 Test 6: Upload Progress Photos');
  console.log('-'.repeat(60));

  // Create a test image file
  const testImagePath = path.join(__dirname, 'test-progress-photo.jpg');
  
  // Create a simple test image if it doesn't exist
  if (!fs.existsSync(testImagePath)) {
    // Create a minimal valid JPEG file
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
      0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
      0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
    ]);
    fs.writeFileSync(testImagePath, jpegHeader);
    console.log('   Created test image file');
  }

  const formData = new FormData();
  formData.append('projectId', projectId.toString());
  if (dailyProgressId) {
    formData.append('dailyProgressId', dailyProgressId.toString());
  }
  formData.append('remarks', 'Foundation work progress photos');
  formData.append('issues', 'No issues observed in photos');
  formData.append('photos', fs.createReadStream(testImagePath), {
    filename: 'progress-photo-1.jpg',
    contentType: 'image/jpeg'
  });

  console.log('Uploading photo...');

  const result = await makeRequest('post', '/supervisor/daily-progress/photos', formData, true);

  if (result.success) {
    console.log('✅ Photos uploaded successfully');
    console.log(`   Photos Count: ${result.data.count}`);
    console.log(`   Daily Progress ID: ${result.data.dailyProgress?.id}`);
    if (result.data.photos && result.data.photos.length > 0) {
      console.log('   Photo URLs:');
      result.data.photos.forEach((photo, index) => {
        console.log(`      ${index + 1}. ${photo.photoUrl}`);
      });
    }
    return true;
  } else {
    console.log('❌ Failed to upload photos');
    console.log('   Error:', result.error);
    return false;
  }
}

// Test 7: Get Daily Progress by Date
async function testGetProgressByDate() {
  console.log('\n📝 Test 7: Get Daily Progress by Date');
  console.log('-'.repeat(60));

  const today = new Date().toISOString().split('T')[0];
  const endpoint = `/supervisor/daily-progress/${projectId}/${today}`;

  console.log(`Fetching progress for: ${today}`);

  const result = await makeRequest('get', endpoint);

  if (result.success) {
    console.log('✅ Daily progress retrieved successfully');
    console.log(`   Project ID: ${result.data.projectId}`);
    console.log(`   Date: ${result.data.date}`);
    console.log(`   Overall Progress: ${result.data.overallProgress}%`);
    console.log(`   Remarks: ${result.data.remarks}`);
    console.log(`   Issues: ${result.data.issues}`);
    console.log(`   Photos: ${result.data.photos?.length || 0}`);
    return true;
  } else {
    console.log('❌ Failed to retrieve daily progress');
    console.log('   Error:', result.error);
    return false;
  }
}

// Test 8: Get Progress Reports (Date Range)
async function testGetProgressRange() {
  console.log('\n📝 Test 8: Get Progress Reports (Date Range)');
  console.log('-'.repeat(60));

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const fromDate = weekAgo.toISOString().split('T')[0];
  const toDate = today.toISOString().split('T')[0];

  const endpoint = `/supervisor/daily-progress/${projectId}?from=${fromDate}&to=${toDate}`;

  console.log(`Fetching progress from ${fromDate} to ${toDate}`);

  const result = await makeRequest('get', endpoint);

  if (result.success) {
    console.log('✅ Progress reports retrieved successfully');
    console.log(`   Project ID: ${result.data.projectId}`);
    console.log(`   Reports Count: ${result.data.count}`);
    if (result.data.data && result.data.data.length > 0) {
      console.log('   Reports:');
      result.data.data.forEach((report, index) => {
        console.log(`      ${index + 1}. Date: ${new Date(report.date).toISOString().split('T')[0]}, Progress: ${report.overallProgress}%`);
      });
    }
    return true;
  } else {
    console.log('❌ Failed to retrieve progress reports');
    console.log('   Error:', result.error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Starting Daily Progress Report End-to-End Tests\n');

  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Submit Daily Progress', fn: testSubmitDailyProgress },
    { name: 'Track Manpower', fn: testTrackManpower },
    { name: 'Log Issues', fn: testLogIssues },
    { name: 'Track Materials', fn: testTrackMaterials },
    { name: 'Upload Photos', fn: testUploadPhotos },
    { name: 'Get Progress by Date', fn: testGetProgressByDate },
    { name: 'Get Progress Range', fn: testGetProgressRange }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`❌ Test "${test.name}" threw an error:`, error.message);
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Daily Progress Report feature is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
}

// Execute tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
