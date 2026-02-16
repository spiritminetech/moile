import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function fixAndMoveTasks() {
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

    // Get the highest task ID in the correct collection
    const lastTask = await FleetTaskCorrect.findOne().sort({ id: -1 }).lean();
    let nextId = lastTask ? lastTask.id + 1 : 1;
    console.log(`\n🔢 Next available task ID: ${nextId}`);

    // Insert tasks into correct collection with proper IDs
    console.log('\n📥 Inserting tasks into "fleetTasks" (camelCase) collection...');
    
    for (const task of tasksToMove) {
      // Remove _id and assign proper id
      const { _id, ...taskData } = task;
      
      // Ensure id is set
      if (!taskData.id || taskData.id === null) {
        taskData.id = nextId++;
      }
      
      // Check if this ID already exists
      const existing = await FleetTaskCorrect.findOne({ id: taskData.id }).lean();
      if (existing) {
        console.log(`   ⚠️  Task ID ${taskData.id} already exists, using ${nextId} instead`);
        taskData.id = nextId++;
      }
      
      await FleetTaskCorrect.create(taskData);
      console.log(`   ✅ Created Task ${taskData.id}: ${taskData.notes}`);
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
    console.log('\n🔍 Checking driver tasks for today...');
    const driverId = 50;
    const companyId = 1;
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    console.log(`   Driver ID: ${driverId}`);
    console.log(`   Company ID: ${companyId}`);
    console.log(`   Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    const driverTasks = await FleetTaskCorrect.find({
      driverId,
      companyId,
      taskDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).lean();

    console.log(`\n   Found ${driverTasks.length} tasks for driver ${driverId} today`);
    
    if (driverTasks.length > 0) {
      console.log('\n🎉 SUCCESS! Driver should now see tasks in the app!');
      console.log('\n📋 Tasks:');
      driverTasks.forEach(task => {
        const time = new Date(task.plannedPickupTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        console.log(`   ✅ Task ${task.id}: ${task.notes} - ${time}`);
        console.log(`      Passengers: ${task.expectedPassengers}`);
        console.log(`      From: ${task.pickupLocation}`);
        console.log(`      To: ${task.dropLocation}`);
      });
      
      console.log('\n📱 Login with:');
      console.log('   Email: driver1@gmail.com');
      console.log('   Password: Password123@');
      console.log('\n✅ Restart the backend server and refresh the app to see tasks!');
    } else {
      console.log('\n⚠️  Still no tasks found for driver. Debugging...');
      
      // Check all tasks for today
      const allTasksToday = await FleetTaskCorrect.find({
        taskDate: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).lean();
      
      console.log(`   Total tasks for today (any driver): ${allTasksToday.length}`);
      
      if (allTasksToday.length > 0) {
        console.log('   Tasks found:');
        allTasksToday.forEach(task => {
          console.log(`      Task ${task.id}: driverId=${task.driverId} (${typeof task.driverId}), companyId=${task.companyId} (${typeof task.companyId})`);
          console.log(`         Match driver? ${task.driverId === driverId}`);
          console.log(`         Match company? ${task.companyId === companyId}`);
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

fixAndMoveTasks();
