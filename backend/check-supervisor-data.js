/**
 * Check what supervisor data exists in the database
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Attendance from './src/modules/attendance/Attendance.js';

dotenv.config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');

    // Find supervisor
    const supervisor = await Employee.findOne({ email: 'supervisor@gmail.com' });
    console.log('📋 Supervisor:', supervisor ? {
      id: supervisor.id,
      fullName: supervisor.fullName,
      email: supervisor.email,
      role: supervisor.role
    } : 'NOT FOUND');

    // Find projects
    const projects = await Project.find({ supervisorId: supervisor?.id });
    console.log('\n📍 Projects assigned to supervisor:', projects.length);
    projects.forEach(p => {
      console.log(`   - Project ${p.id}: ${p.name} (Supervisor ID: ${p.supervisorId})`);
    });

    // Find workers
    const workers = await Employee.find({ role: 'worker' }).limit(10);
    console.log('\n👷 Workers in database:', workers.length);
    workers.forEach(w => {
      console.log(`   - Worker ${w.id}: ${w.fullName} (Project: ${w.currentProjectId || 'none'})`);
    });

    // Find task assignments for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const assignments = await WorkerTaskAssignment.find({
      assignedDate: { $gte: today }
    });
    console.log('\n📝 Task assignments for today:', assignments.length);
    assignments.forEach(a => {
      console.log(`   - Worker ${a.workerId}, Project ${a.projectId}, Task ${a.taskId}`);
    });

    // Find attendance for today
    const attendance = await Attendance.find({
      date: { $gte: today }
    });
    console.log('\n✅ Attendance records for today:', attendance.length);
    attendance.forEach(a => {
      console.log(`   - Employee ${a.employeeId}, Project ${a.projectId}, Status: ${a.status}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkData();
