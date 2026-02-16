import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function listAllTasks() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

    const tasks = await WorkerTaskAssignment.find({}).lean();

    console.log(`📋 Found ${tasks.length} tasks:\n`);
    console.log('='.repeat(100));

    tasks.forEach((task, index) => {
      console.log(`\n${index + 1}. ${task.taskName}`);
      console.log(`   Assignment ID: ${task.assignmentId}`);
      console.log(`   Project ID: ${task.projectId}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Date: ${task.date}`);
      
      if (task.projectGeofence) {
        console.log(`   ✅ Has Geofence:`);
        console.log(`      Lat: ${task.projectGeofence.latitude}`);
        console.log(`      Lng: ${task.projectGeofence.longitude}`);
        console.log(`      Radius: ${task.projectGeofence.radius}m`);
      } else {
        console.log(`   ❌ No Geofence`);
      }
    });

    console.log('\n' + '='.repeat(100));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

listAllTasks();
