import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import Project from './src/modules/project/models/Project.js';

const updateProjectLocationForTesting = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'erp',
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find the project that the worker is assigned to
    const projectId = 1003; // The project ID from the worker setup
    
    // You can update these coordinates to match your actual location
    // For testing purposes, I'll use a generic location that allows geofencing to work
    const testLocation = {
      latitude: 40.7128,  // New York City coordinates (you can change these)
      longitude: -74.0060,
      radius: 500 // Increased radius for easier testing
    };

    // Alternative: Use a location that's more permissive for testing
    const permissiveLocation = {
      latitude: 0.0,  // Null Island - very permissive for testing
      longitude: 0.0,
      radius: 50000 // 50km radius - very large for testing
    };

    console.log('🔍 Finding project to update...');
    const project = await Project.findOne({ id: projectId });
    
    if (!project) {
      console.error(`❌ Project with ID ${projectId} not found`);
      return;
    }

    console.log(`📍 Current project location: ${project.latitude}, ${project.longitude}`);
    console.log(`📏 Current geofence radius: ${project.geofenceRadius}m`);

    // Update project with test-friendly location
    const updatedProject = await Project.findOneAndUpdate(
      { id: projectId },
      {
        $set: {
          latitude: testLocation.latitude,
          longitude: testLocation.longitude,
          geofenceRadius: testLocation.radius,
          'geofence.center.latitude': testLocation.latitude,
          'geofence.center.longitude': testLocation.longitude,
          'geofence.radius': testLocation.radius,
          'geofence.strictMode': false, // Disable strict mode for testing
          'geofence.allowedVariance': 100 // Increase allowed variance
        }
      },
      { new: true }
    );

    console.log('✅ Project location updated successfully!');
    console.log('=====================================');
    console.log(`📍 New location: ${updatedProject.latitude}, ${updatedProject.longitude}`);
    console.log(`📏 New geofence radius: ${updatedProject.geofenceRadius}m`);
    console.log(`🔒 Strict mode: ${updatedProject.geofence.strictMode}`);
    console.log(`📐 Allowed variance: ${updatedProject.geofence.allowedVariance}m`);
    
    console.log('\n💡 Testing Tips:');
    console.log('1. The geofence is now more permissive for testing');
    console.log('2. Strict mode is disabled');
    console.log('3. Large radius allows testing from various locations');
    console.log('4. If location services are still disabled, the app should handle it gracefully');

    // Also create a completely permissive test project
    console.log('\n🧪 Creating a test-friendly project...');
    
    const lastProject = await Project.findOne().sort({ id: -1 });
    const nextProjectId = lastProject ? lastProject.id + 1 : 1;
    
    const testProject = new Project({
      id: nextProjectId,
      companyId: 1,
      projectCode: `TEST${nextProjectId.toString().padStart(3, '0')}`,
      projectName: 'Test Project - No Geofence',
      description: 'Test project with disabled geofencing for development',
      jobNature: 'Testing',
      jobSubtype: 'Development',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: 'Ongoing',
      address: 'Test Location - Anywhere',
      latitude: 0.0,
      longitude: 0.0,
      geofenceRadius: 999999, // Very large radius
      geofence: {
        center: {
          latitude: 0.0,
          longitude: 0.0
        },
        radius: 999999,
        strictMode: false,
        allowedVariance: 999999
      }
    });

    await testProject.save();
    console.log(`✅ Test project created with ID: ${nextProjectId}`);
    console.log('📍 This project has no geofence restrictions');

  } catch (error) {
    console.error('❌ Error updating project location:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the update
updateProjectLocationForTesting();