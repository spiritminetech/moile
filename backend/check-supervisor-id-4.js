/**
 * Check data for Supervisor Employee ID 4
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Attendance from './src/modules/attendance/Attendance.js';

dotenv.config();

async function checkSupervisor4() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(60));
    console.log('🔍 CHECKING SUPERVISOR EMPLOYEE ID 4');
    console.log('='.repeat(60));

    // 1. Find employee with ID 4
    const employee = await Employee.findOne({ id: 4 });
    
    console.log('\n1️⃣  EMPLOYEE RECORD');
    if (employee) {
      console.log('   ✅ Found Employee ID 4');
      console.log('   Name:', employee.fullName);
      console.log('   User ID:', employee.userId);
      console.log('   Company ID:', employee.companyId);
      
      // Find associated user
      if (employee.userId) {
        const user = await User.findOne({ id: employee.userId });
        if (user) {
          console.log('   Email:', user.email);
          console.log('   Role:', user.role);
        }
      }
    } else {
      console.log('   ❌ No employee found with ID 4');
      console.log('\n   Looking for other supervisors...');
      
      // Find all employees with userId that has supervisor role
      const supervisorUsers = await User.find({ role: 'supervisor' });
      console.log(`\n   Found ${supervisorUsers.length} users with supervisor role:`);
      
      for (const user of supervisorUsers) {
        const emp = await Employee.findOne({ userId: user.id });
        if (emp) {
          console.log(`   - Employee ID ${emp.id}: ${emp.fullName} (${user.email})`);
        }
      }
      
      await mongoose.disconnect();
      return;
    }

    const supervisorId = employee.id;

    // 2. Check projects
    console.log('\n' + '='.repeat(60));
    console.log('2️⃣  PROJECTS ASSIGNED TO SUPERVISOR 4');
    const projects = await Project.find({ supervisorId: supervisorId });
    console.log(`   Total projects: ${projects.length}`);
    
    if (projects.length > 0) {
      projects.forEach(p => {
        console.log(`   - Project ${p.id}: ${p.name || 'Unnamed'}`);
      });
    } else {
      console.log('   ⚠️  No projects assigned');
    }

    // 3. Check workers for each project
    console.log('\n' + '='.repeat(60));
    console.log('3️⃣  WORKERS BY PROJECT');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const project of projects) {
      const assignments = await WorkerTaskAssignment.find({
        projectId: project.id,
        assignedDate: { $gte: today }
      });
      
      const workerIds = [...new Set(assignments.map(a => a.workerId))];
      const workers = await Employee.find({ id: { $in: workerIds } });
      
      console.log(`\n   Project ${project.id}:`);
      console.log(`   - Task assignments today: ${assignments.length}`);
      console.log(`   - Unique workers: ${workerIds.length}`);
      
      if (workers.length > 0) {
        workers.forEach(w => {
          console.log(`     • Worker ${w.id}: ${w.fullName}`);
        });
      } else {
        console.log(`     ⚠️  No workers assigned`);
      }
    }

    // 4. Check attendance
    console.log('\n' + '='.repeat(60));
    console.log('4️⃣  ATTENDANCE TODAY');
    
    for (const project of projects) {
      const attendance = await Attendance.find({
        projectId: project.id,
        date: { $gte: today }
      });
      
      console.log(`\n   Project ${project.id}:`);
      console.log(`   - Attendance records: ${attendance.length}`);
      
      if (attendance.length > 0) {
        attendance.forEach(a => {
          const checkIn = a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'No';
          const checkOut = a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'No';
          console.log(`     • Employee ${a.employeeId}: Check-in ${checkIn}, Check-out ${checkOut}`);
        });
      } else {
        console.log(`     ⚠️  No attendance records`);
      }
    }

    // 5. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY FOR SUPERVISOR 4');
    console.log('='.repeat(60));
    console.log(`   Employee ID: ${supervisorId}`);
    console.log(`   Name: ${employee.fullName}`);
    console.log(`   Projects: ${projects.length}`);
    
    if (projects.length > 0) {
      const totalAssignments = await WorkerTaskAssignment.countDocuments({
        projectId: { $in: projects.map(p => p.id) },
        assignedDate: { $gte: today }
      });
      console.log(`   Task assignments today: ${totalAssignments}`);
      
      const totalAttendance = await Attendance.countDocuments({
        projectId: { $in: projects.map(p => p.id) },
        date: { $gte: today }
      });
      console.log(`   Attendance records today: ${totalAttendance}`);
      
      // Count workers with check-in
      const attendanceWithCheckIn = await Attendance.countDocuments({
        projectId: { $in: projects.map(p => p.id) },
        date: { $gte: today },
        checkInTime: { $exists: true, $ne: null }
      });
      console.log(`   Workers checked in: ${attendanceWithCheckIn}`);
      
      // Get all worker IDs from assignments
      const allAssignments = await WorkerTaskAssignment.find({
        projectId: { $in: projects.map(p => p.id) },
        assignedDate: { $gte: today }
      });
      const allWorkerIds = [...new Set(allAssignments.map(a => a.workerId))];
      const absentCount = allWorkerIds.length - attendanceWithCheckIn;
      console.log(`   Workers absent: ${absentCount}`);
    }

    console.log('\n' + '='.repeat(60));

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

checkSupervisor4();
