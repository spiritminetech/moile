import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bold');
  console.log('='.repeat(70));
}

function logResult(apiName, available, endpoint = '') {
  const status = available ? '✅' : '❌';
  const statusText = available ? 'AVAILABLE' : 'MISSING';
  const statusColor = available ? 'green' : 'red';
  
  log(`${status} ${apiName}`, statusColor);
  if (endpoint) {
    log(`   Endpoint: ${endpoint}`, 'blue');
  }
  log(`   Status: ${statusText}`, statusColor);
}

async function checkEndpoint(method, endpoint) {
  try {
    const config = {
      method: method.toLowerCase(),
      url: `${API_BASE_URL}${endpoint}`,
      timeout: 5000,
      validateStatus: (status) => status < 500 // Accept any status < 500 as "endpoint exists"
    };
    
    const response = await axios(config);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('⚠️  Server is not running. Please start the backend server first.', 'yellow');
      process.exit(1);
    }
    // 404 means endpoint doesn't exist
    if (error.response && error.response.status === 404) {
      return false;
    }
    // Other errors (401, 403, etc.) mean endpoint exists but requires auth/data
    return true;
  }
}

async function verifyAPIs() {
  log('🔍 SUPERVISOR API VERIFICATION TOOL', 'bold');
  log('Checking availability of all supervisor APIs...', 'blue');
  
  const results = {
    available: [],
    missing: []
  };

  // ========================================
  // 1. DAILY PROGRESS APIs
  // ========================================
  logSection('📊 DAILY PROGRESS APIs');
  
  const dailyProgressAPIs = [
    {
      name: 'Submit Daily Progress',
      method: 'POST',
      endpoint: '/supervisor/daily-progress'
    },
    {
      name: 'Upload Photos & Videos',
      method: 'POST',
      endpoint: '/supervisor/daily-progress/photos'
    },
    {
      name: 'Track Manpower Usage',
      method: 'POST',
      endpoint: '/supervisor/daily-progress/manpower'
    },
    {
      name: 'Log Issues & Safety',
      method: 'POST',
      endpoint: '/supervisor/daily-progress/issues'
    },
    {
      name: 'Track Material Consumption',
      method: 'POST',
      endpoint: '/supervisor/daily-progress/materials'
    },
    {
      name: 'View Progress Report (Single Day)',
      method: 'GET',
      endpoint: '/supervisor/daily-progress/1/2024-01-01'
    },
    {
      name: 'View Progress Report (Date Range)',
      method: 'GET',
      endpoint: '/supervisor/daily-progress/1'
    }
  ];

  for (const api of dailyProgressAPIs) {
    const available = await checkEndpoint(api.method, api.endpoint);
    logResult(api.name, available, `${api.method} ${api.endpoint}`);
    
    if (available) {
      results.available.push(api);
    } else {
      results.missing.push(api);
    }
  }

  // ========================================
  // 2. REQUESTS & APPROVALS APIs
  // ========================================
  logSection('📋 REQUESTS & APPROVALS APIs');
  
  const requestsAPIs = [
    {
      name: 'Get Pending Leave Requests',
      method: 'GET',
      endpoint: '/supervisor/pending-leave-requests'
    },
    {
      name: 'Approve Leave Request',
      method: 'POST',
      endpoint: '/supervisor/approve-leave/1'
    },
    {
      name: 'Get Pending Advance Requests',
      method: 'GET',
      endpoint: '/supervisor/pending-advance-requests'
    },
    {
      name: 'Approve Advance Request',
      method: 'POST',
      endpoint: '/supervisor/approve-advance/1'
    },
    {
      name: 'Get Pending Material Requests',
      method: 'GET',
      endpoint: '/supervisor/pending-material-requests'
    },
    {
      name: 'Approve Material Request',
      method: 'POST',
      endpoint: '/supervisor/approve-material/1'
    },
    {
      name: 'Get Pending Tool Requests',
      method: 'GET',
      endpoint: '/supervisor/pending-tool-requests'
    },
    {
      name: 'Approve Tool Request',
      method: 'POST',
      endpoint: '/supervisor/approve-tool/1'
    },
    {
      name: 'Escalate Issue',
      method: 'POST',
      endpoint: '/supervisor/escalate-issue/1'
    }
  ];

  for (const api of requestsAPIs) {
    const available = await checkEndpoint(api.method, api.endpoint);
    logResult(api.name, available, `${api.method} ${api.endpoint}`);
    
    if (available) {
      results.available.push(api);
    } else {
      results.missing.push(api);
    }
  }

  // ========================================
  // 3. DASHBOARD APIs
  // ========================================
  logSection('📈 DASHBOARD APIs');
  
  const dashboardAPIs = [
    {
      name: 'Get Dashboard Data',
      method: 'GET',
      endpoint: '/supervisor/dashboard'
    },
    {
      name: 'Get Pending Approvals Summary',
      method: 'GET',
      endpoint: '/supervisor/pending-approvals'
    }
  ];

  for (const api of dashboardAPIs) {
    const available = await checkEndpoint(api.method, api.endpoint);
    logResult(api.name, available, `${api.method} ${api.endpoint}`);
    
    if (available) {
      results.available.push(api);
    } else {
      results.missing.push(api);
    }
  }

  // ========================================
  // SUMMARY
  // ========================================
  logSection('📊 VERIFICATION SUMMARY');
  
  const totalAPIs = results.available.length + results.missing.length;
  const availableCount = results.available.length;
  const missingCount = results.missing.length;
  const percentage = ((availableCount / totalAPIs) * 100).toFixed(1);
  
  log(`\nTotal APIs Checked: ${totalAPIs}`, 'blue');
  log(`✅ Available: ${availableCount} (${percentage}%)`, 'green');
  log(`❌ Missing: ${missingCount} (${(100 - percentage).toFixed(1)}%)`, 'red');
  
  if (missingCount > 0) {
    log('\n⚠️  MISSING APIs:', 'yellow');
    results.missing.forEach(api => {
      log(`   • ${api.name} - ${api.method} ${api.endpoint}`, 'red');
    });
  } else {
    log('\n🎉 All APIs are available!', 'green');
  }
  
  // ========================================
  // DETAILED BREAKDOWN
  // ========================================
  logSection('📋 DETAILED BREAKDOWN BY CATEGORY');
  
  const dailyProgressCount = dailyProgressAPIs.filter(api => 
    results.available.some(a => a.endpoint === api.endpoint)
  ).length;
  
  const requestsCount = requestsAPIs.filter(api => 
    results.available.some(a => a.endpoint === api.endpoint)
  ).length;
  
  const dashboardCount = dashboardAPIs.filter(api => 
    results.available.some(a => a.endpoint === api.endpoint)
  ).length;
  
  log(`\n1. Daily Progress APIs: ${dailyProgressCount}/${dailyProgressAPIs.length}`, 
    dailyProgressCount === dailyProgressAPIs.length ? 'green' : 'yellow');
  
  log(`2. Requests & Approvals APIs: ${requestsCount}/${requestsAPIs.length}`, 
    requestsCount === requestsAPIs.length ? 'green' : 'yellow');
  
  log(`3. Dashboard APIs: ${dashboardCount}/${dashboardAPIs.length}`, 
    dashboardCount === dashboardAPIs.length ? 'green' : 'yellow');
  
  console.log('\n' + '='.repeat(70) + '\n');
}

// Run verification
verifyAPIs().catch(error => {
  log(`\n❌ Error during verification: ${error.message}`, 'red');
  process.exit(1);
});
