import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixNullIdsAllCollections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Collections that should have numeric id field
    const collectionsToFix = [
      'workerTaskAssignment',
      'workertaskprogresses',
      'transporttasks',
      'attendances',
      'employees',
      'users',
      'projects',
      'notifications',
      'vehicles',
      'tasks',
      'fleetTasks',
      'materials',
      'tools'
    ];

    console.log('🔧 Fixing null/missing id fields...\n');

    let totalFixed = 0;

    for (const collectionName of collectionsToFix) {
      const collection = db.collection(collectionName);
      
      // Check if collection exists
      const exists = await db.listCollections({ name: collectionName }).hasNext();
      if (!exists) {
        console.log(`   ⏭️  Skipping ${collectionName} (doesn't exist)`);
        continue;
      }

      // Count documents with null/missing id
      const nullCount = await collection.countDocuments({
        $or: [{ id: null }, { id: { $exists: false } }]
      });

      if (nullCount > 0) {
        console.log(`📦 ${collectionName}: ${nullCount} documents with null/missing id`);
        
        // Delete documents with null/missing id
        const deleteResult = await collection.deleteMany({
          $or: [{ id: null }, { id: { $exists: false } }]
        });
        
        console.log(`   ✅ Deleted ${deleteResult.deletedCount} documents\n`);
        totalFixed += deleteResult.deletedCount;
      } else {
        console.log(`   ✅ ${collectionName}: No issues found`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary: Fixed ${totalFixed} documents across all collections`);
    console.log('='.repeat(60));

    if (totalFixed > 0) {
      console.log('\n💡 Recommendation: Restart backend server to ensure clean state');
    } else {
      console.log('\n✅ All collections are clean!');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixNullIdsAllCollections();
