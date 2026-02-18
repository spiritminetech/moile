import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Project Schema
const ProjectSchema = new mongoose.Schema({}, { strict: false, collection: 'projects' });
const Project = mongoose.model('Project', ProjectSchema);

async function updateProjectLocationAccuracy() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all projects with location data
    const projects = await Project.find({
      $or: [
        { latitude: { $exists: true, $ne: null } },
        { 'geofence.center.latitude': { $exists: true, $ne: null } }
      ]
    });

    console.log(`\n📊 Found ${projects.length} projects with location data\n`);

    projects.forEach((project, index) => {
      console.log(`${index + 1}. Project: ${project.projectName || 'Unnamed'}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Code: ${project.projectCode || 'N/A'}`);
      
      // Show current location data
      console.log('\n   📍 Current Location Data:');
      
      if (project.latitude && project.longitude) {
        console.log(`   - latitude: ${project.latitude}`);
        console.log(`   - longitude: ${project.longitude}`);
        console.log(`   - geofenceRadius: ${project.geofenceRadius || 'Not set'}`);
      }
      
      if (project.geofence?.center) {
        console.log(`   - geofence.center.latitude: ${project.geofence.center.latitude}`);
        console.log(`   - geofence.center.longitude: ${project.geofence.center.longitude}`);
        console.log(`   - geofence.radius: ${project.geofence.radius || 100}`);
        console.log(`   - geofence.strictMode: ${project.geofence.strictMode !== false}`);
        console.log(`   - geofence.allowedVariance: ${project.geofence.allowedVariance || 10}`);
      }
      
      console.log('\n' + '='.repeat(80) + '\n');
    });

    console.log('\n📝 LOCATION FIELDS EXPLANATION:\n');
    console.log('The Project model has TWO sets of location fields:\n');
    
    console.log('1️⃣ LEGACY FIELDS (Old structure):');
    console.log('   - latitude: Number');
    console.log('   - longitude: Number');
    console.log('   - geofenceRadius: Number (in meters)\n');
    
    console.log('2️⃣ NEW GEOFENCE OBJECT (Enhanced structure):');
    console.log('   - geofence.center.latitude: Number');
    console.log('   - geofence.center.longitude: Number');
    console.log('   - geofence.radius: Number (default: 100 meters)');
    console.log('   - geofence.strictMode: Boolean (default: true)');
    console.log('   - geofence.allowedVariance: Number (default: 10 meters)\n');
    
    console.log('📱 HOW TODAY\'S TASKS USES THIS DATA:\n');
    console.log('The getWorkerTasksToday function (line 738-780) reads location like this:');
    console.log('   const centerLat = project.geofence?.center?.latitude || project.latitude || 0;');
    console.log('   const centerLng = project.geofence?.center?.longitude || project.longitude || 0;');
    console.log('   const radius = project.geofence?.radius || project.geofenceRadius || 100;\n');
    
    console.log('🎯 PRIORITY ORDER:');
    console.log('   1. geofence.center.latitude/longitude (NEW - preferred)');
    console.log('   2. latitude/longitude (LEGACY - fallback)');
    console.log('   3. 0 (default if nothing set)\n');

    console.log('✏️ TO UPDATE MANUALLY, USE ONE OF THESE METHODS:\n');
    
    console.log('METHOD 1: Update using MongoDB Compass or Studio 3T');
    console.log('   Collection: projects');
    console.log('   Find: { id: <project_id> }');
    console.log('   Update the fields directly in the GUI\n');
    
    console.log('METHOD 2: Update using MongoDB shell');
    console.log('   db.projects.updateOne(');
    console.log('     { id: <project_id> },');
    console.log('     {');
    console.log('       $set: {');
    console.log('         "geofence.center.latitude": <your_latitude>,');
    console.log('         "geofence.center.longitude": <your_longitude>,');
    console.log('         "geofence.radius": <radius_in_meters>,');
    console.log('         "geofence.strictMode": true,');
    console.log('         "geofence.allowedVariance": 10');
    console.log('       }');
    console.log('     }');
    console.log('   )\n');
    
    console.log('METHOD 3: Create a custom update script (see example below)\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Example function to update a specific project
async function updateSpecificProject(projectId, locationData) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const updateData = {
      'geofence.center.latitude': locationData.latitude,
      'geofence.center.longitude': locationData.longitude,
      'geofence.radius': locationData.radius || 100,
      'geofence.strictMode': locationData.strictMode !== false,
      'geofence.allowedVariance': locationData.allowedVariance || 10,
      'geofence.requiredAccuracy': locationData.requiredAccuracy || 50
    };
    
    // Also update legacy fields for backward compatibility
    updateData.latitude = locationData.latitude;
    updateData.longitude = locationData.longitude;
    updateData.geofenceRadius = locationData.radius || 100;
    
    const result = await Project.updateOne(
      { id: projectId },
      { $set: updateData }
    );
    
    console.log(`✅ Updated project ${projectId}:`, result);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error updating project:', error);
    process.exit(1);
  }
}

// Run the analysis
updateProjectLocationAccuracy();

// USAGE EXAMPLES:
// 
// To update a specific project, uncomment and modify:
// updateSpecificProject(1, {
//   latitude: 25.2048,
//   longitude: 55.2708,
//   radius: 150,
//   strictMode: true,
//   allowedVariance: 20
// });
