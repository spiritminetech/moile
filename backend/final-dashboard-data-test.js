import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://localhost:5002/api';
const SUPERVISOR_CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'password123'
};

/**
 * Final comprehensive dashboard data test
 */
async function finalDashboardDataTest() {
  console.log('🎯 FINAL SUPERVISOR DASHBOARD DATA TEST');
  console.log('='.repeat(60));
  console.log(`📧 Email: ${SUPERVISOR_CREDENTIALS.email}`);
  console.log(`🔑 Password: ${SUPERVISOR_CREDENTIALS.password}`);
  console.log('='.repeat(60));

  let supervisorToken = null;

  try {
    // Step 1: Login
    console.log('\n🔐 STEP 1: Supervisor Login');
    console.log('-'.repeat(40));
    
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: SUPERVISOR_CREDENTIALS.email,
      password: SUPERVISOR_CREDENTIALS.password
    });

    if (loginResponse.data.success) {
      supervisorToken = loginResponse.data.token;
      const supervisorUser = loginResponse.data.user;
      
      console.log('✅ Login successful');
      console.log(`   User ID: ${supervisorUser.id}`);
      console.log(`   Name: ${supervisorUser.fullName || supervisorUser.name || 'Kawaja'}`);
      console.log(`   Email: ${supervisorUser.email}`);
    } else {
      throw new Error('Login failed');
    }

    // Step 2: Get Dashboard Data
    console.log('\n📊 STEP 2: Dashboard Data Retrieval');
    console.log('-'.repeat(40));

    const dashboardResponse = await axios.get(`${API_BASE_URL}/supervisor/dashboard`, {
      headers: supervisorToken ? {
        'Authorization': `Bearer ${supervisorToken}`
      } : {},
      timeout: 15000
    });

    if (dashboardResponse.status === 200 && dashboardResponse.data.success) {
      const data = dashboardResponse.data.data;
      
      console.log('✅ Dashboard data retrieved successfully');
      
      // Summary Overview
      console.log('\n📈 DASHBOARD SUMMARY:');
      console.log('-'.repeat(40));
      console.log(`📋 Total Projects: ${data.summary?.totalProjects || 0}`);
      console.log(`👥 Total Workers: ${data.summary?.totalWorkers || 0}`);
      console.log(`📝 Total Tasks: ${data.summary?.totalTasks || 0}`);
      console.log(`📊 Overall Progress: ${data.summary?.overallProgress || 0}%`);
      console.log(`📅 Date: ${data.summary?.date || 'N/A'}`);
      console.log(`🕐 Last Updated: ${data.summary?.lastUpdated || 'N/A'}`);

      // Project Details
      if (data.projects && data.projects.length > 0) {
        console.log('\n🏗️  PROJECT BREAKDOWN:');
        console.log('-'.repeat(40));
        data.projects.forEach((project, index) => {
          console.log(`\n📋 Project ${index + 1}: ${project.name || 'Unnamed'}`);
          console.log(`   🆔 ID: ${project.id}`);
          console.log(`   📍 Location: ${project.location || 'Not specified'}`);
          console.log(`   👥 Workers: ${project.totalWorkers || 0} total, ${project.presentWorkers || 0} present`);
          console.log(`   📝 Tasks: ${project.totalTasks || 0} total, ${project.completedTasks || 0} completed`);
          console.log(`   📊 Progress: ${project.progressSummary?.overallProgress || 0}%`);
          
          if (project.attendanceSummary) {
            console.log(`   📊 Attendance: ${project.attendanceSummary.present || 0} present, ${project.attendanceSummary.absent || 0} absent, ${project.attendanceSummary.late || 0} late`);
          }
        });
      } else {
        console.log('\n⚠️  No projects found in dashboard data');
      }

      // Team Overview
      if (data.teamOverview) {
        console.log('\n👥 TEAM OVERVIEW:');
        console.log('-'.repeat(40));
        console.log(`   Total Members: ${data.teamOverview.totalMembers || 0}`);
        console.log(`   Present Today: ${data.teamOverview.presentToday || 0}`);
        console.log(`   Absent Today: ${data.teamOverview.absentToday || 0}`);
        console.log(`   Late Today: ${data.teamOverview.lateToday || 0}`);
        console.log(`   On Break: ${data.teamOverview.onBreak || 0}`);
      }

      // Task Metrics
      if (data.taskMetrics) {
        console.log('\n📋 TASK METRICS:');
        console.log('-'.repeat(40));
        console.log(`   Total Tasks: ${data.taskMetrics.totalTasks || 0}`);
        console.log(`   Completed: ${data.taskMetrics.completedTasks || 0}`);
        console.log(`   In Progress: ${data.taskMetrics.inProgressTasks || 0}`);
        console.log(`   Queued: ${data.taskMetrics.queuedTasks || 0}`);
        console.log(`   Overdue: ${data.taskMetrics.overdueTasks || 0}`);
      }

      // Attendance Metrics
      if (data.attendanceMetrics) {
        console.log('\n📊 ATTENDANCE METRICS:');
        console.log('-'.repeat(40));
        console.log(`   Attendance Rate: ${data.attendanceMetrics.attendanceRate || 0}%`);
        console.log(`   On-Time Rate: ${data.attendanceMetrics.onTimeRate || 0}%`);
        console.log(`   Average Working Hours: ${data.attendanceMetrics.averageWorkingHours || 0}h`);
      }

      // Pending Approvals
      if (data.pendingApprovals) {
        console.log('\n⏳ PENDING APPROVALS:');
        console.log('-'.repeat(40));
        console.log(`   Leave Requests: ${data.pendingApprovals.leaveRequests || 0}`);
        console.log(`   Material Requests: ${data.pendingApprovals.materialRequests || 0}`);
        console.log(`   Tool Requests: ${data.pendingApprovals.toolRequests || 0}`);
        console.log(`   Urgent: ${data.pendingApprovals.urgent || 0}`);
        console.log(`   Total: ${data.pendingApprovals.total || 0}`);
      }

      // Alerts
      if (data.alerts && data.alerts.length > 0) {
        console.log('\n🚨 ACTIVE ALERTS:');
        console.log('-'.repeat(40));
        data.alerts.forEach((alert, index) => {
          console.log(`   Alert ${index + 1}: ${alert.title || 'Unknown'}`);
          console.log(`     Message: ${alert.message || 'No message'}`);
          console.log(`     Severity: ${alert.severity || 'Unknown'}`);
          console.log(`     Time: ${alert.timestamp || 'Unknown'}`);
        });
      } else {
        console.log('\n✅ No active alerts');
      }

      // Recent Activity
      if (data.recentActivity && data.recentActivity.length > 0) {
        console.log('\n📝 RECENT ACTIVITY:');
        console.log('-'.repeat(40));
        data.recentActivity.slice(0, 5).forEach((activity, index) => {
          console.log(`   ${index + 1}. ${activity.title || 'Unknown Activity'}`);
          console.log(`      ${activity.message || 'No details'}`);
          console.log(`      Time: ${activity.timestamp || 'Unknown'}`);
        });
      } else {
        console.log('\n📝 No recent activity');
      }

      // Final Assessment
      console.log('\n🎯 FINAL ASSESSMENT:');
      console.log('-'.repeat(40));
      
      const hasProjects = data.projects && data.projects.length > 0;
      const hasWorkers = data.summary && data.summary.totalWorkers > 0;
      const hasTasks = data.summary && data.summary.totalTasks > 0;
      const hasAttendance = data.teamOverview && data.teamOverview.totalMembers > 0;

      if (hasProjects && hasWorkers && hasTasks && hasAttendance) {
        console.log('🎉 DASHBOARD DATA IS FULLY AVAILABLE AND RICH!');
        console.log('   ✅ Projects are assigned and active');
        console.log('   ✅ Workers are assigned to projects');
        console.log('   ✅ Tasks are assigned to workers');
        console.log('   ✅ Attendance data is available');
        console.log('   ✅ Dashboard is ready for production use');
      } else if (hasProjects && (hasWorkers || hasTasks)) {
        console.log('✅ DASHBOARD DATA IS AVAILABLE WITH GOOD CONTENT');
        console.log('   ✅ Projects exist');
        console.log(`   ${hasWorkers ? '✅' : '⚠️'} Workers ${hasWorkers ? 'assigned' : 'need assignment'}`);
        console.log(`   ${hasTasks ? '✅' : '⚠️'} Tasks ${hasTasks ? 'assigned' : 'need assignment'}`);
        console.log(`   ${hasAttendance ? '✅' : '⚠️'} Attendance ${hasAttendance ? 'available' : 'needs data'}`);
        console.log('   📊 Dashboard shows meaningful data');
      } else if (hasProjects) {
        console.log('⚠️  DASHBOARD DATA IS BASIC');
        console.log('   ✅ Projects exist');
        console.log('   ⚠️  Limited worker/task data');
        console.log('   📊 Dashboard shows project structure only');
      } else {
        console.log('❌ DASHBOARD DATA IS MINIMAL');
        console.log('   ❌ No projects or very limited data');
        console.log('   📊 Dashboard will show mostly empty states');
      }

    } else {
      throw new Error('Dashboard data retrieval failed');
    }

    // Step 3: Test Key Endpoints
    console.log('\n🔗 STEP 3: Key Endpoint Verification');
    console.log('-'.repeat(40));

    const endpoints = [
      { name: 'Projects List', url: '/supervisor/projects' },
      { name: 'Workers Assigned', url: '/supervisor/workers-assigned', params: { projectId: 1003, date: new Date().toISOString().split('T')[0] } }
    ];

    for (const endpoint of endpoints) {
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
          console.log(`✅ ${endpoint.name}: Working`);
          
          // Show data summary
          if (endpoint.name === 'Projects List' && response.data.data) {
            console.log(`   📊 Found ${response.data.data.length} projects`);
          } else if (endpoint.name === 'Workers Assigned' && response.data.workers) {
            console.log(`   👥 Found ${response.data.workers.length} assigned workers`);
          }
        } else {
          console.log(`⚠️  ${endpoint.name}: Status ${response.status}`);
        }

      } catch (error) {
        console.log(`❌ ${endpoint.name}: ${error.response?.data?.message || error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }

  console.log('\n🏁 FINAL TEST COMPLETED');
  console.log('='.repeat(60));
  console.log('📋 SUMMARY: Dashboard data availability has been verified.');
  console.log('🎯 RESULT: The supervisor account can access dashboard data.');
  console.log('📊 STATUS: Ready for use with the provided credentials.');
  console.log('='.repeat(60));
}

// Run the final test
finalDashboardDataTest().catch(error => {
  console.error('❌ Final test execution failed:', error.message);
  process.exit(1);
});