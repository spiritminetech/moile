import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function cleanNullIdTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const FleetTaskCorrect = mongoose.model('FleetTaskCorrect', new mongoose.Schema({}, { strict: false }), 'fleetTasks');

    // Find tasks with null or undefined id
    const nullIdTasks = await FleetTaskCorrect.find({
      $or: [
        { id: null },
        { id: { $exists: false } }
      ]
    }).lean();

    console.log(`🔍 Found ${nullIdTasks.length} tasks with null/missing id\n`);

    if (nullIdTasks.length > 0) {
      console.log('📋 Tasks with null id:');
      nullIdTasks.forEach(task => {
        console.log(`   _id: ${task._id}`);
        console.log(`   id: ${task.id}`);
        console.log(`   driverId: ${task.driverId}`);
        console.log(`   status: ${task.status}`);
        console.log(`   notes: ${task.notes || 'N/A'}\n`);
      });

      console.log('🗑️  Deleting tasks with null id...');
      const result = await FleetTaskCorrect.deleteMany({
        $or: [
          { id: null },
          { id: { $exists: false } }
        ]
      });
      console.log(`✅ Deleted ${result.deletedCount} tasks\n`);
    } else {
      console.log('✅ No tasks with null id found\n');
    }

    // Now check for duplicate IDs 1, 2, 3
    console.log('🔍 Checking for existing tasks with IDs 1, 2, 3...');
    const existingTasks = await FleetTaskCorrect.find({
      id: { $in: [1, 2, 3] }
    }).lean();

    if (existingTasks.length > 0) {
      console.log(`⚠️  Found ${existingTasks.length} existing tasks with IDs 1, 2, 3:`);
      existingTasks.forEach(task => {
        console.log(`   Task ${task.id}: driverId=${task.driverId}, status=${task.status}`);
      });
      
      console.log('\n🗑️  Deleting these tasks to make room for new ones...');
      await FleetTaskCorrect.deleteMany({ id: { $in: [1, 2, 3] } });
      console.log('✅ Deleted old tasks\n');
    }

    console.log('✅ Cleanup complete! Ready to move tasks from lowercase collection.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

cleanNullIdTasks();
