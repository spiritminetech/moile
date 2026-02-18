import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function recreateDriverTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Use the correct collection
    const FleetTask = mongoose.model('FleetTask', new mongoose.Schema({}, { strict: false }), 'fleetTasks');
    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }), 'employees');
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');
    const Vehicle = mongoose.model('Vehicle', new mongoose.Schema({}, { strict: false }), 'vehicles');

    // Get driver info
    const driver = await Employee.findOne({ email: 'driver1@gmail.com' });
    if (!driver) {
      console.log('❌ Driver not found!');
      return;
    }

    console.log(`👤 Driver: ${driver.fullName || driver.name}`);
    console.log(`   Employee ID: ${driver.employeeId}`);
    console.log(`   Company ID: ${driver.companyId}\n`);

    // Get project
    const project = await Project.findOne({ companyId: driver.companyId });
    if (!project) {
      console.log('❌ No project found!');
      return;
    }

    console.log(`📍 Project: ${project.name}`);
    console.log(`   Project ID: ${project.id}\n`);

    // Get vehicle
    let vehicle = await Vehicle.findOne({ companyId: driver.companyId });
    if (!vehicle) {
      console.log('⚠️  No vehicle found, creating one...');
      const lastVehicle = await Vehicle.findOne().sort({ id: -1 });
      const nextVehicleId = lastVehicle ? lastVehicle.id + 1 : 1;
      
      vehicle = new Vehicle({
        id: nextVehicleId,
        companyId: driver.companyId,
        vehicleNumber: 'DXB-T-1234',
        vehicleType: 'Bus',
        capacity: 45,
        status: 'active',
        driverId: driver.employeeId,
        createdAt: new Date()
      });
      await vehicle.save();
      console.log(`✅ Created vehicle: ${vehicle.vehicleNumber}\n`);
    } else {
      console.log(`🚗 Vehicle: ${vehicle.vehicleNumber} (ID: ${vehicle.id})\n`);
    }

    // Delete existing tasks for today
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    console.log('🗑️  Deleting existing tasks for today...');
    await FleetTask.deleteMany({
      driverId: driver.employeeId,
      taskDate: { $gte: startOfDay, $lte: endOfDay }
    });
    console.log('✅ Deleted\n');

    // Get next task ID
    const lastTask = await FleetTask.findOne().sort({ id: -1 });
    let nextId = lastTask ? lastTask.id + 1 : 1;

    console.log(`🔢 Starting task ID: ${nextId}\n`);
    console.log('📋 Creating 3 transport tasks...\n');

    // Create tasks with proper number types
    const tasks = [
      {
        id: nextId++,
        companyId: Number(driver.companyId),
        projectId: Number(project.id),
        driverId: Number(driver.employeeId),
        vehicleId: Number(vehicle.id),
        taskDate: startOfDay,
        plannedPickupTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 6, 30, 0)),
        plannedDropTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 7, 30, 0)),
        pickupLocation: 'Worker Dormitory - Block A',
        pickupAddress: 'Al Quoz Industrial Area 3, Dubai',
        dropLocation: project.name,
        dropAddress: project.address || 'Construction Site, Dubai',
        expectedPassengers: 35,
        status: 'PLANNED',
        notes: 'Morning shift pickup',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: nextId++,
        companyId: Number(driver.companyId),
        projectId: Number(project.id),
        driverId: Number(driver.employeeId),
        vehicleId: Number(vehicle.id),
        taskDate: startOfDay,
        plannedPickupTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0)),
        plannedDropTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 30, 0)),
        pickupLocation: project.name,
        pickupAddress: project.address || 'Construction Site, Dubai',
        dropLocation: 'Cafeteria - Central Kitchen',
        dropAddress: 'Al Barsha, Dubai',
        expectedPassengers: 28,
        status: 'PLANNED',
        notes: 'Lunch break transfer',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: nextId++,
        companyId: Number(driver.companyId),
        projectId: Number(project.id),
        driverId: Number(driver.employeeId),
        vehicleId: Number(vehicle.id),
        taskDate: startOfDay,
        plannedPickupTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 17, 30, 0)),
        plannedDropTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 18, 30, 0)),
        pickupLocation: project.name,
        pickupAddress: project.address || 'Construction Site, Dubai',
        dropLocation: 'Worker Dormitory - Block A',
        dropAddress: 'Al Quoz Industrial Area 3, Dubai',
        expectedPassengers: 40,
        status: 'PLANNED',
        notes: 'Evening shift drop-off',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const taskData of tasks) {
      const task = new FleetTask(taskData);
      await task.save();
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
    console.log(`🎉 SUCCESS! Created ${driverTasks.length} tasks in correct collection!`);
    console.log('=' .repeat(60));
    console.log('\n📱 LOGIN CREDENTIALS:');
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

recreateDriverTasks();
