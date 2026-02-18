// Set Project Location to Your Current Location
// This script updates the project geofence to match your current GPS coordinates

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false, collection: 'projects' }));

async function setProjectToMyLocation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ============================================
    // 🎯 ENTER YOUR CURRENT LOCATION HERE
    // ============================================
    // You can get these from your mobile app's location display
    // or from Google Maps by right-clicking your location
    
    const MY_LATITUDE = 12.9716;   // 👈 CHANGE THIS to your latitude
    const MY_LONGITUDE = 77.5946;  // 👈 CHANGE THIS to your longitude
    const GEOFENCE_RADIUS = 100;   // Radius in meters (default 100m)

    console.log('\n📍 Your Location:');
    console.log(`   Latitude: ${MY_LATITUDE}`);
    console.log(`   Longitude: ${MY_LONGITUDE}`);
    console.log(`   Radius: ${GEOFENCE_RADIUS}m`);

    // Get all projects
    const projects = await Project.find({});
    console.log(`\n📋 Found ${projects.length} projects`);

    if (projects.length === 0) {
      console.log('❌ No projects found in database');
      process.exit(0);
    }

    // Display projects
    console.log('\n🏗️ Available Projects:');
    projects.forEach((project, index) => {
      console.log(`\n${index + 1}. ${project.name || 'Unnamed Project'}`);
      console.log(`   Project ID: ${project.projectId}`);
      console.log(`   Current Location: ${project.geofence?.latitude || 'Not set'}, ${project.geofence?.longitude || 'Not set'}`);
      console.log(`   Current Radius: ${project.geofence?.radius || 'Not set'}m`);
    });

    // Update ALL projects to your location
    console.log('\n🔄 Updating ALL projects to your location...');
    
    for (const project of projects) {
      const result = await Project.updateOne(
        { _id: project._id },
        {
          $set: {
            'geofence.latitude': MY_LATITUDE,
            'geofence.longitude': MY_LONGITUDE,
            'geofence.radius': GEOFENCE_RADIUS,
            'geofence.enabled': true
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Updated: ${project.name || project.projectId}`);
      }
    }

    // Verify updates
    console.log('\n✅ Verification - Updated Projects:');
    const updatedProjects = await Project.find({});
    updatedProjects.forEach((project, index) => {
      console.log(`\n${index + 1}. ${project.name || 'Unnamed Project'}`);
      console.log(`   Project ID: ${project.projectId}`);
      console.log(`   New Location: ${project.geofence?.latitude}, ${project.geofence?.longitude}`);
      console.log(`   New Radius: ${project.geofence?.radius}m`);
      console.log(`   Enabled: ${project.geofence?.enabled}`);
    });

    console.log('\n✅ All projects updated successfully!');
    console.log('\n📱 Now you can start tasks from your current location!');
    console.log('🔄 Restart your mobile app to see the changes.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

setProjectToMyLocation();
