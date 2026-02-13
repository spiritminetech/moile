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

/**
 * Simulate what the getWorkerManifests API returns
 */
const testApiResponse = async () => {
  try {
    const taskId = 10003;
    const companyId = 1;
    
    console.log(`\n📋 Simulating getWorkerManifests API for task ${taskId}\n`);
    
    const task = await FleetTask.findOne({
      id: taskId,
      companyId
    });

    if (!task) {
      console.log('❌ Task not found');
      return;
    }

    const passengers = await FleetTaskPassenger.find({
      fleetTaskId: taskId
    }).lean();

    const employeeIds = passengers.map(p => p.workerEmployeeId);
    
    console.log('🔍 Looking up employees:', {
      employeeIds,
      companyId,
      query: { id: { $in: employeeIds }, companyId }
    });
    
    const employees = await Employee.find({
      id: { $in: employeeIds },
      companyId
    }).lean();
    
    console.log('✅ Employees found:', {
      count: employees.length,
      employees: employees.map(e => ({ id: e.id, name: e.fullName }))
    });

    const employeeMap = Object.fromEntries(employees.map(e => [e.id, e]));

    const manifests = passengers.map(p => {
      const employee = employeeMap[p.workerEmployeeId];
      
      const pickupStatus = p.pickupStatus || 'pending';
      
      return {
        workerId: p.workerEmployeeId,
        workerName: employee?.fullName || `Worker ${p.workerEmployeeId}`,
        employeeId: employee?.employeeId || 'N/A',
        department: employee?.department || 'N/A',
        contactNumber: employee?.phone || 'N/A',
        roomNumber: employee?.roomNumber || 'N/A',
        trade: employee?.trade || 'General Labor',
        supervisorName: employee?.supervisorName || 'N/A',
        pickupStatus: pickupStatus,
        pickupConfirmedAt: p.pickupConfirmedAt || null,
        pickupLocation: p.pickupLocation || task.pickupLocation,
        dropLocation: p.dropLocation || task.dropLocation,
        dropStatus: p.dropStatus || 'pending',
        dropConfirmedAt: p.dropConfirmedAt || null
      };
    });

    console.log('\n📦 API RESPONSE (what frontend receives):\n');
    console.log(JSON.stringify({
      success: true,
      data: manifests
    }, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

const main = async () => {
  await connectDB();
  await testApiResponse();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  process.exit(0);
};

main();
