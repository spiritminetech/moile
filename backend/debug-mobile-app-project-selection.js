import axios from 'axios';
import mongoose from 'mongoose';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';

const BASE_URL = 'http://localhost:5002';
const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function debugMobileAppProjectSelection() {
  console.log('🔍 Debugging Mobile App Project Selection Issue');
  console.log('===============================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Login and check what project ID is returned
    console.log('\n1️⃣ Testing login response...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'worker1@gmail.com',
      password: 'password123'
    });

    console.log('Login response user data:');
    console.log('  User ID:', loginResponse.data.user.id);
    console.log('  Employee ID:', loginResponse.data.employee.id);
    console.log('  Current Project:', loginResponse.data.user.currentProject);
    console.log('  Company ID:', loginResponse.data.company.id);

    // Step 2: Check what the mobile app logic would do
    console.log('\n2️⃣ Mobile app project selection logic:');
    
    let projectId = null;
    
    if (loginResponse.data.user?.currentProject?.id) {
      projectId = loginResponse.data.user.currentProject.id.toString();
      console.log('  ✅ Would use user.currentProject.id:', projectId);
    } else if (loginResponse.data.company?.id) {
      projectId = loginResponse.data.company.id.toString();
      console.log('  ⚠️ Would use company.id (fallback):', projectId);
    } else {
      projectId = '1';
      console.log('  ❌ Would use default project ID:', projectId);
    }

    console.log(`  📍 Final project ID mobile app would use: ${projectId}`);

    // Step 3: Check what task assignments exist for today
    console.log('\n3️⃣ Checking task assignments for today...');
    const today = new Date().toISOString().split('T')[0];
    const employeeId = loginResponse.data.employee.id;

    const assignments = await WorkerTaskAssignment.find({
      employeeId: employeeId,
      date: today
    });

    console.log(`  Found ${assignments.length} assignments for Employee ${employeeId} today:`);
    assignments.forEach(a => {
      console.log(`    - Project ${a.projectId}, Task ${a.taskId}, Status: ${a.status}`);
    });

    // Step 4: Check if there's a mismatch
    console.log('\n4️⃣ Checking for project ID mismatch...');
    const assignedProjectIds = assignments.map(a => a.projectId.toString());
    const mobileAppProjectId = projectId;

    console.log(`  Mobile app would use project ID: ${mobileAppProjectId}`);
    console.log(`  Task assignments exist for projects: [${assignedProjectIds.join(', ')}]`);

    if (assignedProjectIds.includes(mobileAppProjectId)) {
      console.log('  ✅ MATCH: Mobile app project ID matches an assignment');
    } else {
      console.log('  ❌ MISMATCH: Mobile app project ID does not match any assignments');
      console.log('  🔧 This explains the "No task assigned for this project today" error!');
    }

    // Step 5: Check what we need to fix
    console.log('\n5️⃣ Solution options:');
    
    if (assignedProjectIds.length > 0) {
      const firstAssignedProject = assignedProjectIds[0];
      console.log(`  Option 1: Update user's currentProject to ${firstAssignedProject}`);
      console.log(`  Option 2: Update mobile app to use first assigned project`);
      console.log(`  Option 3: Create task assignment for project ${mobileAppProjectId}`);
    }

    // Step 6: Test attendance with the correct project ID
    console.log('\n6️⃣ Testing attendance with correct project ID...');
    
    if (assignedProjectIds.length > 0) {
      const correctProjectId = assignedProjectIds[0];
      const token = loginResponse.data.token;
      const headers = { Authorization: `Bearer ${token}` };

      console.log(`  Testing with project ID: ${correctProjectId}`);

      try {
        const attendanceResponse = await axios.post(`${BASE_URL}/api/worker/attendance/clock-in`, {
          projectId: parseInt(correctProjectId),
          latitude: 12.9716,
          longitude: 77.5946
        }, { headers });

        console.log('  ✅ Attendance would work with correct project ID');
        console.log('  Response:', attendanceResponse.data);
      } catch (error) {
        console.log('  ❌ Attendance failed even with correct project ID:');
        console.log('  Error:', error.response?.data?.message || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugMobileAppProjectSelection();