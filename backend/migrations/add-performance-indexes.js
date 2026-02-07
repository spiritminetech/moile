import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { 
  collection: 'workertaskassignments',
  strict: false 
});

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

async function addPerformanceIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Adding performance indexes to WorkerTaskAssignment collection...');

    // Add index for team size queries (projectId + date)
    console.log('Creating index: { projectId: 1, date: 1 }');
    await WorkerTaskAssignment.collection.createIndex(
      { projectId: 1, date: 1 },
      { background: true }
    );
    console.log('✅ Index created: projectId_date');

    // Add index for worker queries (employeeId + date)
    console.log('Creating index: { employeeId: 1, date: 1 }');
    await WorkerTaskAssignment.collection.createIndex(
      { employeeId: 1, date: 1 },
      { background: true }
    );
    console.log('✅ Index created: employeeId_date');

    // Add index for supervisor queries
    console.log('Creating index: { supervisorId: 1 }');
    await WorkerTaskAssignment.collection.createIndex(
      { supervisorId: 1 },
      { background: true }
    );
    console.log('✅ Index created: supervisorId');

    // List all indexes
    console.log('\n📋 Current indexes on WorkerTaskAssignment:');
    const indexes = await WorkerTaskAssignment.collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Performance indexes added successfully!');
    console.log('💡 These indexes will significantly improve profile loading speed.');

  } catch (error) {
    console.error('❌ Error adding indexes:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

addPerformanceIndexes()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
