import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://localhost:5002/api';
const SUPERVISOR_CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'password123'
};

/**
 * Comprehensive test to check supervisor dashboard data availability
 */
async function testSupervisorDashboardDataAvailability() {
  console.log('🔍 TESTING SUPERVISOR DASHBOARD DATA AVAILABILITY');
  console.log('='.repeat(60));
  console.log(`📧 Email: ${SUPERVISOR_CREDENTIALS.email}`);
  console.log(`🔑 Password: ${SUPERVISOR_CREDENTIALS.password}`);
  console.log('='.repeat(60));

  let supervisorToken = null;
  let supervisorUser = null;

  try {
    // Step 1: Test supervisor login
    console.log('\n🔐 STEP 1: Testing Supervisor Login');
    console.log('-'.repeat(40));
    
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: SUPERVISOR_CREDENTIALS.email,
      password: SUPERVISOR_CREDENTIALS.password
    });

    if (loginResponse.data.success) {
      supervisorToken = loginResponse.data.token;
      supervisorUser = loginResponse.data.user;
      
      console.log('✅ Login successful');
      console.log(`   User ID: ${supervisorUser.id}`);
      console.log(`   Role: ${supervisorUser.role}`);
      console.log(`   Name: ${supervisorUser.fullName || supervisorUser.name || 'N/A'}`);
      console.log(`   Token: ${supervisorToken ? 'Generated' : 'Missing'}`);
    } else {
      throw new Error('Login failed: ' + (loginResponse.data.message || 'Unknown error'));
    }

  } catch (loginError) {
    console.log('❌ Login failed:', loginError.response?.data?.message || loginError.message);
    console.log('\n🔍 TROUBLESHOOTING LOGIN ISSUE:');
    console.log('1. Check if the supervisor account exists in the database');
    console.log('2. Verify the email and password are correct');
    console.log('3. Ensure the user has supervisor role');
    console.log('4. Check if the backend server is running on port 5002');
    return;
  }

  try {
    // Step 2: Test dashboard data endpoint
    console.log('\n📊 STEP 2: Testing Dashboard Data Endpoint');
    console.log('-'.repeat(40));

    const dashboardResponse = await axios.get(`${API_BASE_URL}/supervisor/dashboard`, {
      headers: supervisorToken ? {
        'Authorization': `Bearer ${supervisorToken}`
      } : {},
      timeout: 15000
    });

    if (dashboardResponse.status === 200) {
      console.log('✅ Dashboard endpoint accessible');
      
      const dashboardData = dashboardResponse.data;
      
      // Analyze dashboard data structure
      console.log('\n📋 DASHBOARD DATA STRUCTURE ANALYSIS:');
      console.log('-'.repeat(40));
      
      if (dashboardData.success) {
        console.log('✅ Response format: Valid');
        
        const data = dashboardData.data;
        
        // Check main sections
        console.log('\n🏗️  MAIN SECTIONS:');
        console.log(`   Projects: ${data.projects ? '✅' : '❌'} (${data.projects?.length || 0} projects)`);
        console.log(`   Team Overview: ${data.teamOverview ? '✅' : '❌'}`);
        console.log(`   Task Metrics: ${data.taskMetrics ? '✅' : '❌'}`);
        console.log(`   Attendance Metrics: ${data.attendanceMetrics ? '✅' : '❌'}`);
        console.log(`   Pending Approvals: ${data.pendingApprovals ? '✅' : '❌'}`);
        console.log(`   Alerts: ${data.alerts ? '✅' : '❌'} (${data.alerts?.length || 0} alerts)`);
        console.log(`   Recent Activity: ${data.recentActivity ? '✅' : '❌'} (${data.recentActivity?.length || 0} activities)`);
        console.log(`   Summary: ${data.summary ? '✅' : '❌'}`);

        // Detailed analysis of each section
        if (data.projects && data.projects.length > 0) {
          console.log('\n🏗️  PROJECT DETAILS:');
          data.projects.forEach((project, index) => {
            console.log(`   Project ${index + 1}:`);
            console.log(`     - ID: ${project.id}`);
            console.log(`     - Name: ${project.name || 'N/A'}`);
            console.log(`     - Location: ${project.location || 'N/A'}`);
            console.log(`     - Total Workers: ${project.totalWorkers || 0}`);
            console.log(`     - Present Workers: ${project.presentWorkers || 0}`);
            console.log(`     - Total Tasks: ${project.totalTasks || 0}`);
            console.log(`     - Completed Tasks: ${project.completedTasks || 0}`);
            console.log(`     - Progress: ${project.progressSummary?.overallProgress || 0}%`);
          });
        } else {
          console.log('\n⚠️  NO PROJECTS FOUND');
          console.log('   This could mean:');
          console.log('   - No projects are assigned to this supervisor');
          console.log('   - The supervisor ID in projects table doesn\'t match the user');
          console.log('   - Projects exist but have no workers assigned');
        }

        if (data.teamOverview) {
          console.log('\n👥 TEAM OVERVIEW:');
          console.log(`   Total Members: ${data.teamOverview.totalMembers || 0}`);
          console.log(`   Present Today: ${data.teamOverview.presentToday || 0}`);
          console.log(`   Absent Today: ${data.teamOverview.absentToday || 0}`);
          console.log(`   Late Today: ${data.teamOverview.lateToday || 0}`);
          console.log(`   On Break: ${data.teamOverview.onBreak || 0}`);
        }

        if (data.taskMetrics) {
          console.log('\n📋 TASK METRICS:');
          console.log(`   Total Tasks: ${data.taskMetrics.totalTasks || 0}`);
          console.log(`   Completed: ${data.taskMetrics.completedTasks || 0}`);
          console.log(`   In Progress: ${data.taskMetrics.inProgressTasks || 0}`);
          console.log(`   Queued: ${data.taskMetrics.queuedTasks || 0}`);
          console.log(`   Overdue: ${data.taskMetrics.overdueTasks || 0}`);
        }

        if (data.attendanceMetrics) {
          console.log('\n📊 ATTENDANCE METRICS:');
          console.log(`   Attendance Rate: ${data.attendanceMetrics.attendanceRate || 0}%`);
          console.log(`   On-Time Rate: ${data.attendanceMetrics.onTimeRate || 0}%`);
          console.log(`   Avg Working Hours: ${data.attendanceMetrics.averageWorkingHours || 0}h`);
        }

        if (data.pendingApprovals) {
          console.log('\n⏳ PENDING APPROVALS:');
          console.log(`   Leave Requests: ${data.pendingApprovals.leaveRequests || 0}`);
          console.log(`   Material Requests: ${data.pendingApprovals.materialRequests || 0}`);
          console.log(`   Tool Requests: ${data.pendingApprovals.toolRequests || 0}`);
          console.log(`   Urgent: ${data.pendingApprovals.urgent || 0}`);
          console.log(`   Total: ${data.pendingApprovals.total || 0}`);
        }

        if (data.summary) {
          console.log('\n📈 SUMMARY:');
          console.log(`   Total Projects: ${data.summary.totalProjects || 0}`);
          console.log(`   Total Workers: ${data.summary.totalWorkers || 0}`);
          console.log(`   Total Tasks: ${data.summary.totalTasks || 0}`);
          console.log(`   Overall Progress: ${data.summary.overallProgress || 0}%`);
          console.log(`   Last Updated: ${data.summary.lastUpdated || 'N/A'}`);
          console.log(`   Date: ${data.summary.date || 'N/A'}`);
        }

        // Data availability assessment
        console.log('\n🎯 DATA AVAILABILITY ASSESSMENT:');
        console.log('-'.repeat(40));
        
        const hasProjects = data.projects && data.projects.length > 0;
        const hasWorkers = data.summary && data.summary.totalWorkers > 0;
        const hasTasks = data.summary && data.summary.totalTasks > 0;
        const hasAttendance = data.teamOverview && data.teamOverview.totalMembers > 0;

        if (hasProjects && hasWorkers && hasTasks) {
          console.log('✅ DASHBOARD DATA IS FULLY AVAILABLE');
          console.log('   - Projects are assigned to supervisor');
          console.log('   - Workers are assigned to projects');
          console.log('   - Tasks are assigned to workers');
          console.log('   - Dashboard is ready for use');
        } else if (hasProjects && hasWorkers) {
          console.log('⚠️  DASHBOARD DATA IS PARTIALLY AVAILABLE');
          console.log('   - Projects and workers exist');
          console.log('   - Missing task assignments');
          console.log('   - Dashboard will show limited data');
        } else if (hasProjects) {
          console.log('⚠️  DASHBOARD DATA IS MINIMAL');
          console.log('   - Projects exist but no workers assigned');
          console.log('   - Dashboard will show empty metrics');
        } else {
          console.log('❌ DASHBOARD DATA IS NOT AVAILABLE');
          console.log('   - No projects assigned to this supervisor');
          console.log('   - Dashboard will show empty state');
        }

      } else {
        console.log('❌ Response format: Invalid');
        console.log('   Error:', dashboardData.message || 'Unknown error');
      }

    } else {
      throw new Error(`Unexpected status code: ${dashboardResponse.status}`);
    }

  } catch (dashboardError) {
    console.log('❌ Dashboard endpoint failed:', dashboardError.response?.data?.message || dashboardError.message);
    
    if (dashboardError.response?.status === 401) {
      console.log('\n🔍 AUTHENTICATION ISSUE:');
      console.log('   - Token may be invalid or expired');
      console.log('   - Check if auth middleware is properly configured');
    } else if (dashboardError.response?.status === 500) {
      console.log('\n🔍 SERVER ERROR:');
      console.log('   - Database connection issue');
      console.log('   - Missing required data in database');
      console.log('   - Check server logs for detailed error');
    }
  }

  // Step 3: Test related endpoints
  console.log('\n🔗 STEP 3: Testing Related Endpoints');
  console.log('-'.repeat(40));

  const relatedEndpoints = [
    { name: 'Projects', url: '/supervisor/projects' },
    { name: 'Workers Assigned', url: '/supervisor/workers-assigned', params: { projectId: 1, date: new Date().toISOString().split('T')[0] } },
    { name: 'Late/Absent Workers', url: '/supervisor/late-absent-workers', params: { projectId: 1 } },
    { name: 'Attendance Monitoring', url: '/supervisor/attendance-monitoring', params: { projectId: 1 } }
  ];

  for (const endpoint of relatedEndpoints) {
    try {
      const config = {
        method: 'get',
        url: `${API_BASE_URL}${endpoint.url}`,
        timeout: 10000
      };

      if (endpoint.params) {
        config.params = endpoint.params;
      }

      if (supervisorToken) {
        config.headers = { 'Authorization': `Bearer ${supervisorToken}` };
      }

      const response = await axios(config);
      
      if (response.status === 200) {
        console.log(`✅ ${endpoint.name}: Available`);
        
        // Quick data check
        if (response.data && typeof response.data === 'object') {
          const dataKeys = Object.keys(response.data);
          console.log(`   Data keys: ${dataKeys.join(', ')}`);
        }
      } else {
        console.log(`⚠️  ${endpoint.name}: Unexpected status ${response.status}`);
      }

    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.response?.data?.message || error.message}`);
    }
  }

  // Final recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('-'.repeat(40));
  console.log('1. If no data is available, check database setup:');
  console.log('   - Ensure supervisor user exists with correct role');
  console.log('   - Verify projects are assigned to supervisor');
  console.log('   - Check worker-task assignments exist');
  console.log('2. If partial data exists, consider adding sample data');
  console.log('3. Check server logs for any database connection issues');
  console.log('4. Verify all required database tables exist and have data');

  console.log('\n🏁 TEST COMPLETED');
  console.log('='.repeat(60));
}

// Run the test
testSupervisorDashboardDataAvailability().catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
});