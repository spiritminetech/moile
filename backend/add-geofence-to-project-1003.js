// Add Geofence to School Campus Renovation Project (ID: 1003)
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function addGeofence() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Get current project data
    console.log('📍 CURRENT PROJECT STATUS\n');
    console.log('='.repeat(80));
    
    const project = await db.collection('projects').findOne({ id: 1003 });

    if (!project) {
      console.log('❌ Project ID 1003 not found');
      await mongoose.connection.close();
      return;
    }

    console.log('Project Found:');
    console.log('  ID:', project.id);
    console.log('  Name:', project.projectName);
    console.log('  Code:', project.projectCode);
    console.log('  Current Geofence:', project.geofence || 'NOT SET');

    // Use worker's current location as the project site location
    // This is from the attendance check-in: 12.9716, 77.5946 (Bangalore)
    const geofenceData = {
      type: 'Point',
      coordinates: [77.5946, 12.9716], // [longitude, latitude] - GeoJSON format
      radius: 100,                      // 100 meters radius
      allowedVariance: 20               // 20 meters tolerance for GPS accuracy
    };

    console.log('\n\n📍 ADDING GEOFENCE CONFIGURATION\n');
    console.log('='.repeat(80));
    console.log('\nGeofence Details:');
    console.log('  Type:', geofenceData.type);
    console.log('  Coordinates: [', geofenceData.coordinates[0], ',', geofenceData.coordinates[1], ']');
    console.log('  Longitude:', geofenceData.coordinates[0]);
    console.log('  Latitude:', geofenceData.coordinates[1]);
    console.log('  Radius:', geofenceData.radius, 'meters');
    console.log('  Tolerance:', geofenceData.allowedVariance, 'meters');
    console.log('  Total Allowed Distance:', geofenceData.radius + geofenceData.allowedVariance, 'meters');

    // Update project with geofence
    const result = await db.collection('projects').updateOne(
      { id: 1003 },
      {
        $set: {
          geofence: geofenceData,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('\n✅ Geofence added successfully!');
      
      // Verify the update
      const updatedProject = await db.collection('projects').findOne({ id: 1003 });
      
      console.log('\n\n📊 VERIFICATION\n');
      console.log('='.repeat(80));
      console.log('\nUpdated Project:');
      console.log('  ID:', updatedProject.id);
      console.log('  Name:', updatedProject.projectName);
      console.log('  Geofence:', JSON.stringify(updatedProject.geofence, null, 2));
      
      console.log('\n\n🎯 GEOFENCE VALIDATION NOW ACTIVE\n');
      console.log('='.repeat(80));
      console.log('\nWhat happens now:');
      console.log('  ✅ Mobile app will calculate distance from worker to project site');
      console.log('  ✅ If within 120m (100m radius + 20m tolerance): Button ENABLED');
      console.log('  ❌ If beyond 120m: Button DISABLED with "Outside Geo-Fence" message');
      console.log('\nWorker Current Location:');
      console.log('  Latitude: 12.9716');
      console.log('  Longitude: 77.5946');
      console.log('  Status: INSIDE GEOFENCE (same as project location)');
      console.log('\n📱 Rebuild the mobile app to see the geofence validation in action!');
      
      console.log('\n\n🗺️  View on Google Maps:');
      console.log('  Project Site: https://www.google.com/maps?q=12.9716,77.5946');
      console.log('  Draw Circle: https://www.google.com/maps?q=12.9716,77.5946&z=17');
      
    } else {
      console.log('\n⚠️  No changes made (geofence may already exist)');
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

addGeofence();
