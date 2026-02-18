import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function createDriverTasksWithNumericIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const FleetTask = mongoose.model('FleetTask', new mongoose.Schema({}, { strict: false }), 'fleetTasks');
    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }), 'employees');
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');
    const Vehicle = mongoose.model('Vehicle', new mongoose.Schema({}, { strict: false }), 'vehicles');

    // Get driver
    const driver = await Employee.findOne({ email: 'driver1@gmail.com' });
    if (!driver) {
      console.log('❌ Driver not found!');
      return;
    }

    console.log(`👤 Driver: ${driver.fullName || driver.name}`);
    console.log(`   Employee ID: ${driver.employeeId} (type: ${typeof driver.employeeId})`);
    console.log(`   Company ID: ${driver.companyId} (type: ${typeof driver.companyId})\n`);

    // Find project with numeric id field
    const projects = await Project.find({ companyId: driver.companyId }).limit(5).lean();
    console.log(`📍 Found ${projects.length} projects for company ${driver.companyId}:`);
    
    let project = null;
    for (const p of projects) {
      console.log(`   Project: ${p.name}`);
      console.log(`      _id: ${p._id} (${typeof p._id})`);
      console.log(`      id: ${p.id} (${typeof p.id})`);
      
      if (typeof p.id === 'number') {
        project = p;
        console.log(`      ✅ Using this project (has numeric id)\n`);
        break;
      }
    }

    if (!project) {
      console.log('\n⚠️  No project with numeric id found. Using first project anyway...');
      project = projects[0];
    }

    // Find vehicle with numeric id
    const vehicles = await Vehicle.find({ companyId: driver.companyId }).limit(5).lean();
    console.log(`🚗 Found ${vehicles.length} vehicles for company ${driver.companyId}:`);
    
    let vehicle = null;
    for (const v of vehicles) {
      console.log(`   Vehicle: ${v.vehicleNumber || v.registrationNo}`);
      console.log(`      _id: ${v._id} (${typeof v._id})`);
      console.log(`      id: ${v.id} (${typeof v.id})`);
      
      if (typeof v.id === 'number') {
        vehicle = v;
        console.log(`      ✅ Using this vehicle (has numeric id)\n`);
        break;
      }
    }

    if (!vehicle) {
      console.log('\n⚠️  No vehicle with numeric id found. Creating one...');
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
      console.log(`✅ Created vehicle with id: ${vehicle.id} (${typeof vehicle.id})\n`);
    }

    // Ensure we have numeric IDs
    const projectId = typeof project.id === 'number' ? project.id : 1;
    const vehicleId = typeof vehicle.id === 'number' ? vehicle.id : 1;

    console.log('🔢 IDs to use:');
    console.log(`   Driver ID: ${driver.employeeId} (${typeof driver.employeeId})`);
    console.log(`   Company ID: ${driver.companyId} (${typeof driver.companyId})`);
    console.log(`   Project ID: ${projectId} (${typeof projectId})`);
    console.log(`   Vehicle ID: ${vehicleId} (${typeof vehicleId})\n`);

    // Delete existing tasks for today
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    console.log('🗑️  Cleaning up existing tasks...');
    await FleetTask.deleteMany({
      driverId: driver.employeeId,
      taskDate: { $gte: startOfDay, $lte: endOfDay }
    });
    
    // Also clean up any null ID tasks
    await FleetTask.deleteMany({
      $or: [
        { id: null },
        { id: { $exists: false } }
      ]
    });
    console.log('✅ Cleanup complete\n');

    // Get next task ID
    const lastTask = await FleetTask.findOne({ id: { $type: 'number' } }).sort({ id: -1 });
    let nextId = lastTask ? lastTask.id + 1 : 10001;

    console.log(`🔢 Starting task ID: ${nextId}\n`);
    console.log('📋 Creating 3 transport tasks...\n');

    // Create tasks
    const tasksData = [
      {
        id: nextId++,
        companyId: Number(driver.companyId),
        projectId: Number(projectId),
        driverId: Number(driver.employeeId),
        vehicleId: Number(vehicleId),
        taskDate: startOfDay,
        plannedPickupTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 6, 30, 0)),
        plannedDropTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 7, 30, 0)),
        pickupLocation: 'Worker Dormitory - Block A',
        pickupAddress: 'Al Quoz Industrial Area 3, Dubai',
        dropLocation: project.name || 'Construction Site',
        dropAddress: project.address || 'Dubai, UAE',
        expectedPassengers: 35,
        status: 'PLANNED',
        notes: 'Morning shift pickup',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: nextId++,
        companyId: Number(driver.companyId),
        projectId: Number(projectId),
        driverId: Number(driver.employeeId),
        vehicleId: Number(vehicleId),
        taskDate: startOfDay,
        plannedPickupTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0)),
        plannedDropTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 30, 0)),
        pickupLocation: project.name || 'Construction Site',
        pickupAddress: project.address || 'Dubai, UAE',
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
        projectId: Number(projectId),
        driverId: Number(driver.employeeId),
        vehicleId: Number(vehicleId),
        taskDate: startOfDay,
        plannedPickupTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 17, 30, 0)),
        plannedDropTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 18, 30, 0)),
        pickupLocation: project.name || 'Construction Site',
        pickupAddress: project.address || 'Dubai, UAE',
        dropLocation: 'Worker Dormitory - Block A',
        dropAddress: 'Al Quoz Industrial Area 3, Dubai',
        expectedPassengers: 40,
        status: 'PLANNED',
        notes: 'Evening shift drop-off',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const createdTasks = [];
    for (const taskData of tasksData) {
      try {
        const task = await FleetTask.create(taskData);
        createdTasks.push(task);
        const time = new Date(taskData.plannedPickupTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        console.log(`✅ Task ${task.id}: ${taskData.notes} - ${time}`);
        console.log(`   From: ${taskData.pickupLocation}`);
        console.log(`   To: ${taskData.dropLocation}`);
        console.log(`   Passengers: ${taskData.expectedPassengers}\n`);
      } catch (err) {
        console.error(`❌ Failed to create task: ${err.message}`);
        console.log('Task data:', JSON.stringify(taskData, null, 2));
      }
    }

    // Verify
    const driverTasks = await FleetTask.find({
      driverId: driver.employeeId,
      companyId: driver.companyId,
      taskDate: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    console.log('=' .repeat(60));
    console.log(`🎉 SUCCESS! Created ${createdTasks.length} tasks!`);
    console.log(`📊 Verification: Found ${driverTasks.length} tasks for driver`);
    console.log('=' .repeat(60));
    console.log('\n📱 LOGIN CREDENTIALS:');
    console.log('   Email: driver1@gmail.com');
    console.log('   Password: Password123@');
    console.log('\n✅ Refresh the mobile app to see the transport tasks!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createDriverTasksWithNumericIds();
