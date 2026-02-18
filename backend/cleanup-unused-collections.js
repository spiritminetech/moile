import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanupUnusedCollections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // List of unused/duplicate collections to remove
    const collectionsToRemove = [
      'workertaskassignments', // Plural - unused, model uses singular
      'workerTaskPhoto', // Old/unused
      'taskIssues', // Old/unused
      'fleetTaskTools', // Old/unused
      'fleetTaskMaterials', // Old/unused
      'fleetTaskPhotos', // Old/unused (duplicate of fleettaskphotos)
      'workerTaskProgress', // Old/unused (duplicate of workertaskprogresses)
    ];

    console.log('🔍 Checking for unused collections...\n');

    const allCollections = await db.listCollections().toArray();
    const existingCollectionNames = allCollections.map(c => c.name);

    for (const collectionName of collectionsToRemove) {
      if (existingCollectionNames.includes(collectionName)) {
        // Check if collection has data
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        console.log(`📦 Collection: ${collectionName}`);
        console.log(`   Documents: ${count}`);
        
        if (count > 0) {
          console.log(`   ⚠️ Has data - backing up before deletion...`);
          
          // Create backup
          const backupName = `${collectionName}_backup_${Date.now()}`;
          const docs = await collection.find({}).toArray();
          await db.collection(backupName).insertMany(docs);
          console.log(`   ✅ Backed up to: ${backupName}`);
        }
        
        // Drop the collection
        await collection.drop();
        console.log(`   ✅ Dropped collection: ${collectionName}\n`);
      } else {
        console.log(`   ℹ️ Collection not found: ${collectionName}\n`);
      }
    }

    // Verify remaining collections
    console.log('📊 Remaining task-related collections:\n');
    const remainingCollections = await db.listCollections().toArray();
    const taskCollections = remainingCollections.filter(c => 
      c.name.toLowerCase().includes('task') || 
      c.name.toLowerCase().includes('assignment')
    );

    for (const col of taskCollections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   - ${col.name} (${count} documents)`);
    }

    console.log('\n🎉 Cleanup complete!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

cleanupUnusedCollections();
