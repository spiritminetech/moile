import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

// Target coordinates for School Campus Renovation
const LATITUDE = 12.9716;
const LONGITUDE = 77.5946;
const GEOFENCE_RADIUS = 50000; // 50 km radius

async function setSchoolCampusLocation() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');

    // Find School Campus Renovation project
    const project = await Project.findOne({ 
      projectName: /school.*campus.*renovation/i 
    });

    if (!project) {
      console.log('❌ School Campus Renovation project not found');
      console.log('\nSearching for all projects...');
      const allProjects = await Project.find({}, 'projectName latitude longitude');
      console.log('Available projects:');
      allProjects.forEach(p => {
        console.log(`  - ${p.projectName} (ID: ${p._id})`);
        console.log(`    Current location: ${p.latitude}, ${p.longitude}`);
      });
      return;
    }

    console.log(`\n📍 Found project: ${project.projectName}`);
    console.log(`   Project ID: ${project._id}`);
    console.log(`   Old latitude: ${project.latitude}`);
    console.log(`   Old longitude: ${project.longitude}`);
    
    if (project.geofence) {
      console.log(`   Old geofence center: ${project.geofence.latitude}, ${project.geofence.longitude}`);
    }

    // Update ALL location fields with geofence
    const updateResult = await Project.updateOne(
      { _id: project._id },
      {
        $set: {
          latitude: LATITUDE,
          longitude: LONGITUDE,
          address: 'School Campus, Bangalore, Karnataka, India',
          'coordinates.latitude': LATITUDE,
          'coordinates.longitude': LONGITUDE,
          'geofence.enabled': true,
          'geofence.radius': GEOFENCE_RADIUS,
          'geofence.latitude': LATITUDE,
          'geofence.longitude': LONGITUDE,
          'geofence.center.latitude': LATITUDE,
          'geofence.center.longitude': LONGITUDE,
          'geofence.allowedVariance': 5000,
          'geofence.strictMode': false,
          geofenceRadius: GEOFENCE_RADIUS
        }
      }
    );

    console.log(`\n✅ Location updated successfully!`);
    console.log(`   New location: ${LATITUDE}, ${LONGITUDE}`);
    console.log(`   Geofence: Enabled (${GEOFENCE_RADIUS}m / ${GEOFENCE_RADIUS/1000}km radius)`);
    console.log(`   Modified: ${updateResult.modifiedCount} document(s)`);

    // Verify the update
    const updatedProject = await Project.findById(project._id);
    console.log('\n📋 Verification:');
    console.log(`   Project: ${updatedProject.projectName}`);
    console.log(`   Latitude: ${updatedProject.latitude}`);
    console.log(`   Longitude: ${updatedProject.longitude}`);
    console.log(`   Coordinates: ${updatedProject.coordinates?.latitude}, ${updatedProject.coordinates?.longitude}`);
    console.log(`   Geofence enabled: ${updatedProject.geofence?.enabled}`);
    console.log(`   Geofence center: ${updatedProject.geofence?.latitude}, ${updatedProject.geofence?.longitude}`);
    console.log(`   Geofence radius: ${updatedProject.geofence?.radius}m`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

setSchoolCampusLocation();
