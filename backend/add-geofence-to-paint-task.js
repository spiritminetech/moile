import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function addGeofenceToPaintTask() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Task = mongoose.connection.collection('tasks');
    
    // Find the Paint Interior Walls task
    const paintTask = await Task.findOne({
      taskName: 'Paint Interior Walls',
      projectId: 1003
    });

    if (!paintTask) {
      console.log('❌ Paint Interior Walls task not found');
      await mongoose.disconnect();
      return;
    }

    console.log('✅ Found Paint Interior Walls task');
    console.log(`   Task ID: ${paintTask.taskId || paintTask._id}`);
    console.log(`   Project: ${paintTask.projectId}`);
    console.log(`   Current Geofence: ${paintTask.geofence ? 'Yes' : 'No'}\n`);

    // Get project location for reference
    const Project = mongoose.connection.collection('projects');
    const project = await Project.findOne({ projectId: 1003 });
    
    if (project && project.location) {
      console.log('📍 Project 1003 Location:');
      console.log(`   Latitude: ${project.location.latitude}`);
      console.log(`   Longitude: ${project.location.longitude}\n`);
    }

    // Add geofence to the task
    const geofence = {
      enabled: true,
      latitude: project?.location?.latitude || 12.9716,
      longitude: project?.location?.longitude || 77.5946,
      radius: 100 // 100 meters
    };

    console.log('🔧 Adding geofence to Paint Interior Walls task...');
    console.log(`   Geofence: ${JSON.stringify(geofence, null, 2)}\n`);

    const result = await Task.updateOne(
      { _id: paintTask._id },
      { $set: { geofence: geofence } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Geofence added successfully!\n');
      
      // Verify the update
      const updatedTask = await Task.findOne({ _id: paintTask._id });
      console.log('📋 Updated Task:');
      console.log(`   Task Name: ${updatedTask.taskName}`);
      console.log(`   Has Geofence: ${updatedTask.geofence ? 'Yes ✅' : 'No ❌'}`);
      if (updatedTask.geofence) {
        console.log(`   Geofence Details:`);
        console.log(`     - Enabled: ${updatedTask.geofence.enabled}`);
        console.log(`     - Latitude: ${updatedTask.geofence.latitude}`);
        console.log(`     - Longitude: ${updatedTask.geofence.longitude}`);
        console.log(`     - Radius: ${updatedTask.geofence.radius}m`);
      }
    } else {
      console.log('⚠️ No changes made (task may already have this geofence)');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

addGeofenceToPaintTask();
