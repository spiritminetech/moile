import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://anbarasus2410_db_user:Anbu24102002@ac-vtmilrh-shard-00-00.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-01.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-02.hlff2qz.mongodb.net:27017/erp?tls=true&replicaSet=atlas-qbnji8-shard-0&authSource=admin&retryWrites=true&w=majority';

async function forceDeleteTask7039() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    console.log('🔍 Searching for task 7039 in all collections...\n');
    console.log('='.repeat(80));

    // Check workertaskassignments collection
    const assignmentsCollection = db.collection('workertaskassignments');
    const assignment7039 = await assignmentsCollection.findOne({ id: 7039 });
    
    if (assignment7039) {
      console.log('✅ Found in workertaskassignments:');
      console.log(`   Task: ${assignment7039.taskName}`);
      console.log(`   Status: ${assignment7039.status}`);
      console.log(`   Employee: ${assignment7039.employeeId}`);
      console.log(`   Date: ${assignment7039.date}`);
      
      console.log('\n🗑️  Deleting from workertaskassignments...');
      const result = await assignmentsCollection.deleteOne({ id: 7039 });
      console.log(`   ✅ Deleted ${result.deletedCount} document(s)`);
    } else {
      console.log('❌ NOT found in workertaskassignments');
    }

    // Check tasks collection
    const tasksCollection = db.collection('tasks');
    const task7039 = await tasksCollection.findOne({ id: 7039 });
    
    if (task7039) {
      console.log('\n✅ Found in tasks collection:');
      console.log(`   Task: ${task7039.taskName}`);
      
      console.log('\n🗑️  Deleting from tasks...');
      const result = await tasksCollection.deleteOne({ id: 7039 });
      console.log(`   ✅ Deleted ${result.deletedCount} document(s)`);
    } else {
      console.log('❌ NOT found in tasks collection');
    }

    // Check for any assignment with assignmentId 7039
    const byAssignmentId = await assignmentsCollection.findOne({ assignmentId: 7039 });
    if (byAssignmentId) {
      console.log('\n✅ Found by assignmentId field:');
      console.log(`   Task: ${byAssignmentId.taskName}`);
      
      console.log('\n🗑️  Deleting...');
      const result = await assignmentsCollection.deleteOne({ assignmentId: 7039 });
      console.log(`   ✅ Deleted ${result.deletedCount} document(s)`);
    }

    // Check for any assignment with taskId 7039
    const byTaskId = await assignmentsCollection.findOne({ taskId: 7039 });
    if (byTaskId) {
      console.log('\n✅ Found by taskId field:');
      console.log(`   Assignment ID: ${byTaskId.id}`);
      console.log(`   Task: ${byTaskId.taskName}`);
      
      console.log('\n🗑️  Deleting...');
      const result = await assignmentsCollection.deleteOne({ taskId: 7039 });
      console.log(`   ✅ Deleted ${result.deletedCount} document(s)`);
    }

    // Final verification
    console.log('\n🔍 Final Verification:');
    console.log('='.repeat(80));
    
    const finalCheck1 = await assignmentsCollection.findOne({ id: 7039 });
    const finalCheck2 = await assignmentsCollection.findOne({ assignmentId: 7039 });
    const finalCheck3 = await assignmentsCollection.findOne({ taskId: 7039 });
    const finalCheck4 = await tasksCollection.findOne({ id: 7039 });
    
    if (!finalCheck1 && !finalCheck2 && !finalCheck3 && !finalCheck4) {
      console.log('✅ Task 7039 completely removed from database');
    } else {
      console.log('⚠️  Task 7039 still exists in some form');
      if (finalCheck1) console.log('   - Found by id in assignments');
      if (finalCheck2) console.log('   - Found by assignmentId in assignments');
      if (finalCheck3) console.log('   - Found by taskId in assignments');
      if (finalCheck4) console.log('   - Found by id in tasks');
    }

    // Show remaining assignments
    console.log('\n📋 Remaining assignments in database:');
    console.log('='.repeat(80));
    const remaining = await assignmentsCollection.find({}).limit(20).toArray();
    console.log(`Total: ${remaining.length} assignments`);
    remaining.forEach(a => {
      console.log(`  - ID ${a.id}: ${a.taskName} (${a.status})`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('\n⚠️  IMPORTANT: Restart backend server to clear cache!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

forceDeleteTask7039();
