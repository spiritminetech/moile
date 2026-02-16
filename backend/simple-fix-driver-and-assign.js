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

async function simpleFixAndAssign() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get driver role
    const driverRole = await Role.findOne({ name: 'driver' });
    
    // Find driver user
    let driverUser = await User.findOne({ email: 'driver1@gmail.com' });
    
    if (!driverUser) {
      console.log('❌ Driver user not found. Creating...');
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
      console.log('✅ Created driver user');
    } else {
      // Update password
      const hashedPassword = await bcrypt.hash('Password123@', 10);
      driverUser.password = hashedPassword;
      driverUser.isActive = true;
      await driverUser.save();
      console.log('✅ Updated driver password');
    }

    // Find employee by userId
    let driverEmployee = await Employee.findOne({ userId: driverUser._id });
    
    if (!driverEmployee) {
      console.log('⚠️  No employee found. Checking all employees...');
      
      // Get all employees and find max employeeId
      const allEmployees = await Employee.find({});
      const numericEmployees = allEmployees.filter(e => typeof e.employeeId === 'number');
      
      let nextEmployeeId = 200;
      if (numericEmployees.length > 0) {
        const maxEmpId = Math.max(...numericEmployees.map(e => e.employeeId));
        nextEmployeeId = maxEmpId + 1;
      }
      
      console.log(`   Next available employeeId: ${nextEmployeeId}`);
      
      // Get company ID from any project
      const anyProject = await Project.findOne();
      const companyId = anyProject ? anyProject.companyId : 1;
      
      // Create employee WITHOUT the id field (let MongoDB handle _id)
      driverEmployee = new Employee({
        employeeId: nextEmployeeId,
        userId: driverUser._id,
        name: 'Driver One',
        email: 'driver1@gmail.com',
        phone: '+971501234567',
        role: 'driver',
        companyId: companyId,
        isActive: true,
        createdAt: new Date()
      });
      await driverEmployee.save();
      console.log(`✅ Created employee: ${driverEmployee.name} (EmployeeID: ${driverEmployee.employeeId})`);
    } else {
      console.log(`✅ Found employee: ${driverEmployee.name} (EmployeeID: ${driverEmployee.employeeId})`);
    }

    // Get project
    const project = await Project.findOne({ companyId: driverEmployee.companyId });
    if (!project) {
      console.log('❌ No project found');
      return;
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

    console.log('\n📋 Creating transport tasks...\n');

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
    console.log(`\n📱 Login:`);
    console.log(`   Email: driver1@gmail.com`);
    console.log(`   Password: Password123@`);
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

simpleFixAndAssign();
