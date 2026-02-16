// Test script to debug worker dashboard API issue
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Project from './src/modules/project/models/Project.js';
import Task from './src/modules/task/Task.js';
import Attendance from './src/modules/attendance/Attendance.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function testWorkerDashboard() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Find a worker user
    console.log('📋 Step 1: Finding worker users...');
    const workerUsers = await User.find({ role: 'worker' }).limit(5);
    console.log(`Found ${workerUsers.length} worker users`);
    
    if (workerUsers.length === 0) {
      console.log('❌ No worker users found in database');
      return;
    }

    // Test with first worker
    const testUser = workerUsers[0];
    console.log('\n🧪 Testing with user:', {
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role
    });

    // Step 2: Find employee record
    console.log('\n📋 Step 2: Finding employee record...');
    const employee = await Employee.findOne({
      userId: testUser.id,
      status: 'ACTIVE'
    });

    if (!employee) {
      console.log('❌ No active employee record found for user:', testUser.id);
      console.log('Checking all employees for this user...');
      const allEmployees = await Employee.find({ userId: testUser.id });
      console.log('All employee records:', allEmployees.map(e => ({
        id: e.id,
        status: e.status,
        fullName: e.fullName,
        companyId: e.companyId
      })));
      return;
    }

    console.log('✅ Employee found:', {
      employeeId: employee.id,
      fullName: employee.fullName,
      status: employee.status,
      companyId: employee.companyId
    });

    // Step 3: Check for task assignments
    console.log('\n📋 Step 3: Checking task assignments...');
    const today = new Date().toISOString().split('T')[0];
    console.log('Looking for assignments on date:', today);

    const assignments = await WorkerTaskAssignment.find({
      employeeId: employee.id
    }).sort({ date: -1 }).limit(10);

    console.log(`Found ${assignments.length} total assignments for this employee`);
    
    if (assignments.length > 0) {
      console.log('\nRecent assignments:');
      assignments.forEach((a, i) => {
        console.log(`  ${i + 1}. Date: ${a.date}, Project: ${a.projectId}, Task: ${a.taskId}, Status: ${a.status}`);
      });

      // Check today's assignments
      const todayAssignments = assignments.filter(a => a.date === today);
      console.log(`\n📅 Assignments for today (${today}): ${todayAssignments.length}`);
      
      if (todayAssignments.length === 0) {
        console.log('⚠️ No assignments for today - this would cause "NO_TASKS_ASSIGNED" error');
        console.log('\n💡 Solution: Create task assignments for today using:');
        console.log(`   - Employee ID: ${employee.id}`);
        console.log(`   - Date: ${today}`);
      } else {
        console.log('✅ Today\'s assignments found');
        
        // Step 4: Check project exists
        console.log('\n📋 Step 4: Checking project...');
        const projectId = todayAssignments[0].projectId;
        const project = await Project.findOne({ id: projectId });
        
        if (!project) {
          console.log('❌ Project not found:', projectId);
        } else {
          console.log('✅ Project found:', {
            id: project.id,
            name: project.projectName,
            hasGeofence: !!(project.geofence || project.latitude)
          });
        }

        // Step 5: Check tasks exist
        console.log('\n📋 Step 5: Checking tasks...');
        for (const assignment of todayAssignments) {
          const task = await Task.findOne({ id: assignment.taskId });
          if (!task) {
            console.log(`❌ Task not found: ${assignment.taskId}`);
          } else {
            console.log(`✅ Task found: ${task.taskName} (ID: ${task.id})`);
          }
        }

        // Step 6: Check attendance
        console.log('\n📋 Step 6: Checking attendance...');
        const todayStart = new Date(today + 'T00:00:00.000Z');
        const todayEnd = new Date(today + 'T23:59:59.999Z');
        
        const attendance = await Attendance.findOne({
          employeeId: employee.id,
          projectId: projectId,
          date: { $gte: todayStart, $lte: todayEnd }
        });

        if (!attendance) {
          console.log('⚠️ No attendance record for today');
        } else {
          console.log('✅ Attendance record found:', {
            checkIn: attendance.checkIn,
            checkOut: attendance.checkOut,
            status: attendance.session
          });
        }
      }
    } else {
      console.log('❌ No task assignments found for this employee at all');
      console.log('\n💡 This employee needs task assignments created');
    }

    // Step 7: Test all workers
    console.log('\n📋 Step 7: Summary of all workers...');
    for (const user of workerUsers) {
      const emp = await Employee.findOne({ userId: user.id, status: 'ACTIVE' });
      if (emp) {
        const assignmentCount = await WorkerTaskAssignment.countDocuments({ employeeId: emp.id });
        const todayCount = await WorkerTaskAssignment.countDocuments({ 
          employeeId: emp.id, 
          date: today 
        });
        console.log(`  ${emp.fullName}: ${assignmentCount} total assignments, ${todayCount} today`);
      }
    }

    console.log('\n✅ Diagnostic complete');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testWorkerDashboard();
