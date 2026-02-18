import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function debugTaskCollection() {
  try {
    console.log('🔍 Debugging Task Collection Structure...\n');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📦 Available collections:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    // Find the correct collection for worker task assignments
    const taskCollections = collections.filter(col => 
      col.name.toLowerCase().includes('task') || 
      col.name.toLowerCase().includes('assignment')
    );

    console.log('\n📋 Task-related collections:');
    taskCollections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    // Check workertaskassignments collection
    console.log('\n🔍 Checking workertaskassignments collection...');
    let WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
    
    let sampleTask = await WorkerTaskAssignment.findOne({ status: 'paused' });
    
    if (sampleTask) {
      console.log('\n✅ Found a paused task in workertaskassignments!');
      console.log('Sample task structure:');
      console.log(JSON.stringify(sampleTask.toObject(), null, 2));
    } else {
      console.log('\n⚠️  No paused tasks found in workertaskassignments');
      
      // Try the singular collection name
      console.log('\n🔍 Checking workerTaskAssignment collection (singular)...');
      WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment2', new mongoose.Schema({}, { strict: false, collection: 'workerTaskAssignment' }));
      
      sampleTask = await WorkerTaskAssignment.findOne({ status: 'paused' });
      
      if (sampleTask) {
        console.log('\n✅ Found a paused task in workerTaskAssignment!');
        console.log('Sample task structure:');
        console.log(JSON.stringify(sampleTask.toObject(), null, 2));
      } else {
        console.log('\n⚠️  No paused tasks found in workerTaskAssignment either');
        
        // Check for any tasks
        const anyTask = await WorkerTaskAssignment.findOne({});
        if (anyTask) {
          console.log('\n📝 Sample task from workerTaskAssignment collection:');
          console.log(JSON.stringify(anyTask.toObject(), null, 2));
        }
      }
    }

    // Count tasks by status
    console.log('\n📊 Task counts by status:');
    const statuses = await WorkerTaskAssignment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    statuses.forEach(s => {
      console.log(`   ${s._id}: ${s.count}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

debugTaskCollection();
