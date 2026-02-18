import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Project Schema
const ProjectSchema = new mongoose.Schema({
  id: Number,
  projectCode: String,
  projectName: String,
  latitude: Number,
  longitude: Number,
  geofenceRadius: Number,
  geofence: {
    center: {
      latitude: Number,
      longitude: Number
    },
    radius: Number,
    strictMode: Boolean,
    allowedVariance: Number,
    enabled: Boolean
  }
}, { timestamps: true });

const Project = mongoose.model('Project', ProjectSchema);

async function updateProjectGeofenceVariance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Your project ID
    const projectId = 1002;
    
    // Find the project
    const project = await Project.findOne({ id: projectId });
    
    if (!project) {
      console.log('❌ Project not found!');
      return;
    }

    console.log('📋 Current Project Settings:');
    console.log('─────────────────────────────');
    console.log(`Project: ${project.projectName} (${project.projectCode})`);
    console.log(`\nCurrent Geofence Settings:`);
    console.log(`  Radius: ${project.geofence?.radius || project.geofenceRadius || 100}m`);
    console.log(`  Allowed Variance: ${project.geofence?.allowedVariance || 10}m`);
    console.log(`  Total Allowed: ${(project.geofence?.radius || 100) + (project.geofence?.allowedVariance || 10)}m`);
    
    // NEW SETTINGS - Change these values as needed
    const newVariance = 50;  // ← Change this to 24, 30, 50, etc.
    const newRadius = 100;   // ← Keep or change the radius
    
    console.log(`\n🔄 Updating to:`);
    console.log(`  Radius: ${newRadius}m`);
    console.log(`  Allowed Variance: ${newVariance}m`);
    console.log(`  Total Allowed: ${newRadius + newVariance}m`);
    
    // Update the project
    const result = await Project.updateOne(
      { id: projectId },
      {
        $set: {
          'geofence.radius': newRadius,
          'geofence.allowedVariance': newVariance,
          'geofence.strictMode': false,
          'geofence.enabled': true,
          'geofence.center.latitude': project.latitude || 9.908612,
          'geofence.center.longitude': project.longitude || 78.090842
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('\n✅ Project updated successfully!');
      
      // Verify the update
      const updatedProject = await Project.findOne({ id: projectId });
      console.log('\n📋 New Settings:');
      console.log('─────────────────────────────');
      console.log(`  Radius: ${updatedProject.geofence.radius}m`);
      console.log(`  Allowed Variance: ${updatedProject.geofence.allowedVariance}m`);
      console.log(`  Total Allowed: ${updatedProject.geofence.radius + updatedProject.geofence.allowedVariance}m`);
      console.log(`  Strict Mode: ${updatedProject.geofence.strictMode}`);
      
      console.log('\n💡 What this means:');
      console.log(`  Workers can check in from up to ${updatedProject.geofence.radius + updatedProject.geofence.allowedVariance}m away`);
      console.log(`  GPS accuracy of 24m will be accepted ✅`);
    } else {
      console.log('\n⚠️  No changes made (values might be the same)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the update
updateProjectGeofenceVariance();

/* 
USAGE:
1. Change the values at line 42-43:
   - newVariance: Set to 24, 30, 50, etc. (extra buffer for GPS accuracy)
   - newRadius: Set to 100, 200, 500, etc. (main work area size)

2. Run: node update-project-geofence-variance.js

EXAMPLES:
- For 24m GPS accuracy: newVariance = 30 (gives some extra buffer)
- For 50m GPS accuracy: newVariance = 60
- For large site: newRadius = 500, newVariance = 50
*/
