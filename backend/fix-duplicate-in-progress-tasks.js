import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://anbarasus2410_db_user:Anbu24102002@ac-vtmilrh-shard-00-00.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-01.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-02.hlff2qz.mongodb.net:27017/erp?tls=true&replicaSet=atlas-qbnji8-shard-0&authSource=admin&retryWrites=true&w=majority';

async function fixDuplicateInProgressTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('workertaskassignments');

    // Find tasks 7039 and 7040
    console.log('🔍 Checking tasks 7039 and 7040...\n');
    
    const task7039 = await collection.findOne({ id: 7039 });
    const task7040 = await collection.findOne({ id: 7040 });

    console.log('📋 Current State:');
    console.log('='.repeat(80));
    
    if (task7039) {
      console.log(`Task 7039: ${task7039.taskName}`);
      console.log(`  Status: ${task7039.status}`);
      console.log(`  Started At: ${task7039.startedAt}`);
      console.log(`  Updated At: ${task7039.updatedAt}`);
    } else {
      console.log('Task 7039: NOT FOUND');
    }
    
    console.log('');
    
    if (task7040) {
      console.log(`Task 7040: ${task7040.taskName}`);
      console.log(`  Status: ${task7040.status}`);
      console.log(`  Started At: ${task7040.startedAt}`);
      console.log(`  Updated At: ${task7040.updatedAt}`);
    } else {
      console.log('Task 7040: NOT FOUND');
    }

    // Check all in_progress tasks for this employee
    const employeeId = task7039?.employeeId || task7040?.employeeId;
    
    if (employeeId) {
      console.log('\n🔍 All in_progress tasks for employee:', employeeId);
      console.log('='.repeat(80));
      
      const inProgressTasks = await collection.find({ 
        employeeId: employeeId,
        status: 'in_progress'
      }).toArray();
      
      console.log(`Found ${inProgressTasks.length} in_progress tasks:`);
      inProgressTasks.forEach(task => {
        console.log(`  - Task ${task.id}: ${task.taskName}`);
        console.log(`    Started: ${task.startedAt}`);
        console.log(`    Updated: ${task.updatedAt}`);
      });

      if (inProgressTasks.length > 1) {
        console.log('\n🔧 Fixing duplicate in_progress tasks...');
        console.log('='.repeat(80));
        
        // Sort by startedAt to find most recent
        inProgressTasks.sort((a, b) => {
          const dateA = new Date(a.startedAt);
          const dateB = new Date(b.startedAt);
          return dateB - dateA; // Most recent first
        });
        
        const taskToKeep = inProgressTasks[0];
        const tasksToChange = inProgressTasks.slice(1);
        
        console.log(`✅ Keeping: Task ${taskToKeep.id} - ${taskToKeep.taskName}`);
        console.log(`   (Most recently started: ${taskToKeep.startedAt})`);
        
        // Change older tasks to 'pending'
        for (const task of tasksToChange) {
          console.log(`\n⏸️  Changing Task ${task.id} to 'pending'...`);
          
          await collection.updateOne(
            { id: task.id },
            { 
              $set: { 
                status: 'pending',
                updatedAt: new Date()
              }
            }
          );
          
          console.log(`   ✅ Task ${task.id} status changed to 'pending'`);
        }
        
        console.log('\n✅ Fix completed!');
      } else {
        console.log('\n✅ No duplicate in_progress tasks found');
      }
    }

    // Final verification
    console.log('\n🔍 Final Verification:');
    console.log('='.repeat(80));
    
    const finalCheck = await collection.find({ 
      employeeId: employeeId,
      status: 'in_progress'
    }).toArray();
    
    console.log(`In-progress tasks count: ${finalCheck.length}`);
    finalCheck.forEach(task => {
      console.log(`  ✅ Task ${task.id}: ${task.taskName} (${task.status})`);
    });

    if (finalCheck.length === 1) {
      console.log('\n✅ SUCCESS: Only ONE in_progress task!');
    } else if (finalCheck.length === 0) {
      console.log('\n⚠️  No in_progress tasks found');
    } else {
      console.log('\n❌ ERROR: Still have multiple in_progress tasks!');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDuplicateInProgressTasks();
