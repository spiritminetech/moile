import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function fixVehicleAndCreateTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const FleetTask = mongoose.model('FleetTask', new mongoose.Schema({}, { strict: false }), 'fleetTasks');
    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }), 'employees');
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');
    const Vehicle = mongoose.model('Vehicle', new mongoose.Schema({}, { strict: false }), 'vehicles');

    // Clean up null ID vehicles
    console.log('🧹 Cleaning up null ID vehicles...');
    const nullVehicles = await Vehicle.deleteMany({
      $or: [
        { id: null },
        { id: { $exists: false } }
      ]
    });
    console.log(`✅ Deleted ${nullVehicles.deletedCount} vehicles with null id\n`);

    // Get driver
    const driver = await Employee.findOne({ email: 'driver1@gmail.com' });
    console.log(`👤 Driver: ${driver.fullName || driver.name} (ID: ${driver.employeeId})\n`);

    // Get project
    const project = await Project.findOne({ companyId: driver.companyId, id: { $type: 'number' } });
    console.log(`📍 Project: ${project.name} (ID: ${project.id})\n`);

    // Get or create vehicle with numeric ID
    let vehicle = await Vehicle.findOne({ companyId: driver.companyId, id: { $type: 'number' } });
    
    if (!vehicle) {
      const lastVehicle = await Vehicle.findOne({ id: { $type: 'number' } }).sort({ id: -1 });
      const nextVehicleId = lastVehicle ? lastVehicle.id + 1 : 1;
      
      vehicle = await Vehicle.create({
        id: nextVehicleId,
        companyId: driver.companyId,
        vehicleNumber: 'DXB-T-1234',
        vehicleType: 'Bus',
        capacity: 45,
        status: 'active',
        driverId: driver.employeeId,
        createdAt: new Date()
      });
      console.log(`✅ Created vehicle: ${vehicle.vehicleNumber} (ID: ${vehicle.id})\n`);
    } else {
      console.log(`🚗 Vehicle: ${vehicle.vehicleNumber || vehicle.registrationNo} (ID: ${vehicle.id})\n`);
    }

    // Clean up tasks
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    console.log('🧹 Cleaning up tasks...');
    await FleetTask.deleteMany({
      driverId: driver.employeeId,
      taskDate: { $gte: startOfDay, $lte: endOfDay }
    });
    await FleetTask.deleteMany({
      $or: [
        { id: null },
        { id: { $exists: false } }
      ]
    });
    console.log('✅ Cleanup complete\n');

    // Get next task ID
    const lastTask = await FleetTask.findOne({ id: { $type: 'number' } }).sort({ id: -1 });
    let taskId = lastTask ? lastTask.id + 1 : 10001;

    console.log(`🔢 Starting task ID: ${taskId}\n`);
    console.log('📋 Creating 3 transport tasks...\n');

    // Create tasks
    const tasks = [
      {
        id: taskId++,
        companyId: driver.companyId,
        projectId: project.id,
        driverId: driver.employeeId,
        vehicleId: vehicle.id,
        taskDate: startOfDay,
        plannedPickupTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 6, 30, 0)),
        plannedDropTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 7, 30, 0)),
        pickupLocation: 'Worker Dormitory - Block A',
        pickupAddress: 'Al Quoz Industrial Area 3, Dubai',
        dropLocation: project.name,
        dropAddress: project.address || 'Dubai, UAE',
        expectedPassengers: 35,
        status: 'PLANNED',
        notes: 'Morning shift pickup'
      },
      {
        id: taskId++,
        companyId: driver.companyId,
        projectId: project.id,
        driverId: driver.employeeId,
        vehicleId: vehicle.id,
        taskDate: startOfDay,
        plannedPickupTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0)),
        plannedDropTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 30, 0)),
        pickupLocation: project.name,
        pickupAddress: project.address || 'Dubai, UAE',
        dropLocation: 'Cafeteria - Central Kitchen',
        dropAddress: 'Al Barsha, Dubai',
        expectedPassengers: 28,
        status: 'PLANNED',
        notes: 'Lunch break transfer'
      },
      {
        id: taskId++,
        companyId: driver.companyId,
        projectId: project.id,
        driverId: driver.employeeId,
        vehicleId: vehicle.id,
        taskDate: startOfDay,
        plannedPickupTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 17, 30, 0)),
        plannedDropTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 18, 30, 0)),
        pickupLocation: project.name,
        pickupAddress: project.address || 'Dubai, UAE',
        dropLocation: 'Worker Dormitory - Block A',
        dropAddress: 'Al Quoz Industrial Area 3, Dubai',
        expectedPassengers: 40,
        status: 'PLANNED',
        notes: 'Evening shift drop-off'
      }
    ];

    for (const taskData of tasks) {
      const task = await FleetTask.create(taskData);
      const time = new Date(taskData.plannedPickupTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      console.log(`✅ Task ${task.id}: ${taskData.notes} - ${time}`);
      console.log(`   From: ${taskData.pickupLocation}`);
      console.log(`   To: ${taskData.dropLocation}`);
      console.log(`   Passengers: ${taskData.expectedPassengers}\n`);
    }

    // Verify
    const driverTasks = await FleetTask.find({
      driverId: driver.employeeId,
      companyId: driver.companyId,
      taskDate: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    console.log('=' .repeat(60));
    console.log(`🎉 SUCCESS! Created ${driverTasks.length} tasks!`);
    console.log('=' .repeat(60));
    console.log('\n📱 LOGIN CREDENTIALS:');
    console.log('   Email: driver1@gmail.com');
    console.log('   Password: Password123@');
    console.log('\n✅ Refresh the mobile app - driver should now see 3 transport tasks!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixVehicleAndCreateTasks();
