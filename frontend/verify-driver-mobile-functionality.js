/**
 * Driver Mobile App Functionality Verification Script
 * 
 * This script verifies that all driver functionality in the mobile app
 * is correctly integrated and working as expected.
 * 
 * Usage:
 * 1. Start your React Native development server
 * 2. Update the configuration below
 * 3. Run: node verify-driver-mobile-functionality.js
 * 
 * What this script checks:
 * - API service implementations
 * - Screen component integrations
 * - Context provider functionality
 * - Navigation flow
 * - Error handling
 * - Offline capabilities
 */

const fs = require('fs');
const path = require('path');

// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
  PROJECT_ROOT: __dirname,
  SRC_PATH: path.join(__dirname, 'src'),
  
  // Expected driver screens
  DRIVER_SCREENS: [
    'DriverDashboard.tsx',
    'TransportTasksScreen.tsx',
    'TripUpdatesScreen.tsx',
    'DriverAttendanceScreen.tsx',
    'VehicleInfoScreen.tsx',
    'DriverProfileScreen.tsx',
    'DriverNotificationsScreen.tsx'
  ],
  
  // Expected API services
  API_SERVICES: [
    'DriverApiService.ts',
    'AuthService.ts',
    'client.ts'
  ],
  
  // Expected context providers
  CONTEXTS: [
    'DriverContext.tsx',
    'AuthContext.tsx',
    'LocationContext.tsx',
    'OfflineContext.tsx'
  ],
  
  // Expected driver components
  DRIVER_COMPONENTS: [
    'TransportTaskCard.tsx',
    'RouteMapCard.tsx',
    'WorkerManifestCard.tsx',
    'VehicleStatusCard.tsx',
    'PerformanceMetricsCard.tsx',
    'RouteNavigationComponent.tsx',
    'WorkerCheckInForm.tsx'
  ]
};

// ========================================
// VERIFICATION RESULTS
// ========================================
const verificationResults = {
  fileStructure: { passed: [], failed: [], warnings: [] },
  apiIntegration: { passed: [], failed: [], warnings: [] },
  screenImplementation: { passed: [], failed: [], warnings: [] },
  contextIntegration: { passed: [], failed: [], warnings: [] },
  componentIntegration: { passed: [], failed: [], warnings: [] },
  errorHandling: { passed: [], failed: [], warnings: [] },
  offlineSupport: { passed: [], failed: [], warnings: [] },
  navigation: { passed: [], failed: [], warnings: [] }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Check if file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Read file content
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * Check if string contains pattern
 */
function containsPattern(content, pattern) {
  if (typeof pattern === 'string') {
    return content.includes(pattern);
  }
  return pattern.test(content);
}

/**
 * Log verification result
 */
function logResult(category, type, message, details = null) {
  const result = { message, details, timestamp: new Date().toISOString() };
  verificationResults[category][type].push(result);
  
  const icon = type === 'passed' ? '✅' : type === 'failed' ? '❌' : '⚠️';
  console.log(`${icon} ${message}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

// ========================================
// VERIFICATION FUNCTIONS
// ========================================

/**
 * Verify file structure
 */
function verifyFileStructure() {
  console.log('\n📁 VERIFYING FILE STRUCTURE');
  console.log('─'.repeat(50));
  
  // Check driver screens
  const screensPath = path.join(CONFIG.SRC_PATH, 'screens', 'driver');
  CONFIG.DRIVER_SCREENS.forEach(screen => {
    const screenPath = path.join(screensPath, screen);
    if (fileExists(screenPath)) {
      logResult('fileStructure', 'passed', `Driver screen found: ${screen}`);
    } else {
      logResult('fileStructure', 'failed', `Missing driver screen: ${screen}`, screenPath);
    }
  });
  
  // Check API services
  const servicesPath = path.join(CONFIG.SRC_PATH, 'services', 'api');
  CONFIG.API_SERVICES.forEach(service => {
    const servicePath = path.join(servicesPath, service);
    if (fileExists(servicePath)) {
      logResult('fileStructure', 'passed', `API service found: ${service}`);
    } else {
      logResult('fileStructure', 'failed', `Missing API service: ${service}`, servicePath);
    }
  });
  
  // Check context providers
  const contextPath = path.join(CONFIG.SRC_PATH, 'store', 'context');
  CONFIG.CONTEXTS.forEach(context => {
    const contextFilePath = path.join(contextPath, context);
    if (fileExists(contextFilePath)) {
      logResult('fileStructure', 'passed', `Context provider found: ${context}`);
    } else {
      logResult('fileStructure', 'failed', `Missing context provider: ${context}`, contextFilePath);
    }
  });
  
  // Check driver components
  const componentsPath = path.join(CONFIG.SRC_PATH, 'components', 'driver');
  if (fileExists(componentsPath)) {
    CONFIG.DRIVER_COMPONENTS.forEach(component => {
      const componentPath = path.join(componentsPath, component);
      if (fileExists(componentPath)) {
        logResult('fileStructure', 'passed', `Driver component found: ${component}`);
      } else {
        logResult('fileStructure', 'warnings', `Driver component not found: ${component}`, 
          'Component may be implemented inline or with different name');
      }
    });
  } else {
    logResult('fileStructure', 'warnings', 'Driver components directory not found',
      'Components may be in different location or implemented inline');
  }
}

/**
 * Verify API integration
 */
function verifyAPIIntegration() {
  console.log('\n🔌 VERIFYING API INTEGRATION');
  console.log('─'.repeat(50));
  
  // Check DriverApiService implementation
  const driverApiPath = path.join(CONFIG.SRC_PATH, 'services', 'api', 'DriverApiService.ts');
  const driverApiContent = readFile(driverApiPath);
  
  if (driverApiContent) {
    // Check for essential API methods
    const essentialMethods = [
      'getDashboardData',
      'getTodaysTransportTasks',
      'updateTransportTaskStatus',
      'checkInWorker',
      'checkOutWorker',
      'clockIn',
      'clockOut',
      'getAssignedVehicle',
      'getDriverProfile'
    ];
    
    essentialMethods.forEach(method => {
      if (containsPattern(driverApiContent, method)) {
        logResult('apiIntegration', 'passed', `API method implemented: ${method}`);
      } else {
        logResult('apiIntegration', 'failed', `Missing API method: ${method}`);
      }
    });
    
    // Check for proper error handling
    if (containsPattern(driverApiContent, /try\s*{[\s\S]*catch\s*\(/)) {
      logResult('apiIntegration', 'passed', 'Error handling implemented in API service');
    } else {
      logResult('apiIntegration', 'warnings', 'Limited error handling in API service');
    }
    
    // Check for authentication headers
    if (containsPattern(driverApiContent, /Authorization|Bearer/)) {
      logResult('apiIntegration', 'passed', 'Authentication headers configured');
    } else {
      logResult('apiIntegration', 'failed', 'Missing authentication configuration');
    }
    
  } else {
    logResult('apiIntegration', 'failed', 'DriverApiService.ts not found or unreadable');
  }
  
  // Check API client configuration
  const clientPath = path.join(CONFIG.SRC_PATH, 'services', 'api', 'client.ts');
  const clientContent = readFile(clientPath);
  
  if (clientContent) {
    if (containsPattern(clientContent, /axios|fetch/)) {
      logResult('apiIntegration', 'passed', 'HTTP client configured');
    } else {
      logResult('apiIntegration', 'warnings', 'HTTP client implementation unclear');
    }
    
    if (containsPattern(clientContent, /timeout/)) {
      logResult('apiIntegration', 'passed', 'Request timeout configured');
    } else {
      logResult('apiIntegration', 'warnings', 'Request timeout not configured');
    }
  }
}

/**
 * Verify screen implementations
 */
function verifyScreenImplementations() {
  console.log('\n📱 VERIFYING SCREEN IMPLEMENTATIONS');
  console.log('─'.repeat(50));
  
  const screensPath = path.join(CONFIG.SRC_PATH, 'screens', 'driver');
  
  // Check DriverDashboard
  const dashboardPath = path.join(screensPath, 'DriverDashboard.tsx');
  const dashboardContent = readFile(dashboardPath);
  
  if (dashboardContent) {
    const dashboardChecks = [
      { pattern: /driverApiService/, name: 'API service integration' },
      { pattern: /useAuth/, name: 'Authentication context usage' },
      { pattern: /useLocation/, name: 'Location context usage' },
      { pattern: /useOffline/, name: 'Offline context usage' },
      { pattern: /RefreshControl/, name: 'Pull-to-refresh functionality' },
      { pattern: /Alert\.alert/, name: 'User feedback alerts' },
      { pattern: /isLoading/, name: 'Loading state management' }
    ];
    
    dashboardChecks.forEach(check => {
      if (containsPattern(dashboardContent, check.pattern)) {
        logResult('screenImplementation', 'passed', `Dashboard: ${check.name}`);
      } else {
        logResult('screenImplementation', 'warnings', `Dashboard: Missing ${check.name}`);
      }
    });
  }
  
  // Check TransportTasksScreen
  const tasksPath = path.join(screensPath, 'TransportTasksScreen.tsx');
  const tasksContent = readFile(tasksPath);
  
  if (tasksContent) {
    const tasksChecks = [
      { pattern: /getTodaysTransportTasks/, name: 'Transport tasks loading' },
      { pattern: /updateTransportTaskStatus/, name: 'Task status updates' },
      { pattern: /optimizeRoute/, name: 'Route optimization' },
      { pattern: /checkInWorker/, name: 'Worker check-in functionality' },
      { pattern: /ScrollView/, name: 'Scrollable interface' }
    ];
    
    tasksChecks.forEach(check => {
      if (containsPattern(tasksContent, check.pattern)) {
        logResult('screenImplementation', 'passed', `Transport Tasks: ${check.name}`);
      } else {
        logResult('screenImplementation', 'warnings', `Transport Tasks: Missing ${check.name}`);
      }
    });
  }
  
  // Check DriverAttendanceScreen
  const attendancePath = path.join(screensPath, 'DriverAttendanceScreen.tsx');
  const attendanceContent = readFile(attendancePath);
  
  if (attendanceContent) {
    const attendanceChecks = [
      { pattern: /clockIn/, name: 'Clock in functionality' },
      { pattern: /clockOut/, name: 'Clock out functionality' },
      { pattern: /getTodaysAttendance/, name: 'Attendance data loading' },
      { pattern: /Modal/, name: 'Pre/post check modals' },
      { pattern: /getCurrentLocation/, name: 'Location tracking' }
    ];
    
    attendanceChecks.forEach(check => {
      if (containsPattern(attendanceContent, check.pattern)) {
        logResult('screenImplementation', 'passed', `Attendance: ${check.name}`);
      } else {
        logResult('screenImplementation', 'warnings', `Attendance: Missing ${check.name}`);
      }
    });
  }
}

/**
 * Verify context integration
 */
function verifyContextIntegration() {
  console.log('\n🔄 VERIFYING CONTEXT INTEGRATION');
  console.log('─'.repeat(50));
  
  // Check DriverContext
  const driverContextPath = path.join(CONFIG.SRC_PATH, 'store', 'context', 'DriverContext.tsx');
  const driverContextContent = readFile(driverContextPath);
  
  if (driverContextContent) {
    const contextChecks = [
      { pattern: /createContext/, name: 'Context creation' },
      { pattern: /useReducer|useState/, name: 'State management' },
      { pattern: /DriverProvider/, name: 'Provider component' },
      { pattern: /useDriver/, name: 'Custom hook' },
      { pattern: /TransportTask|VehicleInfo/, name: 'Type definitions' }
    ];
    
    contextChecks.forEach(check => {
      if (containsPattern(driverContextContent, check.pattern)) {
        logResult('contextIntegration', 'passed', `Driver Context: ${check.name}`);
      } else {
        logResult('contextIntegration', 'warnings', `Driver Context: Missing ${check.name}`);
      }
    });
    
    // Check if context is properly implemented or just a mock
    if (containsPattern(driverContextContent, /mock|TODO|placeholder/i)) {
      logResult('contextIntegration', 'warnings', 'Driver Context appears to be mock implementation');
    }
  }
  
  // Check App.tsx for context providers
  const appPath = path.join(CONFIG.PROJECT_ROOT, 'App.tsx');
  const appContent = readFile(appPath);
  
  if (appContent) {
    const providerChecks = [
      'AuthProvider',
      'LocationProvider',
      'OfflineProvider',
      'DriverProvider'
    ];
    
    providerChecks.forEach(provider => {
      if (containsPattern(appContent, provider)) {
        logResult('contextIntegration', 'passed', `App.tsx includes: ${provider}`);
      } else {
        logResult('contextIntegration', 'failed', `App.tsx missing: ${provider}`);
      }
    });
  }
}

/**
 * Verify error handling
 */
function verifyErrorHandling() {
  console.log('\n🚨 VERIFYING ERROR HANDLING');
  console.log('─'.repeat(50));
  
  const screensPath = path.join(CONFIG.SRC_PATH, 'screens', 'driver');
  
  CONFIG.DRIVER_SCREENS.forEach(screenFile => {
    const screenPath = path.join(screensPath, screenFile);
    const screenContent = readFile(screenPath);
    
    if (screenContent) {
      const errorChecks = [
        { pattern: /try\s*{[\s\S]*catch/, name: 'Try-catch blocks' },
        { pattern: /Alert\.alert.*[Ee]rror/, name: 'Error alerts' },
        { pattern: /ErrorDisplay|error.*component/i, name: 'Error display component' },
        { pattern: /setError|error.*state/i, name: 'Error state management' },
        { pattern: /isOffline/, name: 'Offline error handling' }
      ];
      
      let hasErrorHandling = false;
      errorChecks.forEach(check => {
        if (containsPattern(screenContent, check.pattern)) {
          hasErrorHandling = true;
        }
      });
      
      if (hasErrorHandling) {
        logResult('errorHandling', 'passed', `${screenFile}: Has error handling`);
      } else {
        logResult('errorHandling', 'warnings', `${screenFile}: Limited error handling`);
      }
    }
  });
}

/**
 * Verify offline support
 */
function verifyOfflineSupport() {
  console.log('\n📶 VERIFYING OFFLINE SUPPORT');
  console.log('─'.repeat(50));
  
  // Check for offline context usage
  const screensPath = path.join(CONFIG.SRC_PATH, 'screens', 'driver');
  
  CONFIG.DRIVER_SCREENS.forEach(screenFile => {
    const screenPath = path.join(screensPath, screenFile);
    const screenContent = readFile(screenPath);
    
    if (screenContent) {
      const offlineChecks = [
        { pattern: /useOffline/, name: 'Offline context usage' },
        { pattern: /isOffline/, name: 'Offline state checking' },
        { pattern: /OfflineIndicator/, name: 'Offline indicator component' },
        { pattern: /disabled.*isOffline/, name: 'Offline button disabling' }
      ];
      
      let hasOfflineSupport = false;
      offlineChecks.forEach(check => {
        if (containsPattern(screenContent, check.pattern)) {
          hasOfflineSupport = true;
        }
      });
      
      if (hasOfflineSupport) {
        logResult('offlineSupport', 'passed', `${screenFile}: Has offline support`);
      } else {
        logResult('offlineSupport', 'warnings', `${screenFile}: No offline support`);
      }
    }
  });
  
  // Check for offline storage
  const packageJsonPath = path.join(CONFIG.PROJECT_ROOT, 'package.json');
  const packageContent = readFile(packageJsonPath);
  
  if (packageContent) {
    if (containsPattern(packageContent, /@react-native-async-storage/)) {
      logResult('offlineSupport', 'passed', 'AsyncStorage dependency found');
    } else {
      logResult('offlineSupport', 'warnings', 'No offline storage dependency found');
    }
  }
}

/**
 * Verify navigation integration
 */
function verifyNavigationIntegration() {
  console.log('\n🧭 VERIFYING NAVIGATION INTEGRATION');
  console.log('─'.repeat(50));
  
  // Check navigation setup
  const navigationPath = path.join(CONFIG.SRC_PATH, 'navigation');
  
  if (fileExists(navigationPath)) {
    logResult('navigation', 'passed', 'Navigation directory exists');
    
    // Check for navigation files
    const navFiles = fs.readdirSync(navigationPath);
    if (navFiles.length > 0) {
      logResult('navigation', 'passed', `Navigation files found: ${navFiles.join(', ')}`);
    }
    
    // Check AppNavigator
    const appNavPath = path.join(navigationPath, 'AppNavigator.tsx');
    const appNavContent = readFile(appNavPath);
    
    if (appNavContent) {
      if (containsPattern(appNavContent, /driver/i)) {
        logResult('navigation', 'passed', 'Driver navigation routes configured');
      } else {
        logResult('navigation', 'warnings', 'Driver navigation routes not found');
      }
    }
  } else {
    logResult('navigation', 'warnings', 'Navigation directory not found');
  }
  
  // Check package.json for navigation dependencies
  const packageJsonPath = path.join(CONFIG.PROJECT_ROOT, 'package.json');
  const packageContent = readFile(packageJsonPath);
  
  if (packageContent) {
    const navDependencies = [
      '@react-navigation/native',
      '@react-navigation/stack',
      '@react-navigation/bottom-tabs'
    ];
    
    navDependencies.forEach(dep => {
      if (containsPattern(packageContent, dep)) {
        logResult('navigation', 'passed', `Navigation dependency: ${dep}`);
      } else {
        logResult('navigation', 'warnings', `Missing navigation dependency: ${dep}`);
      }
    });
  }
}

/**
 * Print comprehensive verification report
 */
function printVerificationReport() {
  console.log('\n\n' + '═'.repeat(80));
  console.log('📊 DRIVER MOBILE APP VERIFICATION REPORT');
  console.log('═'.repeat(80));
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalWarnings = 0;
  
  Object.keys(verificationResults).forEach(category => {
    const results = verificationResults[category];
    totalPassed += results.passed.length;
    totalFailed += results.failed.length;
    totalWarnings += results.warnings.length;
    
    console.log(`\n📋 ${category.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}:`);
    console.log(`   ✅ Passed: ${results.passed.length}`);
    console.log(`   ❌ Failed: ${results.failed.length}`);
    console.log(`   ⚠️  Warnings: ${results.warnings.length}`);
  });
  
  console.log('\n' + '─'.repeat(80));
  console.log(`📊 OVERALL SUMMARY:`);
  console.log(`   ✅ Total Passed: ${totalPassed}`);
  console.log(`   ❌ Total Failed: ${totalFailed}`);
  console.log(`   ⚠️  Total Warnings: ${totalWarnings}`);
  console.log(`   📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed + totalWarnings)) * 100).toFixed(1)}%`);
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('─'.repeat(50));
  
  if (totalFailed > 0) {
    console.log('🔴 CRITICAL ISSUES TO FIX:');
    Object.keys(verificationResults).forEach(category => {
      verificationResults[category].failed.forEach(failure => {
        console.log(`   • ${failure.message}`);
      });
    });
  }
  
  if (totalWarnings > 0) {
    console.log('\n🟡 IMPROVEMENTS RECOMMENDED:');
    Object.keys(verificationResults).forEach(category => {
      verificationResults[category].warnings.slice(0, 5).forEach(warning => {
        console.log(`   • ${warning.message}`);
      });
    });
  }
  
  if (totalFailed === 0 && totalWarnings < 5) {
    console.log('🎉 Excellent! Driver mobile app is well implemented.');
    console.log('✅ Ready for comprehensive API testing.');
  } else if (totalFailed === 0) {
    console.log('✅ Good implementation with minor improvements needed.');
    console.log('🔧 Address warnings for optimal functionality.');
  } else {
    console.log('🔧 Critical issues need to be resolved before testing.');
    console.log('❌ Fix failed items before proceeding with API tests.');
  }
  
  console.log('\n📋 NEXT STEPS:');
  console.log('─'.repeat(50));
  console.log('1. Fix any critical issues (failed items)');
  console.log('2. Run: node test-driver-api-integration.js');
  console.log('3. Test mobile app functionality manually');
  console.log('4. Verify all driver workflows end-to-end');
  
  console.log('\n' + '═'.repeat(80));
  console.log(`🏁 Verification completed at: ${new Date().toISOString()}`);
  console.log('═'.repeat(80));
}

// ========================================
// MAIN EXECUTION
// ========================================

/**
 * Run all verifications
 */
async function runVerification() {
  console.log('═'.repeat(80));
  console.log('🔍 DRIVER MOBILE APP FUNCTIONALITY VERIFICATION');
  console.log('═'.repeat(80));
  console.log(`📱 Project: Construction ERP Mobile`);
  console.log(`📂 Root: ${CONFIG.PROJECT_ROOT}`);
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log('═'.repeat(80));
  
  try {
    verifyFileStructure();
    verifyAPIIntegration();
    verifyScreenImplementations();
    verifyContextIntegration();
    verifyErrorHandling();
    verifyOfflineSupport();
    verifyNavigationIntegration();
    
    printVerificationReport();
    
  } catch (error) {
    console.error('\n💥 Verification Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run verification
runVerification();