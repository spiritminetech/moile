/**
 * Comprehensive check of all supervisor-related data
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Attendance from './src/modules/attendance/Attendance.js';

dotenv.config();

async function comprehensiveCheck() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(60));

    // 1. Find supervisor
    const user = await User.findOne({ email: 'supervisor@gmail.com' });
    const employee = user ? await Employee.findOne({ userId: user.id }) : null;
    
    console.log('1️⃣  SUPERVISOR');
    console.log('   User ID:', user?.id);
    console.log('   Employee ID:', employee?.id);
    console.log('   Name:', employee?.fullName);

    if (!employee) {
      console.log('\n❌ No supervisor found!');
      await mongoose.disconnect();
      return;
    }

    const supervisorId = employee.id;

    // 2. Check projects
    console.log('\n' + '='.repeat(60));
    console.log('2️⃣  PROJECTS');
    const projects = await Project.find({ supervisorId: supervisorId });
    console.log(`   Total projects: ${projects.length}`);
    projects.forEach(p => {
      console.log(`   - Project ${p.id} (Supervisor: ${p.supervisorId})`);
    });

    // 3. Check workers for each project
    console.log('\n' + '='.repeat(60));
    console.log('3️⃣  WORKERS BY PROJECT');
    
    for (const project of projects) {
      // Find workers assigned to this project via task assignments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
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
        console.log(`     ⚠️  No workers found`);
      }
    }

    // 4. Check attendance
    console.log('\n' + '='.repeat(60));
    console.log('4️⃣  ATTENDANCE TODAY');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const project of projects) {
      const attendance = await Attendance.find({
        projectId: project.id,
        date: { $gte: today }
      });
      
      console.log(`\n   Project ${project.id}:`);
      console.log(`   - Attendance records: ${attendance.length}`);
      
      if (attendance.length > 0) {
        attendance.forEach(a => {
          console.log(`     • Employee ${a.employeeId}: Check-in ${a.checkInTime ? 'Yes' : 'No'}, Check-out ${a.checkOutTime ? 'Yes' : 'No'}`);
        });
      } else {
        console.log(`     ⚠️  No attendance records`);
      }
    }

    // 5. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log(`   Supervisor ID: ${supervisorId}`);
    console.log(`   Projects: ${projects.length}`);
    
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

    console.log('\n' + '='.repeat(60));

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

comprehensiveCheck();
