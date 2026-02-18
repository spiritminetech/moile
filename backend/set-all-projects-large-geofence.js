import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

// Set large geofence for testing
const GEOFENCE_RADIUS = 50000; // 50 km
const ALLOWED_VARIANCE = 5000; // 5 km

async function setAllProjectsLargeGeofence() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');

    // Get all projects
    const projects = await Project.find({});
    console.log(`📋 Found ${projects.length} projects\n`);

    for (const project of projects) {
      console.log(`Updating: ${project.projectName || 'Unnamed'} (ID: ${project.id})`);
      console.log(`  Old radius: ${project.geofenceRadius || project.geofence?.radius || 'N/A'}m`);
      
      // Update with large geofence
      const updateResult = await Project.updateOne(
        { _id: project._id },
        {
          $set: {
            geofenceRadius: GEOFENCE_RADIUS,
            'geofence.enabled': true,
            'geofence.radius': GEOFENCE_RADIUS,
            'geofence.allowedVariance': ALLOWED_VARIANCE,
            'geofence.strictMode': false,
            'geofence.latitude': project.latitude || project.geofence?.latitude || 12.9716,
            'geofence.longitude': project.longitude || project.geofence?.longitude || 77.5946,
            'geofence.center.latitude': project.latitude || project.geofence?.latitude || 12.9716,
            'geofence.center.longitude': project.longitude || project.geofence?.longitude || 77.5946
          }
        }
      );
      
      console.log(`  ✅ New radius: ${GEOFENCE_RADIUS}m (${GEOFENCE_RADIUS/1000}km)`);
      console.log(`  Modified: ${updateResult.modifiedCount} document(s)\n`);
    }

    console.log(`\n✅ All ${projects.length} projects updated with 50km geofence!`);
    console.log(`\n📝 Summary:`);
    console.log(`   Geofence radius: ${GEOFENCE_RADIUS}m (${GEOFENCE_RADIUS/1000}km)`);
    console.log(`   Allowed variance: ${ALLOWED_VARIANCE}m (${ALLOWED_VARIANCE/1000}km)`);
    console.log(`   Total allowed distance: ${(GEOFENCE_RADIUS + ALLOWED_VARIANCE)/1000}km`);
    console.log(`   Strict mode: Disabled (for easier testing)`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

setAllProjectsLargeGeofence();
