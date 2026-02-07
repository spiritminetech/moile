/**
 * Create complete test data for Supervisor Employee ID 4
 * Assigns Projects 1 and 2, creates workers, tasks, and attendance
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import Task from './src/modules/task/Task.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Attendance from './src/modules/attendance/Attendance.js';

dotenv.config();

async function createDataForSupervisor4() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(60));
    console.log('🏗️  CREATING TEST DATA FOR SUPERVISOR 4');
    console.log('='.repeat(60));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Update Projects 1 and 2 to be assigned to Supervisor 4
    console.log('\n1️⃣  Assigning Projects 1 and 2 to Supervisor 4...');
    
    await Project.updateOne(
      { id: 1 },
      { $set: { supervisorId: 4 } },
      { upsert: false }
    );
    console.log('   ✅ Project 1 assigned to Supervisor 4');
    
    await Project.updateOne(
      { id: 2 },
      { $set: { supervisorId: 4 } },
      { upsert: false }
    );
    console.log('   ✅ Project 2 assigned to Supervisor 4');

    // 2. Get or create workers (IDs 101-108)
    console.log('\n2️⃣  Setting up workers...');
    
    const workerData = [
      { id: 101, name: 'John Tan Wei Ming', projectId: 1 },
      { id: 102, name: 'Ahmad Rahman', projectId: 1 },
      { id: 103, name: 'David Lim Cheng Huat', projectId: 1 },
      { id: 104, name: 'Sarah Williams', projectId: 1 },
      { id: 105, name: 'Chen Wei Jie', projectId: 2 },
      { id: 106, name: 'John Supervisor', projectId: 2 },
      { id: 107, name: 'Raj Kumar', projectId: 2 },
      { id: 108, name: 'Lisa Anderson', projectId: 2 }
    ];

    for (const worker of workerData) {
      const existing = await Employee.findOne({ id: worker.id });
      if (!existing) {
        await Employee.create({
          id: worker.id,
          fullName: worker.name,
          companyId: 1,
          status: 'ACTIVE'
        });
        console.log(`   ✅ Created Worker ${worker.id}: ${worker.name}`);
      } else {
        console.log(`   ✅ Found Worker ${worker.id}: ${existing.fullName}`);
      }
    }

    // 3. Get tasks
    console.log('\n3️⃣  Getting tasks...');
    const tasks = await Task.find({}).limit(5);
    if (tasks.length === 0) {
      console.log('   ❌ No tasks found. Please create tasks first.');
      await mongoose.disconnect();
      return;
    }
    console.log(`   ✅ Found ${tasks.length} tasks`);

    // 4. Clear old task assignments for today
    console.log('\n4️⃣  Creating task assignments...');
    const todayStr = today.toISOString().split('T')[0];
    await WorkerTaskAssignment.deleteMany({
      projectId: { $in: [1, 2] },
      date: todayStr
    });
    console.log('   🗑️  Cleared old assignments');

    // Create task assignments
    let assignmentId = 1000; // Start from a high number
    
    for (const worker of workerData) {
      const task = tasks[worker.id % tasks.length];
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      await WorkerTaskAssignment.create({
        id: assignmentId++,
        employeeId: worker.id,
        taskId: task.id,
        projectId: worker.projectId,
        date: todayStr,
        status: 'queued',
        companyId: 1,
        createdAt: new Date()
      });
      
      console.log(`   ✅ Worker ${worker.id} → Task ${task.id} (Project ${worker.projectId})`);
    }

    // 5. Clear old attendance and create new
    console.log('\n5️⃣  Creating attendance records...');
    await Attendance.deleteMany({
      projectId: { $in: [1, 2] },
      date: { $gte: today }
    });
    console.log('   🗑️  Cleared old attendance');

    // Project 1 attendance
    const project1Attendance = [
      { employeeId: 101, checkIn: 8.0, checkOut: null }, // 8:00 AM - Pending
      { employeeId: 102, checkIn: 7.75, checkOut: 17.0 }, // 7:45 AM - 5:00 PM - Complete
      { employeeId: 103, checkIn: 9.5, checkOut: null }, // 9:30 AM - Late
      // 104 - Absent (no record)
    ];

    for (const att of project1Attendance) {
      const checkIn = att.checkIn ? new Date(today.getTime() + att.checkIn * 60 * 60 * 1000) : null;
      const checkOut = att.checkOut ? new Date(today.getTime() + att.checkOut * 60 * 60 * 1000) : null;
      
      await Attendance.create({
        employeeId: att.employeeId,
        projectId: 1,
        date: today,
        checkIn: checkIn,
        checkOut: checkOut,
        createdAt: new Date()
      });
      
      const status = checkOut ? 'Complete' : (checkIn ? 'Pending' : 'Absent');
      console.log(`   ✅ Worker ${att.employeeId} (Project 1): ${status}`);
    }

    // Project 2 attendance
    const project2Attendance = [
      { employeeId: 105, checkIn: 8.0, checkOut: null }, // 8:00 AM - Pending
      { employeeId: 106, checkIn: 8.25, checkOut: null }, // 8:15 AM - Pending
      { employeeId: 107, checkIn: 9.0, checkOut: null }, // 9:00 AM - Late
      // 108 - Absent (no record)
    ];

    for (const att of project2Attendance) {
      const checkIn = att.checkIn ? new Date(today.getTime() + att.checkIn * 60 * 60 * 1000) : null;
      const checkOut = att.checkOut ? new Date(today.getTime() + att.checkOut * 60 * 60 * 1000) : null;
      
      await Attendance.create({
        employeeId: att.employeeId,
        projectId: 2,
        date: today,
        checkIn: checkIn,
        checkOut: checkOut,
        createdAt: new Date()
      });
      
      const status = checkOut ? 'Complete' : (checkIn ? 'Pending' : 'Absent');
      console.log(`   ✅ Worker ${att.employeeId} (Project 2): ${status}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST DATA CREATION COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log('   Supervisor: Employee ID 4 (kawaja)');
    console.log('   Projects: 1 and 2');
    console.log('   Workers: 8 (IDs 101-108)');
    console.log('   Task Assignments: 8');
    console.log('   Attendance Records: 6');
    console.log('   - Project 1: 3 workers (1 complete, 1 pending, 1 late, 1 absent)');
    console.log('   - Project 2: 3 workers (3 pending, 1 late, 1 absent)');
    console.log('\n🎯 Test in Postman:');
    console.log('   GET /api/supervisor/workers-assigned?projectId=1');
    console.log('   GET /api/supervisor/workers-assigned?projectId=2');
    console.log('   GET /api/supervisor/late-absent-workers?projectId=1');
    console.log('   GET /api/supervisor/late-absent-workers?projectId=2');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

createDataForSupervisor4();
