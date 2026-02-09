// Script to create 3 transport tasks for Driver ID 50
import mongoose from 'mongoose';
import FleetTask from './src/modules/fleetTask/models/FleetTask.js';
import FleetTaskPassenger from './src/modules/fleetTask/submodules/fleetTaskPassenger/FleetTaskPassenger.js';

const MONGODB_URI = 'mongodb://anbarasus2410_db_user:Anbu24102002@ac-vtmilrh-shard-00-00.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-01.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-02.hlff2qz.mongodb.net:27017/erp?tls=true&replicaSet=atlas-qbnji8-shard-0&authSource=admin&retryWrites=true&w=majority';

async function createDriverTransportTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const driverId = 50;
    const companyId = 1;
    const vehicleId = 1; // Assuming vehicle ID 1 exists
    const projectId = 1; // Assuming project ID 1 exists

    // Get the next available task IDs
    const lastTask = await FleetTask.findOne().sort({ id: -1 }).lean();
    let nextId = lastTask ? lastTask.id + 1 : 1;

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Task 1: Morning Pickup - Dormitory A to Construction Site
    const task1 = new FleetTask({
      id: nextId++,
      companyId,
      projectId,
      driverId,
      vehicleId,
      taskDate: startOfDay,
      plannedPickupTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6, 0, 0),
      plannedDropTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 0, 0),
      pickupLocation: 'Dormitory A',
      pickupAddress: 'Industrial Area, Dubai',
      dropLocation: 'Construction Site - Tower B',
      dropAddress: 'Business Bay, Dubai',
      expectedPassengers: 38,
      status: 'PLANNED',
      notes: 'Morning shift pickup - Tower B construction workers'
    });

    // Task 2: Mid-day Transfer - Site A to Site B
    const task2 = new FleetTask({
      id: nextId++,
      companyId,
      projectId,
      driverId,
      vehicleId,
      taskDate: startOfDay,
      plannedPickupTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0),
      plannedDropTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0, 0),
      pickupLocation: 'Construction Site - Tower B',
      pickupAddress: 'Business Bay, Dubai',
      dropLocation: 'Warehouse - Zone 3',
      dropAddress: 'Jebel Ali, Dubai',
      expectedPassengers: 25,
      status: 'PLANNED',
      notes: 'Mid-day worker transfer to warehouse'
    });

    // Task 3: Evening Drop - Construction Site to Dormitory
    const task3 = new FleetTask({
      id: nextId++,
      companyId,
      projectId,
      driverId,
      vehicleId,
      taskDate: startOfDay,
      plannedPickupTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0, 0),
      plannedDropTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0, 0),
      pickupLocation: 'Construction Site - Tower B',
      pickupAddress: 'Business Bay, Dubai',
      dropLocation: 'Dormitory A',
      dropAddress: 'Industrial Area, Dubai',
      expectedPassengers: 42,
      status: 'PLANNED',
      notes: 'Evening shift drop-off to dormitory'
    });

    // Save all tasks
    await task1.save();
    console.log(`✅ Task 1 created: ID ${task1.id} - Morning Pickup (6:00 AM)`);

    await task2.save();
    console.log(`✅ Task 2 created: ID ${task2.id} - Mid-day Transfer (12:00 PM)`);

    await task3.save();
    console.log(`✅ Task 3 created: ID ${task3.id} - Evening Drop (5:00 PM)`);

    // Create some sample passengers for Task 1
    const lastPassenger = await FleetTaskPassenger.findOne().sort({ id: -1 }).lean();
    let nextPassengerId = lastPassenger ? lastPassenger.id + 1 : 1;

    const passengers = [];
    for (let i = 1; i <= 5; i++) {
      passengers.push({
        id: nextPassengerId++,
        fleetTaskId: task1.id,
        workerEmployeeId: 100 + i,
        companyId,
        pickupStatus: 'pending',
        dropStatus: 'pending',
        notes: `Worker ${i} - Morning shift`,
        createdAt: new Date()
      });
    }

    await FleetTaskPassenger.insertMany(passengers);
    console.log(`✅ Created ${passengers.length} sample passengers for Task 1`);

    console.log('\n🎉 Successfully created 3 transport tasks for Driver ID 50!');
    console.log('\n📋 Summary:');
    console.log(`   Task 1: Morning Pickup - 6:00 AM (38 passengers)`);
    console.log(`   Task 2: Mid-day Transfer - 12:00 PM (25 passengers)`);
    console.log(`   Task 3: Evening Drop - 5:00 PM (42 passengers)`);

  } catch (error) {
    console.error('❌ Error creating tasks:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createDriverTransportTasks();
