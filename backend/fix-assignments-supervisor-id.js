import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function fixSupervisorIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update assignments 7035 and 7036 to have supervisorId: 4
    console.log('\n📝 Updating assignments 7035 and 7036...');
    
    const result = await WorkerTaskAssignment.updateMany(
      { id: { $in: [7035, 7036] } },
      { $set: { supervisorId: 4 } }
    );

    console.log(`✅ Updated ${result.modifiedCount} assignments`);

    // Verify the updates
    const assignments = await WorkerTaskAssignment.find({
      id: { $in: [7034, 7035, 7036] }
    }).lean();

    console.log('\n✅ Verification:');
    assignments.forEach(a => {
      console.log(`  Assignment ${a.id}: supervisorId = ${a.supervisorId}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

fixSupervisorIds();
