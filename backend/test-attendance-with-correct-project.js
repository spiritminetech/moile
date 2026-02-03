import axios from 'axios';
import mongoose from 'mongoose';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';

const BASE_URL = 'http://localhost:5002';
const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function testAttendanceWithCorrectProject() {
  console.log('🔍 Testing Attendance with Correct Project ID');
  console.log('==============================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get Employee 107
    const employee = await Employee.findOne({ id: 107 });
    console.log(`👤 Employee: ${employee.fullName} (ID: ${employee.id})`);

    // Step 1: Login to get token
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'worker1@gmail.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      throw new Error('Login failed');
    }

    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    const token = loginResponse.data.token || loginResponse.data.data?.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful');

    // Step 2: Get today's tasks to see what project ID is returned
    console.log('\n2️⃣ Getting today\'s tasks...');
    const tasksResponse = await axios.get(`${BASE_URL}/api/worker/tasks/today`, { headers });
    
    if (tasksResponse.data.success) {
      const data = tasksResponse.data.data;
      console.log(`✅ Tasks retrieved successfully`);
      console.log(`   Project ID: ${data.project.id}`);
      console.log(`   Project Name: ${data.project.name}`);
      console.log(`   Tasks Count: ${data.todaysTasks ? data.todaysTasks.length : 'No tasks array'}`);
      
      // List all tasks if they exist
      if (data.todaysTasks && data.todaysTasks.length > 0) {
        data.todaysTasks.forEach((task, index) => {
          console.log(`   Task ${index + 1}: ${task.taskName} (ID: ${task.taskId})`);
        });
      } else {
        console.log('   No tasks found in todaysTasks array');
      }

      // Step 3: Try attendance with the correct project ID
      const projectId = data.project.id;
      console.log(`\n3️⃣ Testing attendance with Project ID: ${projectId}`);

      // Get project coordinates (using sample coordinates)
      const latitude = 12.9716;  // Downtown Office Complex coordinates
      const longitude = 77.5946;

      console.log(`   Using coordinates: ${latitude}, ${longitude}`);

      try {
        const attendanceResponse = await axios.post(`${BASE_URL}/api/worker/attendance/clock-in`, {
          projectId: projectId,
          latitude: latitude,
          longitude: longitude
        }, { headers });

        console.log('✅ Attendance check-in response:', attendanceResponse.data);
        if (attendanceResponse.data.success) {
          console.log('✅ Attendance check-in successful!');
          console.log(`   Message: ${attendanceResponse.data.message}`);
        } else {
          console.log('❌ Attendance check-in failed');
          console.log(`   Error: ${attendanceResponse.data.message}`);
        }
      } catch (attendanceError) {
        console.log('❌ Attendance check-in failed with error:');
        console.log(`   Status: ${attendanceError.response?.status}`);
        console.log(`   Message: ${attendanceError.response?.data?.message}`);
        
        if (attendanceError.response?.data?.message === 'No task assigned for this project today') {
          console.log('\n🔍 DEBUGGING: Let me check the exact assignment data...');
          
          const today = new Date().toISOString().split('T')[0];
          const assignments = await WorkerTaskAssignment.find({
            employeeId: 107, // Using the correct employee ID from login response
            projectId: projectId,
            date: today
          });
          
          console.log(`   Assignments found for Employee 107, Project ${projectId} today: ${assignments.length}`);
          assignments.forEach(a => {
            console.log(`   - Assignment ${a.id}: Task ${a.taskId}, Status: ${a.status}`);
          });
          
          // Also check all assignments for employee 107 today
          const allAssignments = await WorkerTaskAssignment.find({
            employeeId: 107,
            date: today
          });
          
          console.log(`   All assignments for Employee 107 today: ${allAssignments.length}`);
          allAssignments.forEach(a => {
            console.log(`   - Project ${a.projectId}, Task ${a.taskId}, Status: ${a.status}`);
          });
        }
      }

    } else {
      console.log('❌ Failed to get today\'s tasks');
      console.log(`   Error: ${tasksResponse.data.message}`);
    }

    // Step 4: Check all assignments for today
    console.log('\n4️⃣ Checking all assignments for today...');
    const today = new Date().toISOString().split('T')[0];
    const allAssignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    });

    console.log(`   Total assignments today: ${allAssignments.length}`);
    allAssignments.forEach(a => {
      console.log(`   - Project ${a.projectId}, Task ${a.taskId}, Status: ${a.status}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response data:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testAttendanceWithCorrectProject();