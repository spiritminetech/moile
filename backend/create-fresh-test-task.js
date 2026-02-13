import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FleetTask from './src/modules/fleetTask/models/FleetTask.js';
import FleetTaskPassenger from './src/modules/fleetTask/submodules/fleetTaskPassenger/FleetTaskPassenger.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const getNextId = async (Model) => {
  const lastDoc = await Model.findOne().sort({ id: -1 }).lean();
  return lastDoc ? lastDoc.id + 1 : 1;
};

const createFreshTestTask = async () => {
  try {
    console.log('\n🚀 Creating fresh test task...\n');
    
    const taskId = await getNextId(FleetTask);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create pickup time (9 AM today)
    const pickupTime = new Date(today);
    pickupTime.setHours(9, 0, 0, 0);
    
    // Create drop time (5 PM today)
    const dropTime = new Date(today);
    dropTime.setHours(17, 0, 0, 0);
    
    // Create new task
    const newTask = new FleetTask({
      id: taskId,
      companyId: 1,
      driverId: 50,
      vehicleId: 1,
      projectId: 1,
      taskDate: today,
      status: 'ONGOING',
      pickupLocation: 'Worker Dormitory - Block A',
      pickupAddress: 'Worker Dormitory - Block A',
      pickupLatitude: 25.2048,
      pickupLongitude: 55.2708,
      dropLocation: 'Construction Site',
      dropAddress: 'Construction Site',
      dropLatitude: 25.2084,
      dropLongitude: 55.2719,
      plannedPickupTime: pickupTime,
      plannedDropTime: dropTime,
      notes: 'Fresh test task for driver app testing',
      createdBy: 1
    });
    
    await newTask.save();
    console.log(`✅ Created task ${taskId}`);
    
    // Create passenger records for 3 workers
    const workers = [
      { id: 104, name: 'Sarah Williams' },
      { id: 107, name: 'Raj Kumar' },
      { id: 2, name: 'Ravi Smith' }
    ];
    
    for (const worker of workers) {
      const passengerId = await getNextId(FleetTaskPassenger);
      
      const passenger = new FleetTaskPassenger({
        id: passengerId,
        companyId: 1,
        fleetTaskId: taskId,
        workerEmployeeId: worker.id,
        pickupStatus: 'pending',
        dropStatus: 'pending',
        notes: `Test passenger - ${worker.name}`
      });
      
      await passenger.save();
      console.log(`✅ Created passenger ${passengerId} for worker ${worker.id} (${worker.name})`);
    }
    
    console.log('\n🎉 Fresh test task created successfully!');
    console.log('📋 Summary:');
    console.log(`   Task ID: ${taskId}`);
    console.log(`   Status: ONGOING`);
    console.log(`   Driver ID: 50`);
    console.log(`   Workers: Sarah Williams, Raj Kumar, Ravi Smith`);
    console.log(`   Pickup: Worker Dormitory - Block A`);
    console.log(`   Dropoff: Construction Site`);
    console.log('\n✅ You can now test the complete flow in the driver app!');
    
  } catch (error) {
    console.error('❌ Error creating test task:', error);
  }
};

const main = async () => {
  await connectDB();
  await createFreshTestTask();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  process.exit(0);
};

main();
