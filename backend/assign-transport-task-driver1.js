import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }), 'employees');
const FleetTask = mongoose.model('FleetTask', new mongoose.Schema({}, { strict: false }), 'fleettasks');
const FleetTaskPassenger = mongoose.model('FleetTaskPassenger', new mongoose.Schema({}, { strict: false }), 'fleettaskpassengers');
const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');
const Vehicle = mongoose.model('Vehicle', new mongoose.Schema({}, { strict: false }), 'vehicles');

async function assignTransportTaskToDriver1() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find driver1@gmail.com user
    const driverUser = await User.findOne({ email: 'driver1@gmail.com' });
    if (!driverUser) {
      console.log('❌ Driver user driver1@gmail.com not found');
      console.log('💡 Creating driver user first...\n');
      
      // Create driver user (will be done in next step)
      return;
    }

    console.log('✅ Found driver user:', driverUser.email);
    console.log(`   User ID: ${driverUser._id}`);

    // Verify password
    const isPasswordCorrect = await bcrypt.compare('Password123@', driverUser.password);
    console.log(`   Password check: ${isPasswordCorrect ? '✅ Correct' : '❌ Incorrect'}`);

    // Find linked employee
    const driverEmployee = await Employee.findOne({ userId: driverUser._id });
    if (!driverEmployee) {
      console.log('❌ No employee record linked to this driver user');
      return;
    }

    console.log(`✅ Found driver employee: ${driverEmployee.name}`);
    console.log(`   Employee ID: ${driverEmployee.employeeId}`);
    console.log(`   Company ID: ${driverEmployee.companyId}`);

    // Get a project
    const project = await Project.findOne({ companyId: driverEmployee.companyId });
    if (!project) {
      console.log('❌ No project found for this company');
      return;
    }
    console.log(`✅ Using project: ${project.name} (ID: ${project.id})`);

    // Get or create a vehicle
    let vehicle = await Vehicle.findOne({ companyId: driverEmployee.companyId });
    if (!vehicle) {
      console.log('⚠️  No vehicle found, creating one...');
      const lastVehicle = await Vehicle.findOne().sort({ id: -1 });
      const nextVehicleId = lastVehicle ? lastVehicle.id + 1 : 1;
      
      vehicle = new Vehicle({
        id: nextVehicleId,
        companyId: driverEmployee.companyId,
        vehicleNumber: 'DXB-T-1234',
        vehicleType: 'Bus',
        capacity: 45,
        status: 'active',
        createdAt: new Date()
      });
      await vehicle.save();
      console.log(`✅ Created vehicle: ${vehicle.vehicleNumber} (ID: ${vehicle.id})`);
    } else {
      console.log(`✅ Using vehicle: ${vehicle.vehicleNumber} (ID: ${vehicle.id})`);
    }

    // Get the next available task ID
    const lastTask = await FleetTask.findOne().sort({ id: -1 });
    let nextTaskId = lastTask ? lastTask.id + 1 : 1;

    // Create today's date at start of day
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    console.log('\n📋 Creating transport tasks for today...\n');

    // Task 1: Morning Pickup
    const task1 = new FleetTask({
      id: nextTaskId++,
      companyId: driverEmployee.companyId,
      projectId: project.id,
      driverId: driverEmployee.employeeId,
      vehicleId: vehicle.id,
      taskDate: startOfDay,
      plannedPickupTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6, 30, 0),
      plannedDropTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 30, 0),
      pickupLocation: 'Worker Dormitory - Block A',
      pickupAddress: 'Al Quoz Industrial Area 3, Dubai',
      pickupLatitude: 25.1372,
      pickupLongitude: 55.2294,
      dropLocation: project.name,
      dropAddress: project.address || 'Construction Site, Dubai',
      dropLatitude: project.latitude || 25.2048,
      dropLongitude: project.longitude || 55.2708,
      expectedPassengers: 35,
      status: 'PLANNED',
      notes: 'Morning shift pickup - Transport workers to construction site',
      createdAt: new Date()
    });

    await task1.save();
    console.log(`✅ Task 1 created: ID ${task1.id}`);
    console.log(`   Type: Morning Pickup`);
    console.log(`   Time: 6:30 AM - 7:30 AM`);
    console.log(`   Route: Dormitory → ${project.name}`);
    console.log(`   Expected Passengers: 35`);

    // Task 2: Lunch Break Transfer
    const task2 = new FleetTask({
      id: nextTaskId++,
      companyId: driverEmployee.companyId,
      projectId: project.id,
      driverId: driverEmployee.employeeId,
      vehicleId: vehicle.id,
      taskDate: startOfDay,
      plannedPickupTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0),
      plannedDropTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 30, 0),
      pickupLocation: project.name,
      pickupAddress: project.address || 'Construction Site, Dubai',
      pickupLatitude: project.latitude || 25.2048,
      pickupLongitude: project.longitude || 55.2708,
      dropLocation: 'Cafeteria - Central Kitchen',
      dropAddress: 'Al Barsha, Dubai',
      dropLatitude: 25.1122,
      dropLongitude: 55.1960,
      expectedPassengers: 28,
      status: 'PLANNED',
      notes: 'Lunch break - Transport workers to cafeteria',
      createdAt: new Date()
    });

    await task2.save();
    console.log(`\n✅ Task 2 created: ID ${task2.id}`);
    console.log(`   Type: Lunch Transfer`);
    console.log(`   Time: 12:00 PM - 12:30 PM`);
    console.log(`   Route: ${project.name} → Cafeteria`);
    console.log(`   Expected Passengers: 28`);

    // Task 3: Evening Drop-off
    const task3 = new FleetTask({
      id: nextTaskId++,
      companyId: driverEmployee.companyId,
      projectId: project.id,
      driverId: driverEmployee.employeeId,
      vehicleId: vehicle.id,
      taskDate: startOfDay,
      plannedPickupTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 30, 0),
      plannedDropTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 30, 0),
      pickupLocation: project.name,
      pickupAddress: project.address || 'Construction Site, Dubai',
      pickupLatitude: project.latitude || 25.2048,
      pickupLongitude: project.longitude || 55.2708,
      dropLocation: 'Worker Dormitory - Block A',
      dropAddress: 'Al Quoz Industrial Area 3, Dubai',
      dropLatitude: 25.1372,
      dropLongitude: 55.2294,
      expectedPassengers: 40,
      status: 'PLANNED',
      notes: 'Evening shift drop-off - Return workers to dormitory',
      createdAt: new Date()
    });

    await task3.save();
    console.log(`\n✅ Task 3 created: ID ${task3.id}`);
    console.log(`   Type: Evening Drop-off`);
    console.log(`   Time: 5:30 PM - 6:30 PM`);
    console.log(`   Route: ${project.name} → Dormitory`);
    console.log(`   Expected Passengers: 40`);

    // Create sample passengers for Task 1
    const lastPassenger = await FleetTaskPassenger.findOne().sort({ id: -1 });
    let nextPassengerId = lastPassenger ? lastPassenger.id + 1 : 1;

    const passengers = [];
    const workerEmployees = await Employee.find({ 
      companyId: driverEmployee.companyId,
      role: 'worker'
    }).limit(10);

    if (workerEmployees.length > 0) {
      console.log(`\n👥 Adding ${workerEmployees.length} passengers to Task 1...`);
      
      for (const worker of workerEmployees) {
        passengers.push({
          id: nextPassengerId++,
          fleetTaskId: task1.id,
          workerEmployeeId: worker.employeeId,
          companyId: driverEmployee.companyId,
          pickupStatus: 'pending',
          dropStatus: 'pending',
          notes: `Worker: ${worker.name}`,
          createdAt: new Date()
        });
      }

      await FleetTaskPassenger.insertMany(passengers);
      console.log(`✅ Added ${passengers.length} passengers to morning pickup task`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Transport tasks assigned for today');
    console.log('='.repeat(60));
    console.log(`\n📱 Login with:`);
    console.log(`   Email: driver1@gmail.com`);
    console.log(`   Password: Password123@`);
    console.log(`\n📋 Tasks created:`);
    console.log(`   • Morning Pickup: 6:30 AM`);
    console.log(`   • Lunch Transfer: 12:00 PM`);
    console.log(`   • Evening Drop-off: 5:30 PM`);
    console.log(`\n✅ You should now see these tasks in the driver mobile app!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

assignTransportTaskToDriver1();
