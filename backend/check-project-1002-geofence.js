// Check Project 1002 Geofence Configuration
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/modules/project/models/Project.js';
import Attendance from './src/modules/attendance/Attendance.js';
import { validateGeofence, calculateDistance } from './utils/geofenceUtil.js';

dotenv.config();

async function checkGeofenceConfig() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get Project with id 1002 (not projectId)
    const project = await Project.findOne({ id: 1002 });
    
    if (!project) {
      console.log('❌ Project 1002 not found');
      return;
    }

    console.log('📋 PROJECT 1002 GEOFENCE CONFIGURATION');
    console.log('='.repeat(80));
    console.log('Project Name:', project.projectName);
    console.log('Project Code:', project.projectCode);
    console.log('\n📍 Geofence Data:');
    console.log('  project.geofence:', JSON.stringify(project.geofence, null, 2));
    console.log('  project.latitude:', project.latitude);
    console.log('  project.longitude:', project.longitude);
    console.log('  project.geofenceRadius:', project.geofenceRadius);

    // Prepare geofence object (same logic as workerController)
    const centerLat = project.geofence?.center?.latitude || project.latitude || 0;
    const centerLng = project.geofence?.center?.longitude || project.longitude || 0;
    const radius = project.geofence?.radius || project.geofenceRadius || 100;

    const projectGeofence = {
      center: {
        latitude: centerLat,
        longitude: centerLng
      },
      radius: radius,
      strictMode: project.geofence?.strictMode !== false,
      allowedVariance: project.geofence?.allowedVariance || 10
    };

    console.log('\n🎯 Calculated Geofence Object:');
    console.log(JSON.stringify(projectGeofence, null, 2));

    // Get latest attendance for Employee 2
    const attendance = await Attendance.findOne({ 
      employeeId: 2,
      projectId: 1002
    }).sort({ createdAt: -1 });

    if (attendance && attendance.lastLatitude && attendance.lastLongitude) {
      console.log('\n📍 Employee 2 Latest Location (from Attendance):');
      console.log('  Latitude:', attendance.lastLatitude);
      console.log('  Longitude:', attendance.lastLongitude);
      console.log('  Check-in:', attendance.checkIn);
      console.log('  insideGeofenceAtCheckin:', attendance.insideGeofenceAtCheckin);

      // Calculate distance
      const distance = calculateDistance(
        attendance.lastLatitude,
        attendance.lastLongitude,
        projectGeofence.center.latitude,
        projectGeofence.center.longitude
      );

      console.log('\n📏 Distance Calculation:');
      console.log('  Distance from project center:', distance.toFixed(2), 'meters');
      console.log('  Geofence radius:', projectGeofence.radius, 'meters');
      console.log('  Allowed variance:', projectGeofence.allowedVariance, 'meters');
      console.log('  Total allowed distance:', (projectGeofence.radius + projectGeofence.allowedVariance), 'meters');

      // Validate geofence
      const validation = validateGeofence(
        { latitude: attendance.lastLatitude, longitude: attendance.lastLongitude },
        projectGeofence
      );

      console.log('\n✅ Geofence Validation Result:');
      console.log(JSON.stringify(validation, null, 2));

      if (validation.insideGeofence) {
        console.log('\n🟢 RESULT: Employee 2 is INSIDE the geofence');
      } else {
        console.log('\n🔴 RESULT: Employee 2 is OUTSIDE the geofence');
        console.log('   Distance exceeds allowed range by:', (distance - (projectGeofence.radius + projectGeofence.allowedVariance)).toFixed(2), 'meters');
      }
    } else {
      console.log('\n❌ No location data found for Employee 2 in attendance records');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkGeofenceConfig();
