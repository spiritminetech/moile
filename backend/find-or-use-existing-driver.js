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
const Role = mongoose.model('Role', new mongoose.Schema({}, { strict: false }), 'roles');
const FleetTask = mongoose.model('FleetTask', new mongoose.Schema({}, { strict: false }), 'fleettasks');
const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');
const Vehicle = mongoose.model('Vehicle', new mongoose.Schema({}, { strict: false }), 'vehicles');

async function findOrUseExistingDriver() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all driver employees
    const driverEmployees = await Employee.find({ role: 'driver' });
    console.log(`Found ${driverEmployees.length} driver employees\n`);

    let driverEmployee;
    let driverUser;

    if (driverEmployees.length > 0) {
      // Use the first driver employee
      driverEmployee = driverEmployees[0];
      console.log(`✅ Using existing driver employee:`);
      console.log(`   Name: ${driverEmployee.name}`);
      console.log(`   EmployeeID: ${driverEmployee.employeeId}`);
      console.log(`   Email: ${driverEmployee.email}`);

      // Find or update the user
      if (driverEmployee.userId) {
        driverUser = await User.findById(driverEmployee.userId);
      }
      
      if (!driverUser) {
        // Find user by email
        driverUser = await User.findOne({ email: driverEmployee.email });
      }

      if (driverUser) {
        console.log(`✅ Found user account: ${driverUser.email}`);
        
        // Update to driver1@gmail.com and Password123@
        driverUser.email = 'driver1@gmail.com';
        const hashedPassword = await bcrypt.hash('Password123@', 10);
        driverUser.password = hashedPassword;
        driverUser.isActive = true;
        await driverUser.save();
        
        // Update employee email too
        driverEmployee.email = 'driver1@gmail.com';
        driverEmployee.userId = driverUser._id;
        await driverEmployee.save();
        
        console.log(`✅ Updated credentials to driver1@gmail.com / Password123@`);
      } else {
        // Create new user for this employee
        const driverRole = await Role.findOne({ name: 'driver' });
        const hashedPassword = await bcrypt.hash('Password123@', 10);
        
        driverUser = new User({
          email: 'driver1@gmail.com',
          username: 'driver1',
          password: hashedPassword,
          role: driverRole._id,
          isActive: true,
          createdAt: new Date()
        });
        await driverUser.save();
        
        driverEmployee.email = 'driver1@gmail.com';
        driverEmployee.userId = driverUser._id;
        await driverEmployee.save();
        
        console.log(`✅ Created new user account: driver1@gmail.com`);
      }
    } else {
      console.log('❌ No driver employees found in database');
      console.log('💡 Please create a driver employee first or check the database');
      return;
    }

    // Get project - try to find any project first
    let project = await Project.findOne({ companyId: driverEmployee.companyId });
    
    if (!project) {
      console.log(`⚠️  No project found for company ${driverEmployee.companyId}`);
      console.log('   Looking for any available project...');
      
      project = await Project.findOne({});
      if (!project) {
        console.log('❌ No projects found in database at all');
        return;
      }
      
      console.log(`   Found project: ${project.name} (Company: ${project.companyId})`);
      console.log(`   Updating driver to use this company...`);
      
      // Update driver employee to use this company
      driverEmployee.companyId = project.companyId;
      await driverEmployee.save();
      console.log(`✅ Updated driver company to ${project.companyId}`);
    }
    
    console.log(`✅ Using project: ${project.name} (ID: ${project.id})`);

    // Update user's current project
    driverUser.currentProjectId = project.id;
    await driverUser.save();

    // Get or create vehicle
    let vehicle = await Vehicle.findOne({ companyId: driverEmployee.companyId });
    if (!vehicle) {
      const lastVehicle = await Vehicle.findOne().sort({ id: -1 });
      const nextVehicleId = lastVehicle ? lastVehicle.id + 1 : 1;
      
      vehicle = new Vehicle({
        id: nextVehicleId,
        companyId: driverEmployee.companyId,
        vehicleNumber: 'DXB-T-1234',
        vehicleType: 'Bus',
        capacity: 45,
        status: 'active',
        driverId: driverEmployee.employeeId,
        createdAt: new Date()
      });
      await vehicle.save();
      console.log(`✅ Created vehicle: ${vehicle.vehicleNumber}`);
    } else {
      vehicle.driverId = driverEmployee.employeeId;
      await vehicle.save();
      console.log(`✅ Using vehicle: ${vehicle.vehicleNumber}`);
    }

    // Delete existing tasks for today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    await FleetTask.deleteMany({
      driverId: driverEmployee.employeeId,
      taskDate: { $gte: startOfDay, $lte: endOfDay }
    });

    // Get next task ID
    const lastTask = await FleetTask.findOne().sort({ id: -1 });
    let nextTaskId = lastTask ? lastTask.id + 1 : 1;

    console.log('\n📋 Creating transport tasks for today...\n');

    // Create 3 tasks
    const tasks = [
      {
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
        notes: 'Morning shift pickup',
        createdAt: new Date()
      },
      {
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
        notes: 'Lunch break transfer',
        createdAt: new Date()
      },
      {
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
        notes: 'Evening shift drop-off',
        createdAt: new Date()
      }
    ];

    for (const taskData of tasks) {
      const task = new FleetTask(taskData);
      await task.save();
      const time = taskData.plannedPickupTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      console.log(`✅ Task ${task.id}: ${taskData.notes} - ${time}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS!');
    console.log('='.repeat(60));
    console.log(`\n📱 Login Credentials:`);
    console.log(`   Email: driver1@gmail.com`);
    console.log(`   Password: Password123@`);
    console.log(`\n👤 Driver: ${driverEmployee.name} (ID: ${driverEmployee.employeeId})`);
    console.log(`🚗 Vehicle: ${vehicle.vehicleNumber}`);
    console.log(`\n📋 ${tasks.length} transport tasks created for today`);
    console.log(`\n✅ Close and reopen the app to see the tasks!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

findOrUseExistingDriver();
