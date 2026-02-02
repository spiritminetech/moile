import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import Employee from './src/modules/employee/Employee.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';
import axios from 'axios';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const debugMobileAppProjectId = async () => {
  await connectDB();

  try {
    console.log('\n🔍 DEBUGGING MOBILE APP PROJECT ID ISSUE\n');

    // 1. Check what the mobile app gets from login
    console.log('1. Testing mobile app login response...');
    
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'worker@gmail.com',
      password: 'password123'
    });

    console.log('   Login response user data:');
    console.log(`   user.currentProject.id: ${loginResponse.data.user?.currentProject?.id}`);
    console.log(`   company.id: ${loginResponse.data.company?.id}`);
    
    const mobileAppProjectId = loginResponse.data.user?.currentProject?.id || loginResponse.data.company?.id || 1;
    console.log(`   Mobile app will use project ID: ${mobileAppProjectId}`);

    // 2. Check backend data
    const user = await User.findOne({ email: 'worker@gmail.com' });
    const employee = await Employee.findOne({ userId: user.id });
    
    console.log('\n2. Backend data:');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Employee ID: ${employee.id}`);
    console.log(`   Employee currentProject: ${employee.currentProject?.id}`);

    // 3. Check task assignments for the project ID the mobile app will use
    console.log(`\n3. Checking task assignments for project ${mobileAppProjectId}:`);
    
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    console.log(`   Today string: ${today}`);

    // This is the exact query the backend clock-in function uses
    const assignment = await WorkerTaskAssignment.findOne({
      employeeId: employee.id,
      projectId: mobileAppProjectId,
      date: today
    });

    if (assignment) {
      console.log('   ✅ Task assignment found:');
      console.log(`      Employee ID: ${assignment.employeeId}`);
      console.log(`      Project ID: ${assignment.projectId}`);
      console.log(`      Task ID: ${assignment.taskId}`);
      console.log(`      Date: ${assignment.date}`);
      console.log(`      Status: ${assignment.status}`);
    } else {
      console.log('   ❌ No task assignment found for this combination');
      console.log(`      Looking for: employeeId=${employee.id}, projectId=${mobileAppProjectId}, date=${today}`);
      
      // Check what assignments DO exist
      console.log('\n   Existing task assignments for this employee:');
      const allAssignments = await WorkerTaskAssignment.find({ employeeId: employee.id });
      
      if (allAssignments.length === 0) {
        console.log('      No task assignments found at all');
      } else {
        allAssignments.forEach((assign, index) => {
          console.log(`      ${index + 1}. Project: ${assign.projectId}, Date: ${assign.date}, Task: ${assign.taskId}`);
        });
      }
    }

    // 4. Check if tasks exist for the project
    console.log(`\n4. Checking tasks for project ${mobileAppProjectId}:`);
    const tasks = await Task.find({ projectId: mobileAppProjectId });
    
    if (tasks.length === 0) {
      console.log('   ❌ No tasks found for this project');
    } else {
      console.log(`   ✅ Found ${tasks.length} tasks:`);
      tasks.forEach((task, index) => {
        console.log(`      ${index + 1}. ${task.taskName} (ID: ${task.id})`);
      });
    }

    // 5. Create the missing task assignment
    if (!assignment && tasks.length > 0) {
      console.log('\n5. Creating missing task assignment...');
      
      // Get next assignment ID
      const lastAssignment = await WorkerTaskAssignment.findOne({}, {}, { sort: { id: -1 } });
      const nextId = lastAssignment ? lastAssignment.id + 1 : 1;

      const newAssignment = new WorkerTaskAssignment({
        id: nextId,
        employeeId: employee.id,
        taskId: tasks[0].id, // Assign first available task
        projectId: mobileAppProjectId,
        date: today,
        status: 'ASSIGNED',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await newAssignment.save();
      console.log(`   ✅ Created task assignment: Employee ${employee.id} → Task ${tasks[0].id} → Project ${mobileAppProjectId}`);
    }

    // 6. Test clock-in again
    console.log('\n6. Testing clock-in with mobile app project ID...');
    
    const token = loginResponse.data.token;
    
    try {
      const clockInResponse = await axios.post(
        'http://localhost:5002/api/worker/attendance/clock-in',
        {
          projectId: mobileAppProjectId,
          latitude: 12.865141646709928,
          longitude: 77.6467982341202,
          accuracy: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('   ✅ Clock-in successful!');
      console.log(`   Message: ${clockInResponse.data.message}`);

    } catch (clockInError) {
      if (clockInError.response) {
        console.log('   ❌ Clock-in still failed:', clockInError.response.data.message);
        
        if (clockInError.response.data.message === 'No task assigned for this project today') {
          console.log('\n   🔍 STILL FAILING - Let me check the exact backend logic...');
          
          // Let's check the exact date format being used
          const todayDate = new Date();
          const todayISO = todayDate.toISOString().split("T")[0];
          const todayLocal = todayDate.toLocaleDateString();
          
          console.log(`   Today formats:`);
          console.log(`     ISO: ${todayISO}`);
          console.log(`     Local: ${todayLocal}`);
          console.log(`     Full: ${todayDate}`);
          
          // Check assignments with different date formats
          const assignmentISO = await WorkerTaskAssignment.findOne({
            employeeId: employee.id,
            projectId: mobileAppProjectId,
            date: todayISO
          });
          
          const assignmentDate = await WorkerTaskAssignment.findOne({
            employeeId: employee.id,
            projectId: mobileAppProjectId,
            date: todayDate
          });
          
          console.log(`   Assignment with ISO date: ${!!assignmentISO}`);
          console.log(`   Assignment with Date object: ${!!assignmentDate}`);
        }
      } else {
        console.log('   ❌ Request failed:', clockInError.message);
      }
    }

    console.log('\n🎯 SUMMARY:');
    console.log(`   Mobile app project ID: ${mobileAppProjectId}`);
    console.log(`   Task assignment created: ${!!assignment || tasks.length > 0}`);
    console.log('   If still failing, there might be a date format mismatch');

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
};

debugMobileAppProjectId();