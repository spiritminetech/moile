// Check Geofence Status - Verify if worker is inside or outside geofence
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

async function checkGeofenceStatus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Get worker's current location from attendance record
    console.log('📍 CHECKING WORKER LOCATION\n');
    console.log('=' .repeat(80));
    
    const attendance = await db.collection('attendance').findOne({
      employeeId: 2,
      date: new Date('2026-02-15')
    });

    if (!attendance) {
      console.log('❌ No attendance record found for Employee ID: 2 on 2026-02-15');
      console.log('Worker needs to check in first to have location data');
      await mongoose.connection.close();
      return;
    }

    console.log('✅ Attendance Record Found:');
    console.log('   Employee ID:', attendance.employeeId);
    console.log('   Date:', attendance.date);
    console.log('   Check-in Time:', attendance.checkIn);
    console.log('   Check-in Location:', attendance.checkInLocation);
    
    const workerLocation = attendance.checkInLocation;
    
    let workerLat, workerLon;
    
    // Handle different location formats
    if (workerLocation && workerLocation.coordinates) {
      // GeoJSON format: [longitude, latitude]
      workerLat = workerLocation.coordinates[1];
      workerLon = workerLocation.coordinates[0];
    } else if (workerLocation && workerLocation.latitude && workerLocation.longitude) {
      // Direct lat/lon format
      workerLat = workerLocation.latitude;
      workerLon = workerLocation.longitude;
    } else {
      console.log('\n❌ No location data in attendance record');
      console.log('Worker location is unknown');
      await mongoose.connection.close();
      return;
    }
    
    console.log('\n📍 Worker Current Location:');
    console.log('   Latitude:', workerLat);
    console.log('   Longitude:', workerLon);

    // Get all tasks for the worker
    console.log('\n\n🎯 CHECKING TASKS AND GEOFENCE STATUS\n');
    console.log('=' .repeat(80));

    const tasks = await db.collection('workerTaskAssignment').find({
      employeeId: 2,
      date: '2026-02-15'
    }).toArray();

    if (tasks.length === 0) {
      console.log('❌ No tasks found for Employee ID: 2 on 2026-02-15');
      await mongoose.connection.close();
      return;
    }

    console.log(`✅ Found ${tasks.length} tasks\n`);

    // Get project details for each task
    for (const task of tasks) {
      console.log('─'.repeat(80));
      
      // Get task details from tasks collection
      const taskDetails = await db.collection('tasks').findOne({ id: task.taskId });
      const taskName = taskDetails ? taskDetails.taskName : `Task ${task.taskId}`;
      
      console.log(`\n📋 Task: ${taskName}`);
      console.log(`   Assignment ID: ${task.id}`);
      console.log(`   Task ID: ${task.taskId}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Project ID: ${task.projectId}`);

      // Get project geofence data
      const project = await db.collection('projects').findOne({ id: task.projectId });

      if (!project) {
        console.log('\n   ❌ Project not found');
        continue;
      }

      console.log(`\n   📍 Project: ${project.projectName}`);
      console.log(`   Project Code: ${project.projectCode}`);

      if (!project.geofence || !project.geofence.coordinates) {
        console.log('\n   ⚠️  No geofence configured for this project');
        console.log('   Status: GEOFENCE NOT SET (validation will pass)');
        continue;
      }

      const projectLat = project.geofence.coordinates[1];
      const projectLon = project.geofence.coordinates[0];
      const radius = project.geofence.radius || 100;
      const tolerance = project.geofence.allowedVariance || 20;
      const totalAllowedDistance = radius + tolerance;

      console.log('\n   📍 Project Geofence:');
      console.log(`      Latitude: ${projectLat}`);
      console.log(`      Longitude: ${projectLon}`);
      console.log(`      Radius: ${radius}m`);
      console.log(`      Tolerance: ${tolerance}m`);
      console.log(`      Total Allowed Distance: ${totalAllowedDistance}m`);

      // Calculate distance
      const distance = calculateDistance(workerLat, workerLon, projectLat, projectLon);

      console.log('\n   📏 Distance Calculation:');
      console.log(`      Distance from worker to project: ${distance.toFixed(2)}m`);
      console.log(`      Allowed distance: ${totalAllowedDistance}m`);

      // Determine status
      const isInside = distance <= totalAllowedDistance;
      
      console.log('\n   🎯 GEOFENCE STATUS:');
      if (isInside) {
        console.log(`      ✅ INSIDE GEOFENCE`);
        console.log(`      Worker is ${distance.toFixed(2)}m from project site`);
        console.log(`      Within allowed range of ${totalAllowedDistance}m`);
        console.log(`      Start Task button: ENABLED (green)`);
      } else {
        const excess = distance - totalAllowedDistance;
        console.log(`      ❌ OUTSIDE GEOFENCE`);
        console.log(`      Worker is ${distance.toFixed(2)}m from project site`);
        console.log(`      Exceeds allowed range by ${excess.toFixed(2)}m`);
        console.log(`      Start Task button: DISABLED (red - "Outside Geo-Fence")`);
      }

      // Show Google Maps link
      console.log('\n   🗺️  View on Google Maps:');
      console.log(`      Worker: https://www.google.com/maps?q=${workerLat},${workerLon}`);
      console.log(`      Project: https://www.google.com/maps?q=${projectLat},${projectLon}`);
      console.log(`      Directions: https://www.google.com/maps/dir/${workerLat},${workerLon}/${projectLat},${projectLon}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Geofence status check complete\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkGeofenceStatus();
