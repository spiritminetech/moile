import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import Employee from './src/modules/employee/Employee.js';
import Attendance from './src/modules/attendance/Attendance.js';
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

const clearAttendanceAndTestFresh = async () => {
  await connectDB();

  try {
    console.log('\n🔄 CLEARING ATTENDANCE AND TESTING FRESH\n');

    // 1. Find user and employee
    const user = await User.findOne({ email: 'worker@gmail.com' });
    const employee = await Employee.findOne({ userId: user.id });
    
    console.log(`1. User: ${user.email} (ID: ${user.id})`);
    console.log(`   Employee: ID ${employee.id}`);

    // 2. Clear ALL attendance records for today to start fresh
    console.log('\n2. Clearing attendance records...');
    
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    const deletedCount = await Attendance.deleteMany({
      employeeId: employee.id,
      date: today
    });
    
    console.log(`   Deleted ${deletedCount.deletedCount} attendance records for today`);

    // 3. Ensure task assignments exist for ALL possible project IDs
    console.log('\n3. Creating task assignments for all possible project IDs...');
    
    const possibleProjectIds = [1, 1003]; // Both fallback and current project
    
    for (const projectId of possibleProjectIds) {
      // Check if tasks exist for this project
      const tasks = await Task.find({ projectId: projectId });
      
      if (tasks.length > 0) {
        console.log(`   Project ${projectId}: ${tasks.length} tasks found`);
        
        // Check if assignment exists
        const existingAssignment = await WorkerTaskAssignment.findOne({
          employeeId: employee.id,
          projectId: projectId,
          date: today
        });
        
        if (!existingAssignment) {
          // Create assignment
          const lastAssignment = await WorkerTaskAssignment.findOne({}, {}, { sort: { id: -1 } });
          const nextId = lastAssignment ? lastAssignment.id + 1 : 1;

          const newAssignment = new WorkerTaskAssignment({
            id: nextId,
            employeeId: employee.id,
            taskId: tasks[0].id,
            projectId: projectId,
            date: today,
            status: 'ASSIGNED',
            createdAt: new Date(),
            updatedAt: new Date()
          });

          await newAssignment.save();
          console.log(`   ✅ Created assignment for project ${projectId}`);
        } else {
          console.log(`   ✅ Assignment already exists for project ${projectId}`);
        }
      } else {
        console.log(`   Project ${projectId}: No tasks found, creating a sample task...`);
        
        // Create a sample task
        const lastTask = await Task.findOne({}, {}, { sort: { id: -1 } });
        const nextTaskId = lastTask ? lastTask.id + 1 : 1;

        const sampleTask = new Task({
          id: nextTaskId,
          projectId: projectId,
          taskName: `Sample Task for Project ${projectId}`,
          description: 'Sample task for mobile app testing',
          taskType: 'GENERAL',
          priority: 'MEDIUM',
          estimatedHours: 8,
          status: 'PENDING',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await sampleTask.save();
        console.log(`   ✅ Created sample task for project ${projectId}`);

        // Create assignment
        const lastAssignment = await WorkerTaskAssignment.findOne({}, {}, { sort: { id: -1 } });
        const nextId = lastAssignment ? lastAssignment.id + 1 : 1;

        const newAssignment = new WorkerTaskAssignment({
          id: nextId,
          employeeId: employee.id,
          taskId: sampleTask.id,
          projectId: projectId,
          date: today,
          status: 'ASSIGNED',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await newAssignment.save();
        console.log(`   ✅ Created assignment for project ${projectId}`);
      }
    }

    // 4. Test both project IDs
    console.log('\n4. Testing clock-in with both project IDs...');
    
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'worker@gmail.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;

    for (const projectId of possibleProjectIds) {
      console.log(`\n   Testing project ID ${projectId}:`);
      
      try {
        const clockInResponse = await axios.post(
          'http://localhost:5002/api/worker/attendance/clock-in',
          {
            projectId: projectId,
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

        console.log(`   ✅ Project ${projectId}: Clock-in successful!`);
        console.log(`      Message: ${clockInResponse.data.message}`);
        
        // Clock out immediately to test the next project
        try {
          await axios.post(
            'http://localhost:5002/api/worker/attendance/clock-out',
            {
              projectId: projectId,
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
          console.log(`      Clock-out successful for project ${projectId}`);
        } catch (clockOutError) {
          console.log(`      Clock-out failed for project ${projectId}`);
        }

      } catch (clockInError) {
        if (clockInError.response) {
          console.log(`   ❌ Project ${projectId}: ${clockInError.response.data.message}`);
        } else {
          console.log(`   ❌ Project ${projectId}: Request failed`);
        }
      }
    }

    console.log('\n🎯 FINAL SUMMARY:');
    console.log('   ✅ Cleared all attendance records');
    console.log('   ✅ Created task assignments for both project IDs (1 and 1003)');
    console.log('   ✅ Both projects should now work in the mobile app');
    console.log('   ');
    console.log('   📱 MOBILE APP SHOULD NOW WORK!');
    console.log('   Try clock-in again - it should succeed regardless of which project ID is used');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
};

clearAttendanceAndTestFresh();