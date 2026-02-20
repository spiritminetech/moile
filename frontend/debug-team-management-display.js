/**
 * Debug script to test Team Management display issues
 * This will help identify why only 2 projects show instead of 3
 */

const axios = require('axios');

const API_BASE_URL = 'http://192.168.1.100:3000/api';
const SUPERVISOR_CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'password123'
};

async function debugTeamManagementDisplay() {
  console.log('🔍 DEBUGGING TEAM MANAGEMENT DISPLAY ISSUE');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Login as supervisor
    console.log('🔐 STEP 1: Supervisor Login');
    console.log('-'.repeat(40));
    
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, SUPERVISOR_CREDENTIALS);
    const supervisorToken = loginResponse.data.token;
    
    console.log('✅ Login successful');
    console.log(`   Token: ${supervisorToken ? 'Generated' : 'Missing'}`);
    
    // Step 2: Get dashboard data
    console.log('\n📊 STEP 2: Get Dashboard Data');
    console.log('-'.repeat(40));
    
    const dashboardResponse = await axios.get(`${API_BASE_URL}/supervisor/dashboard`, {
      headers: supervisorToken ? {
        'Authorization': `Bearer ${supervisorToken}`
      } : {}
    });
    
    const dashboardData = dashboardResponse.data.data || dashboardResponse.data;
    
    console.log('✅ Dashboard data received');
    console.log(`   Projects count: ${dashboardData.projects?.length || 0}`);
    
    // Step 3: Analyze project data structure
    console.log('\n🏗️  STEP 3: Project Data Analysis');
    console.log('-'.repeat(40));
    
    if (dashboardData.projects && dashboardData.projects.length > 0) {
      dashboardData.projects.forEach((project, index) => {
        console.log(`\n   Project ${index + 1}:`);
        console.log(`     - ID: ${project.id}`);
        console.log(`     - Name: ${project.name}`);
        console.log(`     - Workforce Count: ${project.workforceCount || 0}`);
        console.log(`     - Attendance Summary:`, project.attendanceSummary);
        console.log(`     - Progress Summary:`, project.progressSummary);
        
        // Check if all required fields are present
        const requiredFields = ['id', 'name', 'workforceCount', 'attendanceSummary', 'progressSummary'];
        const missingFields = requiredFields.filter(field => !project[field]);
        
        if (missingFields.length > 0) {
          console.log(`     ⚠️  Missing fields: ${missingFields.join(', ')}`);
        } else {
          console.log(`     ✅ All required fields present`);
        }
      });
    } else {
      console.log('   ❌ No projects found in dashboard data');
    }
    
    // Step 4: Test mobile app data structure compatibility
    console.log('\n📱 STEP 4: Mobile App Compatibility Check');
    console.log('-'.repeat(40));
    
    if (dashboardData.projects) {
      const mobileCompatibleProjects = dashboardData.projects.map(project => ({
        id: project.id,
        name: project.name,
        workforceCount: project.workforceCount || 0,
        attendanceSummary: {
          present: project.attendanceSummary?.present || 0,
          absent: project.attendanceSummary?.absent || 0,
          late: project.attendanceSummary?.late || 0
        },
        progressSummary: {
          overallProgress: project.progressSummary?.overallProgress || 0
        }
      }));
      
      console.log(`   ✅ Mobile compatible projects: ${mobileCompatibleProjects.length}`);
      console.log('   📋 Project summary for mobile:');
      
      mobileCompatibleProjects.forEach((project, index) => {
        console.log(`     ${index + 1}. ${project.name} (${project.workforceCount} workers, ${project.progressSummary.overallProgress}% progress)`);
      });
      
      // Check if any projects have zero workforce (might cause display issues)
      const projectsWithNoWorkers = mobileCompatibleProjects.filter(p => p.workforceCount === 0);
      if (projectsWithNoWorkers.length > 0) {
        console.log(`   ⚠️  Projects with no workers: ${projectsWithNoWorkers.length}`);
        projectsWithNoWorkers.forEach(p => {
          console.log(`       - ${p.name} (ID: ${p.id})`);
        });
      }
      
    } else {
      console.log('   ❌ No projects data available for mobile compatibility check');
    }
    
    // Step 5: Recommendations
    console.log('\n💡 STEP 5: Display Issue Analysis');
    console.log('-'.repeat(40));
    
    if (dashboardData.projects && dashboardData.projects.length >= 3) {
      console.log('   ✅ Backend returns 3 projects correctly');
      console.log('   🔍 Issue is likely in the mobile app display:');
      console.log('       1. Check ScrollView maxHeight in TeamManagementCard');
      console.log('       2. Verify all projects have required data fields');
      console.log('       3. Check if any filtering is applied in the component');
      console.log('       4. Ensure project cards have consistent height');
    } else {
      console.log('   ❌ Backend issue: Not returning 3 projects');
      console.log('   🔧 Check supervisor project assignments in database');
    }
    
    console.log('\n🎯 CONCLUSION');
    console.log('-'.repeat(40));
    console.log(`   Backend projects: ${dashboardData.projects?.length || 0}`);
    console.log(`   Expected projects: 3`);
    console.log(`   Status: ${dashboardData.projects?.length >= 3 ? 'Backend OK - Frontend Issue' : 'Backend Issue'}`);
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the debug test
debugTeamManagementDisplay().catch(error => {
  console.error('❌ Debug execution failed:', error.message);
  process.exit(1);
});