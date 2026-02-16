import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkPaintTaskGeofence() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false, collection: 'projects' }));

    // Find the Paint Interior Walls task
    console.log('🔍 Searching for "Paint Interior Walls" task...\n');
    
    const paintTask = await WorkerTaskAssignment.findOne({
      taskName: /Paint Interior Walls/i
    }).lean();

    if (!paintTask) {
      console.log('❌ Task "Paint Interior Walls" not found!');
      console.log('\n📋 Available tasks:');
      const allTasks = await WorkerTaskAssignment.find({}).select('taskName projectId').lean();
      allTasks.forEach(task => {
        console.log(`  - ${task.taskName} (Project: ${task.projectId})`);
      });
      return;
    }

    console.log('✅ Found task:', paintTask.taskName);
    console.log('Assignment ID:', paintTask.assignmentId);
    console.log('Project ID:', paintTask.projectId);
    console.log('Status:', paintTask.status);
    console.log('\n' + '='.repeat(80));

    // Check if task has geofence data
    console.log('\n📍 TASK GEOFENCE DATA:');
    if (paintTask.projectGeofence) {
      console.log('✅ Task has geofence data:');
      console.log('  Latitude:', paintTask.projectGeofence.latitude);
      console.log('  Longitude:', paintTask.projectGeofence.longitude);
      console.log('  Radius:', paintTask.projectGeofence.radius, 'm');
      console.log('  Allowed Distance:', (paintTask.projectGeofence.radius + 20), 'm (with 20m tolerance)');
    } else {
      console.log('⚠️  Task does NOT have geofence data in the assignment');
    }

    // Check project geofence
    console.log('\n📍 PROJECT GEOFENCE DATA:');
    const project = await Project.findOne({ projectId: paintTask.projectId }).lean();
    
    if (project) {
      console.log('✅ Found project:', project.projectName);
      
      if (project.geofence) {
        console.log('✅ Project has geofence:');
        console.log('  Latitude:', project.geofence.latitude);
        console.log('  Longitude:', project.geofence.longitude);
        console.log('  Radius:', project.geofence.radius, 'm');
        console.log('  Allowed Distance:', (project.geofence.radius + 20), 'm (with 20m tolerance)');
        
        // Google Maps link
        const mapsUrl = `https://www.google.com/maps?q=${project.geofence.latitude},${project.geofence.longitude}`;
        console.log('\n🗺️  View on Google Maps:', mapsUrl);
      } else {
        console.log('❌ Project does NOT have geofence configured');
      }
    } else {
      console.log('❌ Project not found!');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 WHAT THIS MEANS:');
    console.log('---');
    
    const hasGeofence = paintTask.projectGeofence || (project && project.geofence);
    
    if (hasGeofence) {
      const geofence = paintTask.projectGeofence || project.geofence;
      const maxDistance = geofence.radius + 20;
      
      console.log('✅ Geofence is configured');
      console.log(`📏 You must be within ${maxDistance}m of the site to start this task`);
      console.log(`📍 Site location: ${geofence.latitude}, ${geofence.longitude}`);
      console.log('\n🔧 To test from anywhere, you can:');
      console.log('   1. Increase the geofence radius in the database');
      console.log('   2. Temporarily disable geofence check in the app');
      console.log('   3. Move to the actual site location');
    } else {
      console.log('❌ NO geofence configured - task should be startable from anywhere!');
      console.log('⚠️  If button still shows "Outside Geo-Fence", there may be a code issue');
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkPaintTaskGeofence();
