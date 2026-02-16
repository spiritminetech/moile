import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://anbarasus2410_db_user:Anbu24102002@ac-vtmilrh-shard-00-00.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-01.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-02.hlff2qz.mongodb.net:27017/erp?tls=true&replicaSet=atlas-qbnji8-shard-0&authSource=admin&retryWrites=true&w=majority';

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function fixDuplicateActiveTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the two problematic tasks
    const task7039 = await WorkerTaskAssignment.findOne({ id: 7039 });
    const task7040 = await WorkerTaskAssignment.findOne({ id: 7040 });

    console.log('📋 Current State:');
    console.log('='.repeat(80));
    
    if (task7039) {
      console.log(`Task 7039: ${task7039.taskName}`);
      console.log(`  Status: ${task7039.status}`);
      console.log(`  Started At: ${task7039.startedAt}`);
    }
    
    if (task7040) {
      console.log(`Task 7040: ${task7040.taskName}`);
      console.log(`  Status: ${task7040.status}`);
      console.log(`  Started At: ${task7040.startedAt}`);
    }

    // Determine which task to keep active (most recently started)
    let taskToKeep, taskToPause;
    
    if (task7039 && task7040) {
      const start7039 = new Date(task7039.startedAt);
      const start7040 = new Date(task7040.startedAt);
      
      if (start7039 > start7040) {
        taskToKeep = task7039;
        taskToPause = task7040;
      } else {
        taskToKeep = task7040;
        taskToPause = task7039;
      }

      console.log('\n🔧 Fix Plan:');
      console.log('='.repeat(80));
      console.log(`✅ Keep Active: Task ${taskToKeep.id} - ${taskToKeep.taskName}`);
      console.log(`⏸️  Pause: Task ${taskToPause.id} - ${taskToPause.taskName}`);

      // Pause the older task
      await WorkerTaskAssignment.updateOne(
        { id: taskToPause.id },
        { 
          $set: { 
            status: 'pending',
            updatedAt: new Date()
          }
        }
      );

      console.log('\n✅ Fix Applied!');
      console.log('='.repeat(80));
      console.log(`Task ${taskToPause.id} changed from "in_progress" to "pending"`);
      console.log(`Task ${taskToKeep.id} remains "in_progress"`);
    }

    // Verify fix
    console.log('\n🔍 Verification:');
    console.log('='.repeat(80));
    
    const activeTasks = await WorkerTaskAssignment.find({ 
      status: 'in_progress',
      employeeId: task7039?.employeeId || task7040?.employeeId
    });
    
    console.log(`Active tasks count: ${activeTasks.length}`);
    activeTasks.forEach(task => {
      console.log(`  - Task ${task.id}: ${task.taskName} (${task.status})`);
    });

    if (activeTasks.length === 1) {
      console.log('\n✅ SUCCESS: Only ONE active task now!');
    } else {
      console.log('\n⚠️  WARNING: Still have multiple active tasks!');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDuplicateActiveTasks();
