// Debug geofence calculation logic
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

async function debugGeofence() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const project = await Project.findOne({ id: 1002 });
    
    console.log('📋 PROJECT 1002 RAW DATA');
    console.log('='.repeat(80));
    console.log('project.geofence?.center?.latitude:', project.geofence?.center?.latitude);
    console.log('project.latitude:', project.latitude);
    console.log('project.geofence?.center?.longitude:', project.geofence?.center?.longitude);
    console.log('project.longitude:', project.longitude);
    console.log('project.geofence?.radius:', project.geofence?.radius);
    console.log('project.geofenceRadius:', project.geofenceRadius);
    console.log('project.geofence?.allowedVariance:', project.geofence?.allowedVariance);
    console.log('project.geofence?.strictMode:', project.geofence?.strictMode);

    console.log('\n🔧 BACKEND CALCULATION LOGIC (from workerController.js line 2213-2227)');
    console.log('='.repeat(80));
    
    const centerLat = project.geofence?.center?.latitude || project.latitude || 0;
    const centerLng = project.geofence?.center?.longitude || project.longitude || 0;
    const radius = project.geofence?.radius || project.geofenceRadius || 100;

    console.log('centerLat = project.geofence?.center?.latitude || project.latitude || 0');
    console.log('  Result:', centerLat);
    console.log('');
    console.log('centerLng = project.geofence?.center?.longitude || project.longitude || 0');
    console.log('  Result:', centerLng);
    console.log('');
    console.log('radius = project.geofence?.radius || project.geofenceRadius || 100');
    console.log('  Result:', radius);
    console.log('');

    const projectGeofence = {
      center: {
        latitude: centerLat,
        longitude: centerLng
      },
      radius: radius,
      strictMode: project.geofence?.strictMode !== false,
      allowedVariance: project.geofence?.allowedVariance || 10
    };

    console.log('projectGeofence.strictMode = project.geofence?.strictMode !== false');
    console.log('  Result:', projectGeofence.strictMode);
    console.log('');
    console.log('projectGeofence.allowedVariance = project.geofence?.allowedVariance || 10');
    console.log('  Result:', projectGeofence.allowedVariance);
    console.log('');

    console.log('\n🎯 FINAL GEOFENCE OBJECT USED BY BACKEND:');
    console.log('='.repeat(80));
    console.log(JSON.stringify(projectGeofence, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugGeofence();
