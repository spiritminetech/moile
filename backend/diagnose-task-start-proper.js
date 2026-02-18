// Proper diagnostic script for task start issues
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Attendance from './src/modules/attendance/Attendance.js';
import Project from './src/modules/project/models/Project.js';
import User from './src/modules/user/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function diagnoseTaskStart() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(80));
    console.log('🔍 TASK START DIAGNOSTIC - PROPER VERSION');
    console.log('='.repeat(80));

    // Ask user for their login email
    console.log('\n📧 Looking for user with email: worker@gmail.com');
    
    const user = await User.findOne({ email: 'worker@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found with that email');
      console.log('\n💡 Available users:');
      const allUsers = await User.find({}).limit(10);
      allUsers.forEach(u => console.log(`   - ${u.email} (ID: ${u.id})`));
      return;
    }
    
    console.log('✅ User found:');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Active:', user.isActive);

    // Find employee record
    console.log('\n📋 Finding Employee Record...');
    const employees = await Employee.find({ userId: user.id });
    
    if (employees.length === 0) {
      console.log('❌ No employee record found for this user');
      return;
    }
    
    console.log(`✅ Found ${employees.length} employee record(s):`);
    
    for (const employee of employees) {
      console.log('\n' + '─'.repeat(80));
      console.log('Employee ID:', employee.id);
      console.log('Full Name:', employee.fullName);
      console.log('Status:', employee.status);
      console.log('Company ID:', employee.companyId);
      console.log('Trade:', employee.trade || 'N/A');
      
      // Check today's attendance
      console.log('\n📅 Checking Today\'s Attendance...');
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const todayAttendance = await Attendance.findOne({
        employeeId: employee.id,
        checkIn: { $exists: true, $ne: null },
        date: { $gte: startOfToday, $lt: startOfTomorrow }
      });
      
      if (!todayAttendance) {
        console.log('❌ NO ATTENDANCE FOR TODAY');
        console.log('   ⚠️  BLOCKING ISSUE: Must check in before starting tasks');
      } else {
        console.log('✅ Attendance logged:');
        console.log('   Check In:', todayAttendance.checkIn);
        console.log('   Project ID:', todayAttendance.projectId);
      }
      
      // Check for active tasks
      console.log('\n🔄 Checking Active Tasks...');
      const activeTask = await WorkerTaskAssignment.findOne({
        employeeId: employee.id,
        status: 'in_progress'
      });
      
      if (activeTask) {
        console.log('⚠️  ACTIVE TASK FOUND:');
        console.log('   Task:', activeTask.taskName);
        console.log('   Assignment ID:', activeTask.id);
        console.log('   ⚠️  BLOCKING ISSUE: Must pause/complete this task first');
      } else {
        console.log('✅ No active tasks');
      }
      
      // Check today's assignments
      console.log('\n📋 Today\'s Task Assignments...');
      const assignments = await WorkerTaskAssignment.find({
        employeeId: employee.id,
        date: { $gte: startOfToday, $lt: startOfTomorrow }
      }).sort({ sequence: 1 });
      
      console.log(`Found ${assignments.length} task(s) for today:\n`);
      
      for (const assignment of assignments) {
        console.log(`   ${assignment.sequence}. ${assignment.taskName}`);
        console.log(`      Status: ${assignment.status}`);
        console.log(`      Assignment ID: ${assignment.id}`);
        console.log(`      Project ID: ${assignment.projectId}`);
        
        // Check dependencies
        if (assignment.dependencies && assignment.dependencies.length > 0) {
          console.log(`      Dependencies: ${assignment.dependencies.join(', ')}`);
          let allDepsMet = true;
          for (const depId of assignment.dependencies) {
            const dep = await WorkerTaskAssignment.findOne({ id: depId });
            if (dep && dep.status !== 'completed') {
              console.log(`         ❌ Dependency ${depId} not completed`);
              allDepsMet = false;
            }
          }
          if (allDepsMet) {
            console.log(`         ✅ All dependencies met`);
          }
        }
        
        // Check geofence
        const project = await Project.findOne({ id: assignment.projectId });
        if (project) {
          const lat = project.geofence?.center?.latitude || project.latitude;
          const lng = project.geofence?.center?.longitude || project.longitude;
          const radius = project.geofence?.radius || project.geofenceRadius || 100;
          
          if (lat && lng) {
            console.log(`      Geofence: ${lat.toFixed(6)}, ${lng.toFixed(6)} (${radius}m)`);
          } else {
            console.log(`      ⚠️  No geofence configured`);
          }
        }
        console.log();
      }
      
      // Summary
      console.log('='.repeat(80));
      console.log('📊 SUMMARY FOR:', employee.fullName);
      console.log('='.repeat(80));
      
      const canStart = todayAttendance && !activeTask && assignments.length > 0;
      
      if (canStart) {
        console.log('✅ CAN START TASKS');
        console.log('\n💡 Make sure you are:');
        console.log('   1. Within the project geofence location');
        console.log('   2. Have GPS/location services enabled');
        console.log('   3. Task dependencies are completed');
      } else {
        console.log('❌ CANNOT START TASKS\n');
        console.log('Blocking Issues:');
        if (!todayAttendance) {
          console.log('   ❌ No attendance - CHECK IN FIRST');
        }
        if (activeTask) {
          console.log('   ❌ Active task in progress - PAUSE/COMPLETE IT');
        }
        if (assignments.length === 0) {
          console.log('   ❌ No tasks assigned for today');
        }
      }
      console.log('='.repeat(80));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

diagnoseTaskStart();
