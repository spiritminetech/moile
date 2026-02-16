import mongoose from 'mongoose';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb://anbarasus2410_db_user:Anbu24102002@ac-vtmilrh-shard-00-00.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-01.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-02.hlff2qz.mongodb.net:27017/erp?tls=true&replicaSet=atlas-qbnji8-shard-0&authSource=admin&retryWrites=true&w=majority';

async function updateDates() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update all three assignments to today (2026-02-15)
    const result = await WorkerTaskAssignment.updateMany(
      { id: { $in: [7034, 7035, 7036] } },
      { 
        $set: { 
          date: '2026-02-15',
          updatedAt: new Date()
        } 
      }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} assignments to 2026-02-15`);

    // Verify the update
    const assignments = await WorkerTaskAssignment.find({
      id: { $in: [7034, 7035, 7036] }
    }).lean();

    console.log('\n📋 Verification:');
    assignments.forEach(a => {
      console.log(`  Assignment ${a.id}: date = ${a.date}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

updateDates();
