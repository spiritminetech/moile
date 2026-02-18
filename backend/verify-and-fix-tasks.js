import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const FleetTask = mongoose.model('FleetTask', new mongoose.Schema({}, { strict: false }), 'fleettasks');
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }), 'employees');

async function verifyAndFixTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Find all tasks for today
    const allTasks = await FleetTask.find({
      taskDate: { $gte: startOfDay, $lte: endOfDay }
    });

    console.log(`📋 Total tasks for today: ${allTasks.length}\n`);

    if (allTasks.length > 0) {
      console.log('Task details:');
      for (const task of allTasks) {
        console.log(`\nTask ${task.id}:`);
        console.log(`   _id: ${task._id}`);
        console.log(`   driverId: ${task.driverId} (type: ${typeof task.driverId})`);
        console.log(`   status: ${task.status}`);
        console.log(`   notes: ${task.notes}`);
      }

      // Check employee
      const driverEmployee = await Employee.findOne({ email: 'driver1@gmail.com' });
      console.log(`\n👤 Driver Employee:`);
      console.log(`   employeeId: ${driverEmployee?.employeeId} (type: ${typeof driverEmployee?.employeeId})`);

      // Update tasks with proper numeric driverId
      console.log(`\n🔧 Updating all ${allTasks.length} tasks...`);
      
      for (const task of allTasks) {
        await FleetTask.updateOne(
          { _id: task._id },
          { $set: { driverId: 50 } }
        );
        console.log(`   ✅ Updated task ${task.id}`);
      }

      // Update employee
      await Employee.updateOne(
        { email: 'driver1@gmail.com' },
        { $set: { employeeId: 50, name: 'Rajesh Kumar' } }
      );
      console.log(`\n✅ Updated employee record`);

      // Verify again
      console.log('\n📊 Verification after update:');
      const verifyTasks = await FleetTask.find({
        driverId: 50,
        taskDate: { $gte: startOfDay, $lte: endOfDay }
      });

      console.log(`   Tasks with driverId=50: ${verifyTasks.length}`);
      
      for (const task of verifyTasks) {
        const time = task.plannedPickupTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        console.log(`   • ${task.notes} - ${time}`);
      }

      if (verifyTasks.length === 0) {
        console.log('\n⚠️  Still no tasks found. Checking raw data...');
        const rawTasks = await FleetTask.find({
          taskDate: { $gte: startOfDay, $lte: endOfDay }
        }).lean();
        
        console.log('\nRaw task data:');
        for (const task of rawTasks) {
          console.log(`   Task ${task.id}: driverId=${JSON.stringify(task.driverId)}`);
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('✅ Update complete!');
      console.log('='.repeat(60));
      console.log(`\n📱 Login: driver1@gmail.com / Password123@`);
      console.log(`\n✅ Restart the mobile app to see ${verifyTasks.length} tasks`);

    } else {
      console.log('❌ No tasks found for today. Need to create them first.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

verifyAndFixTasks();
