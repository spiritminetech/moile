import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function finalMoveTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const FleetTaskLower = mongoose.model('FleetTaskLower', new mongoose.Schema({}, { strict: false }), 'fleettasks');
    const FleetTaskCorrect = mongoose.model('FleetTaskCorrect', new mongoose.Schema({}, { strict: false }), 'fleetTasks');

    // Clean up any null ID tasks first
    console.log('🧹 Cleaning up null ID tasks...');
    await FleetTaskCorrect.deleteMany({
      $or: [
        { id: null },
        { id: { $exists: false } }
      ]
    });
    console.log('✅ Cleanup complete\n');

    // Get tasks from lowercase collection
    const tasks = await FleetTaskLower.find({}).lean();
    console.log(`📋 Tasks to move: ${tasks.length}\n`);

    if (tasks.length === 0) {
      console.log('⚠️  No tasks to move!');
      return;
    }

    // Delete existing tasks with same IDs
    const taskIds = tasks.map(t => t.id).filter(id => id != null);
    if (taskIds.length > 0) {
      console.log(`🗑️  Deleting existing tasks with IDs: ${taskIds.join(', ')}`);
      await FleetTaskCorrect.deleteMany({ id: { $in: taskIds } });
      console.log('✅ Deleted\n');
    }

    // Move each task with explicit field mapping
    console.log('📥 Moving tasks...\n');
    
    for (const task of tasks) {
      // Explicitly map all fields to ensure no undefined values
      const newTask = {
        id: task.id,
        companyId: task.companyId,
        projectId: task.projectId,
        driverId: task.driverId,
        vehicleId: task.vehicleId,
        taskDate: task.taskDate,
        plannedPickupTime: task.plannedPickupTime,
        plannedDropTime: task.plannedDropTime,
        pickupLocation: task.pickupLocation || '',
        pickupAddress: task.pickupAddress || '',
        dropLocation: task.dropLocation || '',
        dropAddress: task.dropAddress || '',
        expectedPassengers: task.expectedPassengers || 0,
        status: task.status || 'PLANNED',
        notes: task.notes || '',
        createdAt: task.createdAt || new Date(),
        updatedAt: task.updatedAt || new Date()
      };

      // Validate that id is not null
      if (!newTask.id) {
        console.log(`⚠️  Skipping task with null id: ${task._id}`);
        continue;
      }

      console.log(`Creating task ${newTask.id}...`);
      console.log(`  Fields: id=${newTask.id}, driverId=${newTask.driverId}, companyId=${newTask.companyId}`);
      
      try {
        await FleetTaskCorrect.create(newTask);
        console.log(`✅ Created Task ${newTask.id}: ${newTask.notes}\n`);
      } catch (err) {
        console.error(`❌ Failed to create task ${newTask.id}:`, err.message);
        console.log('Task data:', JSON.stringify(newTask, null, 2));
      }
    }

    // Delete from lowercase collection
    console.log('🗑️  Deleting tasks from lowercase collection...');
    await FleetTaskLower.deleteMany({});
    console.log('✅ Deleted\n');

    // Verify
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

    console.log(`🔍 Driver ${driverId} tasks for today: ${driverTasks.length}\n`);
    
    if (driverTasks.length > 0) {
      console.log('🎉 SUCCESS! Tasks are now in the correct collection!\n');
      console.log('📋 Driver tasks:');
      driverTasks.forEach(task => {
        const time = new Date(task.plannedPickupTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        console.log(`   ✅ Task ${task.id}: ${task.notes} - ${time}`);
        console.log(`      From: ${task.pickupLocation}`);
        console.log(`      To: ${task.dropLocation}`);
        console.log(`      Passengers: ${task.expectedPassengers}\n`);
      });
      
      console.log('=' .repeat(60));
      console.log('📱 LOGIN CREDENTIALS:');
      console.log('   Email: driver1@gmail.com');
      console.log('   Password: Password123@');
      console.log('=' .repeat(60));
      console.log('\n✅ Refresh the mobile app to see the 3 transport tasks!');
      console.log('✅ Backend API will now return these tasks correctly!');
    } else {
      console.log('⚠️  No tasks found for driver. Debugging...');
      
      const allTasks = await FleetTaskCorrect.find({
        taskDate: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).lean();
      
      console.log(`   Total tasks for today: ${allTasks.length}`);
      if (allTasks.length > 0) {
        allTasks.forEach(task => {
          console.log(`   Task ${task.id}: driverId=${task.driverId}, companyId=${task.companyId}`);
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

finalMoveTasks();
