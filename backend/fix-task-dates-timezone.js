import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const FleetTask = mongoose.model('FleetTask', new mongoose.Schema({}, { strict: false }), 'fleettasks');

async function fixTaskDatesTimezone() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all tasks
    const allTasks = await FleetTask.find({}).lean();
    console.log(`📋 Total tasks: ${allTasks.length}\n`);

    for (const task of allTasks) {
      console.log(`Task ${task.id}:`);
      console.log(`   Current taskDate: ${task.taskDate}`);
      console.log(`   Type: ${typeof task.taskDate}`);
      console.log(`   ISO: ${task.taskDate instanceof Date ? task.taskDate.toISOString() : 'Not a Date'}\n`);
    }

    // Fix: Set taskDate to UTC midnight for today
    const today = new Date();
    const utcMidnight = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));

    console.log(`🔧 Setting all tasks to UTC midnight: ${utcMidnight.toISOString()}\n`);

    for (const task of allTasks) {
      await FleetTask.updateOne(
        { _id: task._id },
        { $set: { taskDate: utcMidnight } }
      );
      console.log(`✅ Updated task ${task.id}`);
    }

    // Verify
    console.log('\n📊 Verification:\n');

    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));

    console.log(`Query range:`);
    console.log(`   Start: ${startOfDay.toISOString()}`);
    console.log(`   End: ${endOfDay.toISOString()}\n`);

    const verifyTasks = await FleetTask.find({
      driverId: 50,
      companyId: 1,
      taskDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).lean();

    console.log(`✅ Tasks found: ${verifyTasks.length}\n`);

    for (const task of verifyTasks) {
      const time = task.plannedPickupTime ? new Date(task.plannedPickupTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
      console.log(`   • Task ${task.id}: ${task.notes} - ${time}`);
      console.log(`     taskDate: ${task.taskDate.toISOString()}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Task dates fixed');
    console.log('='.repeat(60));
    console.log(`\n📱 Login: driver1@gmail.com / Password123@`);
    console.log(`\n✅ Restart the mobile app to see ${verifyTasks.length} tasks!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixTaskDatesTimezone();
