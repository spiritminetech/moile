// Quick Set - Update Project Location to Your Current Location
// Simple script to update all projects to your coordinates

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false, collection: 'projects' }));

async function quickSetMyLocation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ============================================
    // 🎯 PASTE YOUR COORDINATES HERE
    // ============================================
    // Get these from the mobile app's "Your Current Location" section
    
    const MY_LATITUDE = 12.9716;   // 👈 CHANGE THIS
    const MY_LONGITUDE = 77.5946;  // 👈 CHANGE THIS

    console.log('\n' + '='.repeat(60));
    console.log('📍 SETTING ALL PROJECTS TO YOUR LOCATION');
    console.log('='.repeat(60));
    console.log(`\nYour Coordinates:`);
    console.log(`  Latitude:  ${MY_LATITUDE}`);
    console.log(`  Longitude: ${MY_LONGITUDE}`);
    console.log(`  Radius:    100m (with 20m tolerance)`);

    // Update all projects
    const result = await Project.updateMany(
      {},
      {
        $set: {
          'geofence.latitude': MY_LATITUDE,
          'geofence.longitude': MY_LONGITUDE,
          'geofence.radius': 100,
          'geofence.enabled': true
        }
      }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} projects`);

    // Show updated projects
    const projects = await Project.find({});
    console.log('\n📋 Updated Projects:');
    projects.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.name || 'Project ' + p.projectId}`);
      console.log(`   Location: ${p.geofence?.latitude}, ${p.geofence?.longitude}`);
      console.log(`   Radius: ${p.geofence?.radius}m`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ DONE! You can now start tasks from your location!');
    console.log('🔄 Reload your mobile app to see the changes.');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

quickSetMyLocation();
