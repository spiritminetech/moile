import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

import FleetTask from './src/modules/fleetTask/models/FleetTask.js';

async function finalCreateDriverTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }), 'employees');

    const driver = await Employee.findOne({ email: 'driver1@gmail.com' });
    console.log(`👤 Driver: ${driver.fullName} (ID: ${driver.employeeId})\n`);

    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    console.log('🧹 Cleaning up all existing tasks for driver...');
    await FleetTask.deleteMany({ driverId: driver.employeeId });
    await FleetTask.deleteMany({ $or: [{ id: null }, { id: { $exists: false } }] });
    await FleetTask.deleteMany({ id: { $in: [10001, 10002, 10003] } });
    console.log('✅ Cleanup complete\n');

    console.log('📋 Creating 3 transport tasks...\n');

    const task1 = new FleetTask({
      id: 10001,
      companyId: 1,
      projectId: 1,
      driverId: 50,
      vehicleId: 1,
      taskDate: startOfDay,
      plannedPickupTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 6, 30, 0)),
      plannedDropTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 7, 30, 0)),
      pickupLocation: 'Worker Dormitory - Block A',
      pickupAddress: 'Al Quoz Industrial Area 3, Dubai',
      dropLocation: 'Construction Site',
      dropAddress: 'Dubai, UAE',
      expectedPassengers: 35,
      status: 'PLANNED',
      notes: 'Morning shift pickup'
    });
    await task1.save();
    console.log(`✅ Task ${task1.id}: Morning shift pickup - 06:30 AM`);

    const task2 = new FleetTask({
      id: 10002,
      companyId: 1,
      projectId: 1,
      driverId: 50,
      vehicleId: 1,
      taskDate: startOfDay,
      plannedPickupTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0)),
      plannedDropTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 30, 0)),
      pickupLocation: 'Construction Site',
      pickupAddress: 'Dubai, UAE',
      dropLocation: 'Cafeteria - Central Kitchen',
      dropAddress: 'Al Barsha, Dubai',
      expectedPassengers: 28,
      status: 'PLANNED',
      notes: 'Lunch break transfer'
    });
    await task2.save();
    console.log(`✅ Task ${task2.id}: Lunch break transfer - 12:00 PM`);

    const task3 = new FleetTask({
      id: 10003,
      companyId: 1,
      projectId: 1,
      driverId: 50,
      vehicleId: 1,
      taskDate: startOfDay,
      plannedPickupTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 17, 30, 0)),
      plannedDropTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 18, 30, 0)),
      pickupLocation: 'Construction Site',
      pickupAddress: 'Dubai, UAE',
      dropLocation: 'Worker Dormitory - Block A',
      dropAddress: 'Al Quoz Industrial Area 3, Dubai',
      expectedPassengers: 40,
      status: 'PLANNED',
      notes: 'Evening shift drop-off'
    });
    await task3.save();
    console.log(`✅ Task ${task3.id}: Evening shift drop-off - 05:30 PM\n`);

    const driverTasks = await FleetTask.find({
      driverId: 50,
      companyId: 1,
      taskDate: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    console.log('=' .repeat(60));
    console.log(`🎉 SUCCESS! Created ${driverTasks.length} transport tasks!`);
    console.log('=' .repeat(60));
    console.log('\n📋 Tasks:');
    driverTasks.forEach(t => {
      const time = new Date(t.plannedPickupTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      console.log(`   ✅ Task ${t.id}: ${t.notes} - ${time}`);
      console.log(`      From: ${t.pickupLocation}`);
      console.log(`      To: ${t.dropLocation}`);
      console.log(`      Passengers: ${t.expectedPassengers}\n`);
    });
    console.log('📱 LOGIN CREDENTIALS:');
    console.log('   Email: driver1@gmail.com');
    console.log('   Password: Password123@');
    console.log('\n✅ Refresh the mobile app to see the 3 transport tasks!');
    console.log('✅ Backend API will now return these tasks correctly!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

finalCreateDriverTasks();
