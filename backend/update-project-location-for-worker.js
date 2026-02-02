import mongoose from 'mongoose';
import Project from './src/modules/project/models/Project.js';
import appConfig from './src/config/app.config.js';

async function updateProjectLocationForWorker() {
  try {
    // Connect to MongoDB
    await mongoose.connect(appConfig.database.uri, { 
      dbName: appConfig.database.name,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Get user's current location (you can modify these coordinates to your actual location)
    console.log('\n📍 Please provide your current location coordinates:');
    console.log('You can get these from:');
    console.log('- Google Maps: Right-click and select coordinates');
    console.log('- Your phone GPS');
    console.log('- https://www.latlong.net/');
    
    // Example coordinates - replace with your actual location
    const workerLocation = {
      // Default to a location in Singapore - update these with your actual coordinates
      latitude: 1.3521,   // Replace with your actual latitude
      longitude: 103.8198, // Replace with your actual longitude
      locationName: "Worker's Current Location" // You can update this description
    };

    console.log(`\n🎯 Updating project location to: ${workerLocation.latitude}, ${workerLocation.longitude}`);
    console.log(`📍 Location: ${workerLocation.locationName}`);

    // Find Project 1001 (Orchard Road Office Tower Maintenance)
    const project = await Project.findOne({ id: 1001, companyId: 1 });
    
    if (!project) {
      console.log('❌ Project 1001 not found');
      return;
    }

    console.log(`\n📋 Current Project Details:`);
    console.log(`Name: ${project.projectName}`);
    console.log(`Current Location: ${project.latitude}, ${project.longitude}`);
    console.log(`Current Geofence Radius: ${project.geofenceRadius}m`);

    // Update project location
    const updateResult = await Project.updateOne(
      { id: 1001, companyId: 1 },
      {
        $set: {
          latitude: workerLocation.latitude,
          longitude: workerLocation.longitude,
          'geofence.center.latitude': workerLocation.latitude,
          'geofence.center.longitude': workerLocation.longitude,
          // Keep a reasonable geofence radius for testing
          geofenceRadius: 200, // 200 meters radius
          'geofence.radius': 200,
          // Make geofence less strict for testing
          'geofence.strictMode': false,
          'geofence.allowedVariance': 50
        }
      }
    );

    if (updateResult.modifiedCount > 0) {
      console.log('\n✅ Project location updated successfully!');
      
      // Verify the update
      const updatedProject = await Project.findOne({ id: 1001, companyId: 1 });
      console.log(`\n📋 Updated Project Details:`);
      console.log(`Name: ${updatedProject.projectName}`);
      console.log(`New Location: ${updatedProject.latitude}, ${updatedProject.longitude}`);
      console.log(`New Geofence Radius: ${updatedProject.geofenceRadius}m`);
      console.log(`Geofence Center: ${updatedProject.geofence.center.latitude}, ${updatedProject.geofence.center.longitude}`);
      console.log(`Strict Mode: ${updatedProject.geofence.strictMode}`);
      console.log(`Allowed Variance: ${updatedProject.geofence.allowedVariance}m`);
      
      console.log('\n🎉 Now worker@gmail.com should be able to check in!');
      console.log('📱 The worker can now check in from within 200 meters of the new location.');
      
    } else {
      console.log('❌ No project was updated. Please check the project ID and company ID.');
    }

  } catch (error) {
    console.error('❌ Error updating project location:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Instructions for customizing location
console.log('🔧 CUSTOMIZATION INSTRUCTIONS:');
console.log('=====================================');
console.log('To set the project location to your exact location:');
console.log('1. Open this file: backend/update-project-location-for-worker.js');
console.log('2. Update the workerLocation object with your coordinates:');
console.log('   - latitude: Your GPS latitude');
console.log('   - longitude: Your GPS longitude');
console.log('   - locationName: Description of your location');
console.log('3. Run this script again');
console.log('');
console.log('📍 How to get your coordinates:');
console.log('- Google Maps: Right-click → "What\'s here?" → Copy coordinates');
console.log('- Phone: Use GPS coordinates from maps app');
console.log('- Website: Visit https://www.latlong.net/');
console.log('');

updateProjectLocationForWorker();