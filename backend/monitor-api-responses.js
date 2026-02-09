// Monitor what the backend API is actually returning
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import the actual backend functions
import FleetTask from './src/modules/fleetTask/models/FleetTask.js';
import FleetTaskPassenger from './src/modules/fleetTask/submodules/fleetTaskPassenger/FleetTaskPassenger.js';
import Employee from './src/modules/employee/Employee.js';
import Attendance from './src/modules/attendance/Attendance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function monitorAPIResponses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to MongoDB\n');

    // Simulate the exact same logic as getWorkerManifests function
    const taskId = 10003; // Test with task 10003
    const driverId = 50;
    const companyId = 1;

    console.log(`🔍 Simulating getWorkerManifests API for task ${taskId}\n`);

    // 1. Find the task
    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId,
      companyId
    });

    if (!task) {
      console.log('❌ Task not found');
      return;
    }

    console.log(`✅ Found task: ${task.id}`);

    // 2. Get passengers
    const passengers = await FleetTaskPassenger.find({
      fleetTaskId: Number(taskId)
    }).lean();

    console.log(`👥 Found ${passengers.length} passengers:`);
    passengers.forEach(p => {
      console.log(`   - workerEmployeeId: ${p.workerEmployeeId}`);
    });

    if (passengers.length === 0) {
      console.log('❌ No passengers found');
      await mongoose.disconnect();
      return;
    }

    // 3. Get employee details
    const employeeIds = passengers.map(p => p.workerEmployeeId);
    const employees = await Employee.find({
      id: { $in: employeeIds },
      companyId
    }).lean();

    console.log(`\n👤 Found ${employees.length} employee records`);

    const employeeMap = Object.fromEntries(employees.map(e => [e.id, e]));

    // 4. Check attendance (the key part!)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`\n📅 Checking attendance for date range:`);
    console.log(`   From: ${today.toISOString()}`);
    console.log(`   To: ${tomorrow.toISOString()}`);

    const todayAttendance = await Attendance.find({
      employeeId: { $in: employeeIds },
      date: { $gte: today, $lt: tomorrow },
      checkIn: { $ne: null }
    }).lean();

    console.log(`\n📊 Attendance query result: ${todayAttendance.length} records`);
    todayAttendance.forEach(att => {
      console.log(`   ✅ Employee ${att.employeeId}: checkIn = ${att.checkIn}`);
    });

    const checkedInEmployeeIds = new Set(todayAttendance.map(att => att.employeeId));

    // 5. Build the API response (exact same as backend)
    const manifests = passengers.map(p => {
      const employee = employeeMap[p.workerEmployeeId];
      const isCheckedIn = checkedInEmployeeIds.has(p.workerEmployeeId);
      
      return {
        workerId: p.workerEmployeeId,
        workerName: employee?.fullName || 'Unknown',
        employeeId: employee?.employeeId || 'N/A',
        department: employee?.department || 'N/A',
        contactNumber: employee?.phone || 'N/A',
        roomNumber: employee?.roomNumber || 'N/A',
        status: isCheckedIn ? 'checked-in' : 'Pending',
        pickupLocation: p.pickupLocation || task.pickupLocation,
        dropLocation: p.dropLocation || task.dropLocation
      };
    });

    console.log(`\n📋 API Response (what frontend receives):`);
    console.log(`{`);
    console.log(`  "success": true,`);
    console.log(`  "data": [`);
    manifests.forEach((manifest, idx) => {
      console.log(`    {`);
      console.log(`      "workerId": ${manifest.workerId},`);
      console.log(`      "workerName": "${manifest.workerName}",`);
      console.log(`      "status": "${manifest.status}",`);
      console.log(`      "contactNumber": "${manifest.contactNumber}"`);
      console.log(`    }${idx < manifests.length - 1 ? ',' : ''}`);
    });
    console.log(`  ]`);
    console.log(`}`);

    // 6. Frontend calculation
    const checkedInCount = manifests.filter(w => w.status === 'checked-in').length;
    
    console.log(`\n🎯 Frontend calculation:`);
    console.log(`   worker.status === 'checked-in': ${checkedInCount} workers`);
    console.log(`   Total workers: ${manifests.length}`);
    console.log(`   Should show: "${checkedInCount} checked in"`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

monitorAPIResponses();