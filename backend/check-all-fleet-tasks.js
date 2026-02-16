import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const FleetTask = mongoose.model('FleetTask', new mongoose.Schema({}, { strict: false }), 'fleettasks');

async function checkAllFleetTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const allTasks = await FleetTask.find({}).sort({ taskDate: -1 }).limit(20).lean();

    console.log(`📋 Total fleet tasks in database: ${await FleetTask.countDocuments()}`);
    console.log(`\n📋 Last 20 tasks:\n`);

    if (allTasks.length === 0) {
      console.log('❌ No fleet tasks found in database at all!');
      console.log('\n💡 Need to create tasks for the driver.');
    } else {
      for (const task of allTasks) {
        console.log(`Task ${task.id}:`);
        console.log(`   _id: ${task._id}`);
        console.log(`   driverId: ${task.driverId}`);
        console.log(`   companyId: ${task.companyId}`);
        console.log(`   taskDate: ${task.taskDate}`);
        console.log(`   status: ${task.status}`);
        console.log(`   notes: ${task.notes}`);
        console.log(`   pickup: ${task.pickupLocation}`);
        console.log(`   drop: ${task.dropLocation}\n`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

checkAllFleetTasks();
