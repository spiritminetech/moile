import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FleetTaskPassenger from './src/modules/fleetTask/submodules/fleetTaskPassenger/FleetTaskPassenger.js';
import Employee from './src/modules/employee/Employee.js';
import FleetTask from './src/modules/fleetTask/models/FleetTask.js';

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

const checkPassengerData = async () => {
  try {
    console.log('\n📊 CHECKING PASSENGER DATA\n');
    
    // Get task 10003
    const task = await FleetTask.findOne({ id: 10003 }).lean();
    if (!task) {
      console.log('❌ Task 10003 not found');
      return;
    }
    
    console.log('✅ Task 10003 found:', {
      id: task.id,
      status: task.status,
      driverId: task.driverId
    });
    
    // Get passengers for task 10003
    const passengers = await FleetTaskPassenger.find({ fleetTaskId: 10003 }).lean();
    console.log(`\n👥 Found ${passengers.length} passengers for task 10003:\n`);
    
    for (const p of passengers) {
      console.log(`Passenger ID: ${p.id}`);
      console.log(`  workerEmployeeId: ${p.workerEmployeeId}`);
      console.log(`  pickupStatus: ${p.pickupStatus}`);
      console.log(`  dropStatus: ${p.dropStatus}`);
      
      // Try to find the employee
      const employee = await Employee.findOne({ id: p.workerEmployeeId }).lean();
      if (employee) {
        console.log(`  ✅ Employee found: ${employee.fullName} (ID: ${employee.id})`);
      } else {
        console.log(`  ❌ Employee NOT found with ID: ${p.workerEmployeeId}`);
      }
      console.log('');
    }
    
    // Show all employees
    console.log('\n📋 ALL EMPLOYEES IN DATABASE:\n');
    const allEmployees = await Employee.find({}).lean();
    allEmployees.forEach(e => {
      console.log(`  ID: ${e.id}, Name: ${e.fullName}, Phone: ${e.phone}`);
    });
    
    console.log(`\n📊 Total employees: ${allEmployees.length}`);
    
  } catch (error) {
    console.error('❌ Error checking passenger data:', error);
  }
};

const main = async () => {
  await connectDB();
  await checkPassengerData();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  process.exit(0);
};

main();
