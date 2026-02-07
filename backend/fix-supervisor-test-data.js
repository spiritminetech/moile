/**
 * Fix supervisor test data - add task assignments and proper attendance times
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Attendance from './src/modules/attendance/Attendance.js';
import Task from './src/modules/task/Task.js';

dotenv.config();

async function fixData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get some tasks
    const tasks = await Task.find({}).limit(5);
    if (tasks.length === 0) {
      console.log('❌ No tasks found in database');
      await mongoose.disconnect();
      return;
    }

    console.log(`📝 Found ${tasks.length} tasks to assign\n`);

    // 1. Create task assignments for Project 1 workers
    console.log('1️⃣  Creating task assignments for Project 1...');
    const project1Workers = [101, 102, 103, 104];
    
    for (let i = 0; i < project1Workers.length; i++) {
      const workerId = project1Workers[i];
      const task = tasks[i % tasks.length];
      
      await WorkerTaskAssignment.create({
        workerId: workerId,
        taskId: task.id,
        projectId: 1,
        assignedDate: today,
        status: 'assigned',
        createdAt: new Date()
      });
      
      console.log(`   ✅ Assigned Task ${task.id} to Worker ${workerId}`);
    }

    // 2. Create task assignments for Project 2 workers
    console.log('\n2️⃣  Creating task assignments for Project 2...');
    const project2Workers = [105, 106, 107, 108];
    
    for (let i = 0; i < project2Workers.length; i++) {
      const workerId = project2Workers[i];
      const task = tasks[i % tasks.length];
      
      await WorkerTaskAssignment.create({
        workerId: workerId,
        taskId: task.id,
        projectId: 2,
        assignedDate: today,
        status: 'assigned',
        createdAt: new Date()
      });
      
      console.log(`   ✅ Assigned Task ${task.id} to Worker ${workerId}`);
    }

    // 3. Update attendance records with proper times
    console.log('\n3️⃣  Updating attendance records with check-in times...');
    
    // Project 1 attendance
    await Attendance.updateOne(
      { employeeId: 101, projectId: 1, date: { $gte: today } },
      { $set: { checkInTime: new Date(today.getTime() + 8 * 60 * 60 * 1000) } } // 8:00 AM
    );
    console.log('   ✅ Worker 101: Check-in 08:00 AM');

    await Attendance.updateOne(
      { employeeId: 102, projectId: 1, date: { $gte: today } },
      { $set: { 
        checkInTime: new Date(today.getTime() + 7.75 * 60 * 60 * 1000), // 7:45 AM
        checkOutTime: new Date(today.getTime() + 17 * 60 * 60 * 1000) // 5:00 PM
      }}
    );
    console.log('   ✅ Worker 102: Check-in 07:45 AM, Check-out 05:00 PM');

    await Attendance.updateOne(
      { employeeId: 103, projectId: 1, date: { $gte: today } },
      { $set: { checkInTime: new Date(today.getTime() + 9.5 * 60 * 60 * 1000) } } // 9:30 AM (LATE)
    );
    console.log('   ✅ Worker 103: Check-in 09:30 AM (LATE)');

    // Worker 104 - NO attendance (ABSENT)
    await Attendance.deleteOne({ employeeId: 104, projectId: 1, date: { $gte: today } });
    console.log('   ✅ Worker 104: No attendance (ABSENT)');

    // Project 2 attendance
    await Attendance.updateOne(
      { employeeId: 105, projectId: 2, date: { $gte: today } },
      { $set: { checkInTime: new Date(today.getTime() + 8 * 60 * 60 * 1000) } } // 8:00 AM
    );
    console.log('   ✅ Worker 105: Check-in 08:00 AM');

    await Attendance.updateOne(
      { employeeId: 106, projectId: 2, date: { $gte: today } },
      { $set: { checkInTime: new Date(today.getTime() + 8.25 * 60 * 60 * 1000) } } // 8:15 AM
    );
    console.log('   ✅ Worker 106: Check-in 08:15 AM');

    await Attendance.updateOne(
      { employeeId: 107, projectId: 2, date: { $gte: today } },
      { $set: { checkInTime: new Date(today.getTime() + 9 * 60 * 60 * 1000) } } // 9:00 AM (LATE)
    );
    console.log('   ✅ Worker 107: Check-in 09:00 AM (LATE)');

    // Worker 108 - NO attendance (ABSENT)
    await Attendance.deleteOne({ employeeId: 108, projectId: 2, date: { $gte: today } });
    console.log('   ✅ Worker 108: No attendance (ABSENT)');

    console.log('\n' + '='.repeat(60));
    console.log('✅ DATA FIX COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log('   - Task assignments created: 8');
    console.log('   - Attendance records updated: 6');
    console.log('   - Workers with check-in: 6');
    console.log('   - Late workers: 2 (103, 107)');
    console.log('   - Absent workers: 2 (104, 108)');
    console.log('\n🎯 Now test the APIs again!');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixData();
