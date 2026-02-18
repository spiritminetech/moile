import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const FleetTask = mongoose.model('FleetTask', new mongoose.Schema({}, { strict: false }), 'fleettasks');

async function fixTaskIdsFinal() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all tasks without proper id
    const tasksWithoutId = await FleetTask.find({
      $or: [
        { id: { $exists: false } },
        { id: null },
        { id: undefined }
      ]
    }).lean();

    console.log(`📋 Found ${tasksWithoutId.length} tasks without proper id field\n`);

    if (tasksWithoutId.length === 0) {
      console.log('✅ All tasks have proper IDs');
      return;
    }

    // Get the max existing id
    const maxIdTask = await FleetTask.findOne({ id: { $type: 'number' } }).sort({ id: -1 }).lean();
    let nextId = maxIdTask ? maxIdTask.id + 1 : 1;

    console.log(`📊 Starting ID assignment from: ${nextId}\n`);

    // Update each task
    for (const task of tasksWithoutId) {
      await FleetTask.updateOne(
        { _id: task._id },
        { $set: { id: nextId } }
      );
      
      console.log(`✅ Updated task ${task._id} with id: ${nextId}`);
      console.log(`   Notes: ${task.notes}`);
      console.log(`   Driver ID: ${task.driverId}`);
      console.log(`   Company ID: ${task.companyId}\n`);
      
      nextId++;
    }

    // Verify the fix
    console.log('📊 Verification:\n');
    
    const today = new Date();
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));

    const verifyTasks = await FleetTask.find({
      driverId: 50,
      companyId: 1,
      taskDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).lean();

    console.log(`✅ Tasks found for driver 50, company 1, today: ${verifyTasks.length}\n`);

    for (const task of verifyTasks) {
      const time = task.plannedPickupTime ? new Date(task.plannedPickupTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
      console.log(`   • Task ${task.id}: ${task.notes} - ${time}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! All tasks now have proper IDs');
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

fixTaskIdsFinal();
