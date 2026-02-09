import axios from 'axios';

const BASE_URL = 'http://localhost:5002/api';

async function testSupervisorDashboard() {
  try {
    console.log('🔐 Testing Supervisor Login and Dashboard...\n');

    // Step 1: Login
    console.log('Step 1: Logging in as supervisor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }

    console.log('✅ Login successful');
    console.log('User:', loginResponse.data.user);
    console.log('Company:', loginResponse.data.company);
    console.log('Token:', loginResponse.data.token ? 'Present' : 'Missing');

    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;

    // Step 2: Check if user is a supervisor
    console.log('\nStep 2: Checking user role...');
    const userRole = loginResponse.data.company?.role;
    console.log('Role:', userRole);

    if (userRole?.toLowerCase() !== 'supervisor') {
      console.error('❌ User is not a supervisor! Role is:', userRole);
      return;
    }

    // Step 3: Get Dashboard Data
    console.log('\nStep 3: Fetching dashboard data...');
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/supervisor/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Dashboard API Response:');
      console.log(JSON.stringify(dashboardResponse.data, null, 2));

      // Check what data is returned
      const data = dashboardResponse.data.data || dashboardResponse.data;
      
      console.log('\n📊 Dashboard Data Summary:');
      console.log('- Projects:', data.projects?.length || 0);
      console.log('- Team Overview:', data.teamOverview ? 'Present' : 'Missing');
      console.log('- Task Metrics:', data.taskMetrics ? 'Present' : 'Missing');
      console.log('- Attendance Metrics:', data.attendanceMetrics ? 'Present' : 'Missing');
      console.log('- Pending Approvals:', data.pendingApprovals ? 'Present' : 'Missing');
      console.log('- Alerts:', data.alerts?.length || 0);

      if (data.projects && data.projects.length > 0) {
        console.log('\n📋 Projects:');
        data.projects.forEach(project => {
          console.log(`  - ${project.projectName || project.name} (ID: ${project.id})`);
        });
      } else {
        console.log('\n⚠️ No projects found for this supervisor');
      }

    } catch (dashboardError) {
      console.error('❌ Dashboard API Error:', dashboardError.response?.data || dashboardError.message);
      console.error('Status:', dashboardError.response?.status);
    }

    // Step 4: Check supervisor's employee record
    console.log('\nStep 4: Checking supervisor employee record...');
    const mongoose = await import('mongoose');
    await mongoose.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');

    const Employee = (await import('./src/modules/employee/Employee.js')).default;
    const CompanyUser = (await import('./src/modules/companyUser/CompanyUser.js')).default;
    const Project = (await import('./src/modules/project/models/Project.js')).default;

    const companyUser = await CompanyUser.findOne({ userId });
    console.log('Company User:', companyUser ? {
      userId: companyUser.userId,
      role: companyUser.role,
      companyId: companyUser.companyId
    } : 'Not found');

    const employee = await Employee.findOne({ userId });
    console.log('Employee Record:', employee ? {
      id: employee.id,
      fullName: employee.fullName,
      userId: employee.userId,
      role: employee.role
    } : 'Not found');

    // Step 5: Check projects assigned to this supervisor
    console.log('\nStep 5: Checking projects assigned to supervisor...');
    if (employee) {
      const projects = await Project.find({ supervisorId: employee.id });
      console.log(`Found ${projects.length} projects assigned to supervisor ${employee.id}`);
      
      if (projects.length > 0) {
        console.log('\nProjects:');
        projects.forEach(project => {
          console.log(`  - ${project.projectName || project.name} (ID: ${project.id}, Supervisor ID: ${project.supervisorId})`);
        });
      } else {
        console.log('⚠️ No projects assigned to this supervisor');
        
        // Check all projects to see what supervisorIds exist
        const allProjects = await Project.find();
        console.log('\nAll projects in database:');
        allProjects.forEach(project => {
          console.log(`  - ${project.projectName || project.name} (ID: ${project.id}, Supervisor ID: ${project.supervisorId})`);
        });
      }
    }

    await mongoose.default.disconnect();

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

testSupervisorDashboard();
