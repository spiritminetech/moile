// Test coordinate calculation logic
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/modules/project/models/Project.js';

dotenv.config({ path: './.env' });

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function testCoordinateLogic() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const project = await Project.findOne({ id: 1003 });
    if (!project) {
      console.log('❌ Project not found');
      return;
    }

    // Test user location (Bangalore coordinates)
    const userLat = 12.9716;
    const userLng = 77.5946;

    console.log('🧪 Testing coordinate calculation logic:');
    console.log('=' .repeat(50));
    
    // OLD LOGIC (what was causing the issue)
    console.log('❌ OLD LOGIC:');
    const oldDistance = getDistanceFromLatLonInMeters(
      userLat, userLng,
      project.latitude, project.longitude  // Singapore coordinates
    );
    console.log(`  User: ${userLat}, ${userLng} (Bangalore)`);
    console.log(`  Project: ${project.latitude}, ${project.longitude} (Singapore)`);
    console.log(`  Distance: ${oldDistance.toFixed(2)} meters`);
    console.log(`  Radius: ${project.geofenceRadius} meters`);
    console.log(`  Valid: ${oldDistance <= project.geofenceRadius ? 'YES' : 'NO'}`);
    
    console.log('');
    
    // NEW LOGIC (what should work)
    console.log('✅ NEW LOGIC:');
    const centerLat = project.geofence?.center?.latitude || project.latitude || 0;
    const centerLng = project.geofence?.center?.longitude || project.longitude || 0;
    const radius = project.geofence?.radius || project.geofenceRadius || 100;
    
    const newDistance = getDistanceFromLatLonInMeters(
      userLat, userLng,
      centerLat, centerLng  // Bangalore coordinates from geofence
    );
    console.log(`  User: ${userLat}, ${userLng} (Bangalore)`);
    console.log(`  Project Center: ${centerLat}, ${centerLng} (Bangalore)`);
    console.log(`  Distance: ${newDistance.toFixed(2)} meters`);
    console.log(`  Radius: ${radius} meters`);
    console.log(`  Valid: ${newDistance <= radius ? 'YES' : 'NO'}`);
    
    console.log('');
    console.log('📊 Summary:');
    console.log(`  Old logic distance: ${oldDistance.toFixed(2)}m (should be ~3,163,597m)`);
    console.log(`  New logic distance: ${newDistance.toFixed(2)}m (should be ~0m)`);
    console.log(`  Fix working: ${newDistance < 100 ? 'YES ✅' : 'NO ❌'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testCoordinateLogic();