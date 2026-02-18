import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function checkAndFixNullIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const FleetTaskLower = mongoose.model('FleetTaskLower', new mongoose.Schema({}, { strict: false }), 'fleettasks');
    const FleetTaskCorrect = mongoose.model('FleetTaskCorrect', new mongoose.Schema({}, { strict: false }), 'fleetTasks');

    // Check tasks in lowercase collection
    const tasks = await FleetTaskLower.find({}).lean();
    console.log(`📋 Tasks in 'fleettasks' collection: ${tasks.length}\n`);

    if (tasks.length === 0) {
      console.log('⚠️  No tasks in lowercase collection. They may have been moved already.');
      
      // Check if driver has tasks in correct collection
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

      console.log(`\n🔍 Driver ${driverId} tasks for today: ${driverTasks.length}`);
      
      if (driverTasks.length > 0) {
        console.log('\n✅ Tasks found in correct collection:');
        driverTasks.forEach(task => {
          console.log(`   Task ${task.id}: ${task.notes}`);
        });
        console.log('\n🎉 Driver should see tasks in the app!');
      } else {
        console.log('\n⚠️  No tasks found for driver. Need to create new tasks.');
      }
      
      return;
    }

    console.log('📦 Current tasks:');
    tasks.forEach(task => {
      console.log(`   _id: ${task._id}`);
      console.log(`   id: ${task.id} (${typeof task.id})`);
      console.log(`   driverId: ${task.driverId}`);
      console.log(`   notes: ${task.notes}\n`);
    });

    // Get next available ID
    const lastTask = await FleetTaskCorrect.findOne().sort({ id: -1 }).lean();
    let nextId = lastTask ? lastTask.id + 1 : 1;
    console.log(`🔢 Next available task ID: ${nextId}\n`);

    // Fix and move each task
    console.log('🔧 Fixing and moving tasks...\n');
    
    for (const task of tasks) {
      const taskId = task.id || nextId++;
      
      // Create in correct collection with proper ID
      const newTask = {
        id: taskId,
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

      await FleetTaskCorrect.create(newTask);
      console.log(`✅ Created Task ${taskId}: ${newTask.notes}`);
    }

    // Delete from lowercase collection
    console.log('\n🗑️  Deleting tasks from lowercase collection...');
    await FleetTaskLower.deleteMany({});
    console.log('✅ Deleted all tasks from lowercase collection\n');

    // Verify driver can see tasks
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
      console.log('🎉 SUCCESS! Tasks moved to correct collection!\n');
      console.log('📋 Driver tasks:');
      driverTasks.forEach(task => {
        const time = new Date(task.plannedPickupTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        console.log(`   ✅ Task ${task.id}: ${task.notes} - ${time}`);
      });
      
      console.log('\n📱 Login with:');
      console.log('   Email: driver1@gmail.com');
      console.log('   Password: Password123@');
      console.log('\n✅ Refresh the app to see the 3 transport tasks!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkAndFixNullIds();
