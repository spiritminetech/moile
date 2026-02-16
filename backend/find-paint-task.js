import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function findPaintTask() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name).join(', '));
    console.log();

    // Search in tasks collection
    const Task = mongoose.connection.collection('tasks');
    
    console.log('🔍 Searching for "Paint" tasks...\n');
    const paintTasks = await Task.find({
      taskName: { $regex: /paint/i }
    }).toArray();

    if (paintTasks.length === 0) {
      console.log('❌ No tasks with "Paint" in the name found\n');
      
      // Show all tasks
      console.log('📋 All tasks in database:');
      const allTasks = await Task.find({}).limit(20).toArray();
      allTasks.forEach((task, index) => {
        console.log(`\n${index + 1}. ${task.taskName || 'Unnamed'}`);
        console.log(`   ID: ${task.taskId || task._id}`);
        console.log(`   Project: ${task.projectId}`);
        console.log(`   Has Geofence: ${task.geofence ? 'Yes' : 'No'}`);
        if (task.geofence) {
          console.log(`   Geofence: ${JSON.stringify(task.geofence, null, 2)}`);
        }
      });
    } else {
      console.log(`✅ Found ${paintTasks.length} Paint task(s):\n`);
      
      paintTasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.taskName}`);
        console.log(`   Task ID: ${task.taskId || task._id}`);
        console.log(`   Project ID: ${task.projectId}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Has Geofence: ${task.geofence ? 'Yes ✅' : 'No ❌'}`);
        
        if (task.geofence) {
          console.log(`   Geofence Details:`);
          console.log(`     - Enabled: ${task.geofence.enabled}`);
          console.log(`     - Latitude: ${task.geofence.latitude}`);
          console.log(`     - Longitude: ${task.geofence.longitude}`);
          console.log(`     - Radius: ${task.geofence.radius}m`);
        }
        console.log();
      });
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

findPaintTask();
