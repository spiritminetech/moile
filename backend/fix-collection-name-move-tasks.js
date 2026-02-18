import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function moveTasksToCorrectCollection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Access both collections
    const FleetTaskLower = mongoose.model('FleetTaskLower', new mongoose.Schema({}, { strict: false }), 'fleettasks');
    const FleetTaskCorrect = mongoose.model('FleetTaskCorrect', new mongoose.Schema({}, { strict: false }), 'fleetTasks');

    // Get tasks from lowercase collection
    const tasksToMove = await FleetTaskLower.find({}).lean();
    console.log(`📋 Found ${tasksToMove.length} tasks in 'fleettasks' (lowercase) collection\n`);

    if (tasksToMove.length === 0) {
      console.log('⚠️  No tasks to move!');
      return;
    }

    // Show what we're moving
    console.log('📦 Tasks to move:');
    tasksToMove.forEach(task => {
      console.log(`   Task ${task.id}: driverId=${task.driverId}, status=${task.status}, notes=${task.notes}`);
    });

    // Check if these task IDs already exist in the correct collection
    const taskIds = tasksToMove.map(t => t.id);
    const existingTasks = await FleetTaskCorrect.find({ id: { $in: taskIds } }).lean();
    
    if (existingTasks.length > 0) {
      console.log(`\n⚠️  ${existingTasks.length} tasks with these IDs already exist in 'fleetTasks'`);
      console.log('   Deleting old tasks first...');
      await FleetTaskCorrect.deleteMany({ id: { $in: taskIds } });
      console.log('   ✅ Deleted old tasks');
    }

    // Insert tasks into correct collection
    console.log('\n📥 Inserting tasks into "fleetTasks" (camelCase) collection...');
    
    for (const task of tasksToMove) {
      // Remove _id to let MongoDB generate a new one
      const { _id, ...taskData } = task;
      await FleetTaskCorrect.create(taskData);
      console.log(`   ✅ Moved Task ${task.id}`);
    }

    // Delete from lowercase collection
    console.log('\n🗑️  Deleting tasks from "fleettasks" (lowercase) collection...');
    await FleetTaskLower.deleteMany({});
    console.log('   ✅ Deleted all tasks from lowercase collection');

    // Verify
    console.log('\n✅ Verification:');
    const countLower = await FleetTaskLower.countDocuments();
    const countCorrect = await FleetTaskCorrect.countDocuments();
    console.log(`   fleettasks (lowercase): ${countLower} documents`);
    console.log(`   fleetTasks (camelCase): ${countCorrect} documents`);

    // Check if driver can now see tasks
    console.log('\n🔍 Checking driver tasks...');
    const driverId = 50;
    const companyId = 1;
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const driverTasks = await FleetTaskCorrect.find({
      driverId,
      companyId,
      taskDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).lean();

    console.log(`   Found ${driverTasks.length} tasks for driver ${driverId} today`);
    
    if (driverTasks.length > 0) {
      console.log('\n🎉 SUCCESS! Driver should now see tasks in the app!');
      driverTasks.forEach(task => {
        console.log(`   ✅ Task ${task.id}: ${task.notes}`);
      });
    } else {
      console.log('\n⚠️  Still no tasks found for driver. Checking all tasks...');
      const allTasks = await FleetTaskCorrect.find({}).limit(5).lean();
      console.log(`   Total tasks in collection: ${await FleetTaskCorrect.countDocuments()}`);
      if (allTasks.length > 0) {
        console.log('   Sample tasks:');
        allTasks.forEach(task => {
          console.log(`      Task ${task.id}: driverId=${task.driverId}, companyId=${task.companyId}, date=${task.taskDate}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

moveTasksToCorrectCollection();
