/**
 * Force delete ALL assignments and attendance for projects 1 and 2, then recreate for TODAY
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Attendance from './src/modules/attendance/Attendance.js';
import Task from './src/modules/task/Task.js';

dotenv.config();

async function forceRecreate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`📅 Today: ${todayStr}\n`);

    // 1. DELETE ALL assignments for projects 1 and 2
    console.log('🗑️  Deleting ALL task assignments for projects 1 and 2...');
    const deleteResult = await WorkerTaskAssignment.deleteMany({
      projectId: { $in: [1, 2] }
    });
    console.log(`   Deleted ${deleteResult.deletedCount} assignments\n`);

    // 2. DELETE ALL attendance for projects 1 and 2
    console.log('🗑️  Deleting ALL attendance for projects 1 and 2...');
    const deleteAtt = await Attendance.deleteMany({
      projectId: { $in: [1, 2] }
    });
    console.log(`   Deleted ${deleteAtt.deletedCount} attendance records\n`);

    // 3. Get tasks
    const tasks = await Task.find({}).limit(5);
    console.log(`✅ Found ${tasks.length} tasks\n`);

    // 4. Create NEW assignments for TODAY
    console.log('📝 Creating task assignments for TODAY...');
    const workerData = [
      { id: 101, projectId: 1 },
      { id: 102, projectId: 1 },
      { id: 103, projectId: 1 },
      { id: 104, projectId: 1 },
      { id: 105, projectId: 2 },
      { id: 106, projectId: 2 },
      { id: 107, projectId: 2 },
      { id: 108, projectId: 2 }
    ];

    let assignmentId = 5000; // Use high number to avoid conflicts
    for (const worker of workerData) {
      const task = tasks[worker.id % tasks.length];
      
      await WorkerTaskAssignment.create({
        id: assignmentId++,
        employeeId: worker.id,
        taskId: task.id,
        projectId: worker.projectId,
        date: todayStr,
        status: 'queued',
        companyId: 1
      });
      
      console.log(`   ✅ Worker ${worker.id} → Task ${task.id} (Project ${worker.projectId}) - Date: ${todayStr}`);
    }

    // 5. Create attendance for TODAY
    console.log('\n📝 Creating attendance for TODAY...');
    
    const attendanceData = [
      { employeeId: 101, projectId: 1, checkIn: 8.0, checkOut: null }, // 8:00 AM
      { employeeId: 102, projectId: 1, checkIn: 7.75, checkOut: 17.0 }, // 7:45 AM - 5:00 PM
      { employeeId: 103, projectId: 1, checkIn: 9.5, checkOut: null }, // 9:30 AM - LATE!
      { employeeId: 105, projectId: 2, checkIn: 8.0, checkOut: null }, // 8:00 AM
      { employeeId: 106, projectId: 2, checkIn: 8.25, checkOut: null }, // 8:15 AM
      { employeeId: 107, projectId: 2, checkIn: 9.0, checkOut: null }, // 9:00 AM - LATE!
    ];

    for (const att of attendanceData) {
      const checkIn = att.checkIn ? new Date(today.getTime() + att.checkIn * 60 * 60 * 1000) : null;
      const checkOut = att.checkOut ? new Date(today.getTime() + att.checkOut * 60 * 60 * 1000) : null;
      
      await Attendance.create({
        employeeId: att.employeeId,
        projectId: att.projectId,
        date: today,
        checkIn: checkIn,
        checkOut: checkOut
      });
      
      const timeStr = `${Math.floor(att.checkIn)}:${String(Math.round((att.checkIn % 1) * 60)).padStart(2, '0')}`;
      console.log(`   ✅ Worker ${att.employeeId} (Project ${att.projectId}): Check-in ${timeStr}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ DATA RECREATED FOR TODAY!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Date: ${todayStr}`);
    console.log(`   Task Assignments: 8`);
    console.log(`   Attendance Records: 6`);
    console.log(`   Workers with late check-in: 2 (103 at 9:30 AM, 107 at 9:00 AM)`);
    console.log(`\n🎯 These should now show as geofence violations!`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

forceRecreate();
