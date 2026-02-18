// Diagnostic script to check why task cannot be started
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Attendance from './src/modules/attendance/Attendance.js';
import Project from './src/modules/project/models/Project.js';
import User from './src/modules/user/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function diagnoseTaskStartIssue() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('='.repeat(80));
    console.log('🔍 DIAGNOSING TASK START ISSUE');
    console.log('='.repeat(80));

    // Step 1: Find the worker account
    console.log('\n📋 STEP 1: Finding Worker Account');
    console.log('-'.repeat(80));
    
    const workerUser = await User.findOne({ 
      email: 'worker@gmail.com',
      role: 'worker'
    });
    
    if (!workerUser) {
      console.log('❌ Worker user not found with email: worker@gmail.com');
      return;
    }
    
    console.log('✅ Worker User Found:');
    console.log('   User ID:', workerUser.id);
    console.log('   Email:', workerUser.email);
    console.log('   Role:', workerUser.role);
    console.log('   Company ID:', workerUser.companyId);

    // Step 2: Find employee record
    console.log('\n📋 STEP 2: Finding Employee Record');
    console.log('-'.repeat(80));
    
    const employee = await Employee.findOne({
      userId: workerUser.id,
      companyId: workerUser.companyId,
      status: 'ACTIVE'
    });
    
    if (!employee) {
      console.log('❌ Employee record not found for user');
      console.log('   Looking for: userId =', workerUser.id, ', companyId =', workerUser.companyId);
      return;
    }
    
    console.log('✅ Employee Found:');
    console.log('   Employee ID:', employee.id);
    console.log('   Full Name:', employee.fullName);
    console.log('   Status:', employee.status);

    // Step 3: Check today's attendance
    console.log('\n📋 STEP 3: Checking Today\'s Attendance');
    console.log('-'.repeat(80));
    
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayAttendance = await Attendance.findOne({
      employeeId: employee.id,
      checkIn: { $exists: true, $ne: null },
      date: { $gte: startOfToday, $lt: startOfTomorrow }
    });
    
    if (!todayAttendance) {
      console.log('❌ NO ATTENDANCE FOUND FOR TODAY');
      console.log('   ⚠️  ISSUE: Worker must check in before starting tasks');
      console.log('   Date Range:', startOfToday, 'to', startOfTomorrow);
      console.log('\n💡 SOLUTION: Worker needs to check in first via Attendance screen');
    } else {
      console.log('✅ Attendance Found:');
      console.log('   Check In:', todayAttendance.checkIn);
      console.log('   Project ID:', todayAttendance.projectId);
      console.log('   Status:', todayAttendance.status);
    }

    // Step 4: Check for active tasks
    console.log('\n📋 STEP 4: Checking for Active Tasks');
    console.log('-'.repeat(80));
    
    const activeTask = await WorkerTaskAssignment.findOne({
      employeeId: employee.id,
      status: 'in_progress'
    });
    
    if (activeTask) {
      console.log('⚠️  ACTIVE TASK FOUND:');
      console.log('   Assignment ID:', activeTask.id);
      console.log('   Task Name:', activeTask.taskName);
      console.log('   Status:', activeTask.status);
      console.log('   Started At:', activeTask.startTime);
      console.log('\n💡 SOLUTION: Worker must pause/complete current task before starting another');
    } else {
      console.log('✅ No active tasks - worker can start a new task');
    }

    // Step 5: Check today's task assignments
    console.log('\n📋 STEP 5: Checking Today\'s Task Assignments');
    console.log('-'.repeat(80));
    
    const assignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: { $gte: startOfToday, $lt: startOfTomorrow }
    }).sort({ sequence: 1 });
    
    console.log(`Found ${assignments.length} task(s) for today:`);
    
    for (const assignment of assignments) {
      console.log('\n   Task:', assignment.taskName);
      console.log('   Assignment ID:', assignment.id);
      console.log('   Status:', assignment.status);
      console.log('   Sequence:', assignment.sequence);
      console.log('   Dependencies:', assignment.dependencies || []);
      console.log('   Project ID:', assignment.projectId);
      
      // Check dependencies
      if (assignment.dependencies && assignment.dependencies.length > 0) {
        console.log('   Checking dependencies...');
        for (const depId of assignment.dependencies) {
          const depTask = await WorkerTaskAssignment.findOne({ id: depId });
          if (depTask) {
            console.log(`     - Dependency ${depId}: ${depTask.taskName} (${depTask.status})`);
            if (depTask.status !== 'completed') {
              console.log('       ❌ NOT COMPLETED - blocks this task');
            } else {
              console.log('       ✅ COMPLETED');
            }
          } else {
            console.log(`     - Dependency ${depId}: NOT FOUND`);
          }
        }
      }
      
      // Check project geofence
      const project = await Project.findOne({ id: assignment.projectId });
      if (project) {
        console.log('   Project:', project.projectName);
        console.log('   Project Location:');
        const lat = project.geofence?.center?.latitude || project.latitude;
        const lng = project.geofence?.center?.longitude || project.longitude;
        const radius = project.geofence?.radius || project.geofenceRadius || 100;
        
        if (lat && lng) {
          console.log(`     Lat: ${lat}, Lng: ${lng}`);
          console.log(`     Radius: ${radius}m`);
        } else {
          console.log('     ⚠️  NO GEOFENCE CONFIGURED');
        }
      }
    }

    // Step 6: Summary and recommendations
    console.log('\n' + '='.repeat(80));
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('='.repeat(80));
    
    const issues = [];
    const canStart = [];
    
    if (!todayAttendance) {
      issues.push('❌ No attendance logged for today - MUST CHECK IN FIRST');
    } else {
      canStart.push('✅ Attendance logged');
    }
    
    if (activeTask) {
      issues.push('❌ Another task is in progress - MUST PAUSE/COMPLETE IT FIRST');
    } else {
      canStart.push('✅ No active tasks');
    }
    
    if (assignments.length === 0) {
      issues.push('❌ No tasks assigned for today');
    } else {
      canStart.push(`✅ ${assignments.length} task(s) assigned`);
    }
    
    console.log('\n✅ REQUIREMENTS MET:');
    canStart.forEach(item => console.log('   ' + item));
    
    if (issues.length > 0) {
      console.log('\n❌ BLOCKING ISSUES:');
      issues.forEach(item => console.log('   ' + item));
      
      console.log('\n💡 NEXT STEPS:');
      if (!todayAttendance) {
        console.log('   1. Open the mobile app');
        console.log('   2. Go to Attendance screen');
        console.log('   3. Check in at the project location');
        console.log('   4. Then try starting the task again');
      }
      if (activeTask) {
        console.log('   1. Complete or pause the current active task');
        console.log('   2. Then try starting the new task');
      }
    } else {
      console.log('\n✅ ALL REQUIREMENTS MET - Task should be startable!');
      console.log('\nIf you still cannot start the task, check:');
      console.log('   1. Are you within the project geofence?');
      console.log('   2. Is your GPS location accurate?');
      console.log('   3. Do you have location permissions enabled?');
      console.log('   4. Are task dependencies completed?');
    }
    
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

diagnoseTaskStartIssue();
