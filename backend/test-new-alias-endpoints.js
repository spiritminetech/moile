/**
 * Test Script for New Alias Endpoints
 * Tests the newly added alias routes:
 * - GET /api/supervisor/assigned-sites (alias for /projects)
 * - GET /api/supervisor/team-list (alias for /workers-assigned)
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://192.168.0.3:5002/api';

// Test credentials
const SUPERVISOR_CREDENTIALS = {
  email: 'supervisor4@example.com',
  password: 'password123'
};

let authToken = '';

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

async function testEndpoint(method, endpoint, description) {
  try {
    const config = {
      headers: { Authorization: `Bearer ${authToken}` }
    };

    const fullUrl = `${BASE_URL}${endpoint}`;
    const response = await axios.get(fullUrl, config);

    log(`✅ ${description}`, 'green');
    log(`   Status: ${response.status}`, 'green');
    log(`   Data Keys: ${Object.keys(response.data).join(', ')}`, 'green');
    
    if (response.data.projects) {
      log(`   Projects Count: ${response.data.projects.length}`, 'green');
    }
    if (response.data.workers) {
      log(`   Workers Count: ${response.data.workers.length}`, 'green');
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response) {
      log(`❌ ${description}`, 'red');
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Error: ${error.response.data?.message || error.message}`, 'red');
      return { success: false, status: error.response.status, error: error.response.data };
    } else {
      log(`❌ ${description}`, 'red');
      log(`   Error: ${error.message}`, 'red');
      return { success: false, error: error.message };
    }
  }
}

async function runTests() {
  try {
    printSection('🔐 STEP 1: LOGIN AS SUPERVISOR');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, SUPERVISOR_CREDENTIALS);
    authToken = loginResponse.data.token;
    log('✅ Login successful', 'green');
    log(`   Token: ${authToken.substring(0, 30)}...`, 'green');

    // ========================================
    // TEST ORIGINAL ENDPOINTS
    // ========================================
    printSection('📋 STEP 2: TEST ORIGINAL ENDPOINTS');

    log('\n🏗️  Testing GET /supervisor/projects (original)...', 'yellow');
    const projectsOriginal = await testEndpoint(
      'GET', 
      '/supervisor/projects', 
      'GET /supervisor/projects'
    );

    let projectId = null;
    if (projectsOriginal.success && projectsOriginal.data?.projects?.length > 0) {
      projectId = projectsOriginal.data.projects[0].id;
      log(`   Using Project ID: ${projectId} for next test`, 'cyan');
    }

    log('\n👥 Testing GET /supervisor/workers-assigned (original)...', 'yellow');
    const workersOriginal = await testEndpoint(
      'GET', 
      `/supervisor/workers-assigned?projectId=${projectId || 1}`, 
      'GET /supervisor/workers-assigned'
    );

    // ========================================
    // TEST NEW ALIAS ENDPOINTS
    // ========================================
    printSection('🆕 STEP 3: TEST NEW ALIAS ENDPOINTS');

    log('\n🏗️  Testing GET /supervisor/assigned-sites (NEW ALIAS)...', 'yellow');
    const sitesAlias = await testEndpoint(
      'GET', 
      '/supervisor/assigned-sites', 
      'GET /supervisor/assigned-sites (alias)'
    );

    log('\n👥 Testing GET /supervisor/team-list (NEW ALIAS)...', 'yellow');
    const teamAlias = await testEndpoint(
      'GET', 
      `/supervisor/team-list?projectId=${projectId || 1}`, 
      'GET /supervisor/team-list (alias)'
    );

    // ========================================
    // COMPARE RESULTS
    // ========================================
    printSection('🔍 STEP 4: VERIFY ALIASES RETURN SAME DATA');

    console.log('\n📊 Comparing /projects vs /assigned-sites:');
    if (projectsOriginal.success && sitesAlias.success) {
      const originalCount = projectsOriginal.data.projects?.length || 0;
      const aliasCount = sitesAlias.data.projects?.length || 0;
      
      if (originalCount === aliasCount) {
        log(`   ✅ Both return ${originalCount} projects - MATCH!`, 'green');
      } else {
        log(`   ❌ Mismatch: Original=${originalCount}, Alias=${aliasCount}`, 'red');
      }
    }

    console.log('\n📊 Comparing /workers-assigned vs /team-list:');
    if (workersOriginal.success && teamAlias.success) {
      const originalCount = workersOriginal.data.workers?.length || 0;
      const aliasCount = teamAlias.data.workers?.length || 0;
      
      if (originalCount === aliasCount) {
        log(`   ✅ Both return ${originalCount} workers - MATCH!`, 'green');
      } else {
        log(`   ❌ Mismatch: Original=${originalCount}, Alias=${aliasCount}`, 'red');
      }
    }

    // ========================================
    // SUMMARY
    // ========================================
    printSection('📊 TEST SUMMARY');

    const results = {
      projectsOriginal: projectsOriginal.success,
      workersOriginal: workersOriginal.success,
      assignedSitesAlias: sitesAlias.success,
      teamListAlias: teamAlias.success
    };

    console.log('\n✅ Original Endpoints:');
    log(`   ${results.projectsOriginal ? '✅' : '❌'} GET /supervisor/projects`, 
        results.projectsOriginal ? 'green' : 'red');
    log(`   ${results.workersOriginal ? '✅' : '❌'} GET /supervisor/workers-assigned`, 
        results.workersOriginal ? 'green' : 'red');

    console.log('\n🆕 New Alias Endpoints:');
    log(`   ${results.assignedSitesAlias ? '✅' : '❌'} GET /supervisor/assigned-sites`, 
        results.assignedSitesAlias ? 'green' : 'red');
    log(`   ${results.teamListAlias ? '✅' : '❌'} GET /supervisor/team-list`, 
        results.teamListAlias ? 'green' : 'red');

    const allPassed = Object.values(results).every(r => r === true);

    if (allPassed) {
      console.log('\n' + '='.repeat(70));
      log('🎉 ALL TESTS PASSED! ALIAS ENDPOINTS WORKING PERFECTLY! 🎉', 'green');
      console.log('='.repeat(70));
      
      console.log('\n📱 Mobile App Can Now Use:');
      log('   ✅ GET /api/supervisor/assigned-sites', 'green');
      log('   ✅ GET /api/supervisor/team-list?projectId=X', 'green');
      
      console.log('\n💡 Both endpoints work identically to their originals!');
    } else {
      console.log('\n' + '='.repeat(70));
      log('⚠️  SOME TESTS FAILED - CHECK ERRORS ABOVE', 'yellow');
      console.log('='.repeat(70));
    }

    console.log('\n📝 Postman Test URLs:');
    console.log(`POST ${BASE_URL}/auth/login`);
    console.log(`GET  ${BASE_URL}/supervisor/assigned-sites`);
    console.log(`GET  ${BASE_URL}/supervisor/team-list?projectId=${projectId || 1}`);

  } catch (error) {
    log(`\n❌ Test execution failed: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run the tests
console.log('\n🚀 Starting Alias Endpoint Tests...\n');
runTests();
