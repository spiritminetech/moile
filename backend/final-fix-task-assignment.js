import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import Employee from './src/modules/employee/Employee.js';
import Attendance from './src/modules/attendance/Attendance.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';
import Project from './src/modules/project/models/Project.js';
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

const finalFixTaskAssignment = async () => {
  await connectDB();

  try {
    console.log('\n🔧 FINAL FIX FOR TASK ASSIGNMENT ISSUE\n');

    // 1. Find user and employee
    const user = await User.findOne({ email: 'worker@gmail.com' });
    const employee = await Employee.findOne({ userId: user.id });
    
    console.log(`1. User: ${user.email} (ID: ${user.id})`);
    console.log(`   Employee: ID ${employee.id}`);

    // 2. Clear today's attendance to start fresh
    const today = new Date().toISOString().split("T")[0];
    await Attendance.deleteMany({
      employeeId: employee.id,
      date: today
    });
    console.log('   ✅ Cleared today\'s attendance records');

    // 3. Check what project the mobile app will actually use
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'worker@gmail.com',
      password: 'password123'
    });
    
    const expectedProjectId = loginResponse.data.user?.currentProject?.id;
    console.log(`\n2. Mobile app should use project ID: ${expectedProjectId}`);

    // 4. Ensure task assignment exists for the expected project
    console.log('\n3. Ensuring task assignment exists...');
    
    // Check if assignment exists
    let assignment = await WorkerTaskAssignment.findOne({
      employeeId: employee.id,
      projectId: expectedProjectId,
      date: today
    });

    if (assignment) {
      console.log('   ✅ Task assignment already exists');
    } else {
      console.log('   Creating new task assignment...');
      
      // Find a task for this project
      let task = await Task.findOne({ projectId: expectedProjectId });
      
      if (!task) {
        console.log('   No task found, creating one...');
        
        // Get project details for companyId
        const project = await Project.findOne({ id: expectedProjectId });
        
        // Get next task ID
        const lastTask = await Task.findOne({}, {}, { sort: { id: -1 } });
        const nextTaskId = lastTask ? lastTask.id + 1 : 1;

        task = new Task({
          id: nextTaskId,
          companyId: project.companyId,
          projectId: expectedProjectId,
          taskName: 'Mobile App Test Task',
          description: 'Task for mobile app attendance testing',
          taskType: 'WORK',
          status: 'PLANNED',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await task.save();
        console.log(`   ✅ Created task: ${task.taskName} (ID: ${task.id})`);
      }

      // Create task assignment
      const lastAssignment = await WorkerTaskAssignment.findOne({}, {}, { sort: { id: -1 } });
      const nextId = lastAssignment ? lastAssignment.id + 1 : 1;

      assignment = new WorkerTaskAssignment({
        id: nextId,
        employeeId: employee.id,
        taskId: task.id,
        projectId: expectedProjectId,
        date: today,
        status: 'ASSIGNED',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await assignment.save();
      console.log(`   ✅ Created task assignment: Employee ${employee.id} → Task ${task.id} → Project ${expectedProjectId}`);
    }

    // 5. Test clock-in
    console.log('\n4. Testing clock-in...');
    
    const token = loginResponse.data.token;
    
    try {
      const clockInResponse = await axios.post(
        'http://localhost:5002/api/worker/attendance/clock-in',
        {
          projectId: expectedProjectId,
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
      console.log(`   Check-in time: ${clockInResponse.data.checkInTime}`);

      // Test clock-out
      console.log('\n5. Testing clock-out...');
      
      const clockOutResponse = await axios.post(
        'http://localhost:5002/api/worker/attendance/clock-out',
        {
          projectId: expectedProjectId,
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

      console.log('   ✅ Clock-out successful!');
      console.log(`   Message: ${clockOutResponse.data.message}`);

      console.log('\n🎉 SUCCESS! ATTENDANCE SYSTEM IS FULLY WORKING!');
      console.log('   📱 Mobile app should now work perfectly');

    } catch (attendanceError) {
      if (attendanceError.response) {
        console.log('   ❌ Attendance failed:', attendanceError.response.data.message);
        
        // If it's still failing, let's check what the mobile app is actually sending
        console.log('\n   🔍 DEBUGGING: Let me check what project ID the mobile app is actually using...');
        console.log('   Check the mobile app debug logs for:');
        console.log('   "📍 Using project ID from user.currentProject: X"');
        console.log('   or');
        console.log('   "📍 Using project ID from company: X"');
        console.log('   or');
        console.log('   "📍 Using default project ID: X"');
        console.log('   ');
        console.log('   Then run this script again with the correct project ID');
        
      } else {
        console.log('   ❌ Request failed:', attendanceError.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
};

finalFixTaskAssignment();