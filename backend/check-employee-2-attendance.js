// Check Employee 2 Attendance
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './src/modules/attendance/Attendance.js';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

async function checkAttendance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get Employee 2's latest attendance
    const attendance = await Attendance.findOne({ employeeId: 2 }).sort({ createdAt: -1 });
    
    if (!attendance) {
      console.log('❌ No attendance found for Employee 2');
      return;
    }

    console.log('📋 EMPLOYEE 2 LATEST ATTENDANCE');
    console.log('='.repeat(80));
    console.log('Employee ID:', attendance.employeeId);
    console.log('Project ID:', attendance.projectId);
    console.log('Date:', attendance.date);
    console.log('Check-in:', attendance.checkIn);
    console.log('insideGeofenceAtCheckin:', attendance.insideGeofenceAtCheckin);
    console.log('Last Latitude:', attendance.lastLatitude);
    console.log('Last Longitude:', attendance.lastLongitude);
    console.log('');

    // Try to find the project
    const project = await Project.findOne({ _id: attendance.projectId });
    
    if (project) {
      console.log('📍 PROJECT DETAILS');
      console.log('='.repeat(80));
      console.log('Project Code:', project.projectCode);
      console.log('Project Name:', project.projectName);
      console.log('Project Latitude:', project.latitude);
      console.log('Project Longitude:', project.longitude);
      console.log('Geofence Radius:', project.geofenceRadius);
      console.log('Geofence Object:', JSON.stringify(project.geofence, null, 2));
    } else {
      console.log('❌ Project not found with _id:', attendance.projectId);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkAttendance();
