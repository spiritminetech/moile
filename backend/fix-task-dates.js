// Script to fix task dates for Driver ID 50
import mongoose from 'mongoose';
import FleetTask from './src/modules/fleetTask/models/FleetTask.js';

const MONGODB_URI = 'mongodb://anbarasus2410_db_user:Anbu24102002@ac-vtmilrh-shard-00-00.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-01.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-02.hlff2qz.mongodb.net:27017/erp?tls=true&replicaSet=atlas-qbnji8-shard-0&authSource=admin&retryWrites=true&w=majority';

async function fixTaskDates() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const driverId = 50;

    // Find all tasks for driver 50
    const tasks = await FleetTask.find({ driverId }).lean();
    console.log(`📌 Found ${tasks.length} tasks for driver ${driverId}`);

    if (tasks.length === 0) {
      console.log('⚠️ No tasks found for driver 50');
      return;
    }

    // Get current date in UTC
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    
    console.log(`📅 Setting task dates to: ${startOfDay.toISOString()}`);
    console.log(`📅 Current UTC time: ${now.toISOString()}`);

    // Update all tasks to today's date
    for (const task of tasks) {
      const plannedPickupHour = new Date(task.plannedPickupTime).getHours();
      const plannedDropHour = new Date(task.plannedDropTime).getHours();
      
      const newPickupTime = new Date(Date.UTC(
        now.getUTCFullYear(), 
        now.getUTCMonth(), 
        now.getUTCDate(), 
        plannedPickupHour, 
        0, 
        0, 
        0
      ));
      
      const newDropTime = new Date(Date.UTC(
        now.getUTCFullYear(), 
        now.getUTCMonth(), 
        now.getUTCDate(), 
        plannedDropHour, 
        0, 
        0, 
        0
      ));

      await FleetTask.updateOne(
        { id: task.id },
        {
          $set: {
            taskDate: startOfDay,
            plannedPickupTime: newPickupTime,
            plannedDropTime: newDropTime,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ Updated Task ${task.id}: ${task.pickupLocation} → ${task.dropLocation}`);
      console.log(`   Pickup: ${newPickupTime.toISOString()}`);
      console.log(`   Drop: ${newDropTime.toISOString()}`);
    }

    console.log('\n🎉 All task dates updated successfully!');

  } catch (error) {
    console.error('❌ Error fixing task dates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixTaskDates();
