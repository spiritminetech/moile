import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://anbarasus2410_db_user:Anbu24102002@ac-vtmilrh-shard-00-00.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-01.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-02.hlff2qz.mongodb.net:27017/erp?tls=true&replicaSet=atlas-qbnji8-shard-0&authSource=admin&retryWrites=true&w=majority';

async function deleteOldAssignments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('workertaskassignments');

    // Find assignments 7034-7043
    console.log('🔍 Finding assignments 7034-7043...\n');
    
    const oldAssignments = await collection.find({
      id: { $gte: 7034, $lte: 7043 }
    }).toArray();

    console.log(`Found ${oldAssignments.length} old assignments:`);
    console.log('='.repeat(80));
    
    oldAssignments.forEach(a => {
      console.log(`ID ${a.id}: ${a.taskName}`);
      console.log(`  Status: ${a.status}`);
      console.log(`  Date: ${a.date}`);
      console.log(`  Created: ${a.createdAt}`);
      console.log('');
    });

    if (oldAssignments.length > 0) {
      console.log('🗑️  Deleting old assignments...');
      console.log('='.repeat(80));
      
      const result = await collection.deleteMany({
        id: { $gte: 7034, $lte: 7043 }
      });

      console.log(`✅ Deleted ${result.deletedCount} assignments\n`);
    } else {
      console.log('✅ No old assignments found to delete\n');
    }

    // Verify deletion
    console.log('🔍 Verification:');
    console.log('='.repeat(80));
    
    const remaining = await collection.find({
      id: { $gte: 7034, $lte: 7043 }
    }).toArray();

    if (remaining.length === 0) {
      console.log('✅ All old assignments deleted successfully');
    } else {
      console.log(`⚠️  ${remaining.length} assignments still remain`);
    }

    // Show current assignments
    console.log('\n📋 Current assignments in database:');
    console.log('='.repeat(80));
    
    const current = await collection.find({}).limit(20).toArray();
    console.log(`Total: ${current.length} assignments`);
    
    if (current.length > 0) {
      current.forEach(a => {
        console.log(`  - ID ${a.id}: ${a.taskName} (${a.status})`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteOldAssignments();
