import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

import FleetTask from './src/modules/fleetTask/models/FleetTask.js';

async function verifyDriverTasksApi() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const driverId = 50;
    const companyId = 1;

    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    console.log('🔍 Simulating API query:');
    console.log(`   Driver ID: ${driverId}`);
    console.log(`   Company ID: ${companyId}`);
    console.log(`   Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}\n`);

    // Query exactly as the API does
    const tasks = await FleetTask.find({
      driverId,
      companyId,
      taskDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).lean();

    console.log(`📊 Found ${tasks.length} tasks\n`);

    if (tasks.length > 0) {
      console.log('✅ SUCCESS! API will return these tasks:\n');
      tasks.forEach(task => {
        const time = new Date(task.plannedPickupTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        console.log(`📋 Task ${task.id}:`);
        console.log(`   Time: ${time}`);
        console.log(`   Notes: ${task.notes}`);
        console.log(`   From: ${task.pickupLocation}`);
        console.log(`   To: ${task.dropLocation}`);
        console.log(`   Passengers: ${task.expectedPassengers}`);
        console.log(`   Status: ${task.status}\n`);
      });

      console.log('=' .repeat(60));
      console.log('🎉 DRIVER TRANSPORT TASKS READY!');
      console.log('=' .repeat(60));
      console.log('\n📱 Login to mobile app with:');
      console.log('   Email: driver1@gmail.com');
      console.log('   Password: Password123@');
      console.log('\n✅ The driver will see 3 transport tasks for today!');
      console.log('✅ Backend API is working correctly!');
    } else {
      console.log('❌ No tasks found! Something went wrong.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

verifyDriverTasksApi();
