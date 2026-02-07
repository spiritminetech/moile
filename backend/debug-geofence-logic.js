/**
 * Debug why geofence violations aren't being detected
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';
import Attendance from './src/modules/attendance/Attendance.js';

dotenv.config();

async function debugGeofence() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');

    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today: ${today}\n`);

    // Check Project 1
    console.log('📍 PROJECT 1');
    console.log('='.repeat(60));
    
    const assignments1 = await WorkerTaskAssignment.find({
      projectId: 1,
      date: today
    });
    
    console.log(`Task assignments: ${assignments1.length}`);
    const employeeIds1 = assignments1.map(a => a.employeeId);
    console.log(`Employee IDs: ${employeeIds1.join(', ')}\n`);
    
    for (const empId of employeeIds1) {
      const employee = await Employee.findOne({ id: empId });
      const attendance = await Attendance.findOne({
        employeeId: empId,
        projectId: 1,
        date: { $gte: new Date(today) }
      });
      
      console.log(`Worker ${empId}: ${employee?.fullName || 'Unknown'}`);
      if (attendance) {
        console.log(`  - Has attendance record`);
        console.log(`  - Check-in: ${attendance.checkIn}`);
        if (attendance.checkIn) {
          const checkInDate = new Date(attendance.checkIn);
          const hours = checkInDate.getHours();
          const minutes = checkInDate.getMinutes();
          const checkInTime = hours + minutes / 60;
          console.log(`  - Check-in time: ${hours}:${minutes} (${checkInTime.toFixed(2)} hours)`);
          console.log(`  - After 8:30 AM? ${checkInTime > 8.5 ? 'YES - VIOLATION!' : 'No'}`);
        } else {
          console.log(`  - No check-in time`);
        }
      } else {
        console.log(`  - No attendance record`);
      }
      console.log('');
    }

    await mongoose.disconnect();
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugGeofence();
