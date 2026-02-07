/**
 * Create data for BOTH 2026-02-05 and 2026-02-06 to handle timezone issues
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Attendance from './src/modules/attendance/Attendance.js';
import Task from './src/modules/task/Task.js';

dotenv.config();

async function createForBothDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');

    const dates = ['2026-02-05', '2026-02-06'];
    const tasks = await Task.find({}).limit(5);
    
    console.log(`✅ Found ${tasks.length} tasks\n`);

    for (const dateStr of dates) {
      console.log(`📅 Creating data for ${dateStr}...`);
      console.log('='.repeat(60));
      
      // Delete existing
      await WorkerTaskAssignment.deleteMany({
        projectId: { $in: [1, 2] },
        date: dateStr
      });
      
      await Attendance.deleteMany({
        projectId: { $in: [1, 2] },
        date: { $gte: new Date(dateStr), $lt: new Date(new Date(dateStr).getTime() + 24 * 60 * 60 * 1000) }
      });

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

      // Create assignments
      let assignmentId = dateStr === '2026-02-05' ? 6000 : 7000;
      for (const worker of workerData) {
        const task = tasks[worker.id % tasks.length];
        
        await WorkerTaskAssignment.create({
          id: assignmentId++,
          employeeId: worker.id,
          taskId: task.id,
          projectId: worker.projectId,
          date: dateStr,
          status: 'queued',
          companyId: 1
        });
      }
      console.log(`   ✅ Created 8 task assignments`);

      // Create attendance
      const dateObj = new Date(dateStr);
      const attendanceData = [
        { employeeId: 101, projectId: 1, checkIn: 8.0, checkOut: null },
        { employeeId: 102, projectId: 1, checkIn: 7.75, checkOut: 17.0 },
        { employeeId: 103, projectId: 1, checkIn: 9.5, checkOut: null }, // LATE!
        { employeeId: 105, projectId: 2, checkIn: 8.0, checkOut: null },
        { employeeId: 106, projectId: 2, checkIn: 8.25, checkOut: null },
        { employeeId: 107, projectId: 2, checkIn: 9.0, checkOut: null }, // LATE!
      ];

      for (const att of attendanceData) {
        const checkIn = att.checkIn ? new Date(dateObj.getTime() + att.checkIn * 60 * 60 * 1000) : null;
        const checkOut = att.checkOut ? new Date(dateObj.getTime() + att.checkOut * 60 * 60 * 1000) : null;
        
        await Attendance.create({
          employeeId: att.employeeId,
          projectId: att.projectId,
          date: dateObj,
          checkIn: checkIn,
          checkOut: checkOut
        });
      }
      console.log(`   ✅ Created 6 attendance records`);
      console.log(`   ⚠️  2 workers late (103 at 9:30 AM, 107 at 9:00 AM)\n`);
    }

    console.log('='.repeat(60));
    console.log('✅ DATA CREATED FOR BOTH DATES!');
    console.log('='.repeat(60));
    console.log('\n🎯 Now test the geofence API - it should show violations!');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createForBothDates();
