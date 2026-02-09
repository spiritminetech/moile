// Test if the attendance-based logic is working
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
import FleetTask from './src/modules/fleetTask/models/FleetTask.js';
import FleetTaskPassenger from './src/modules/fleetTask/submodules/fleetTaskPassenger/FleetTaskPassenger.js';
import Employee from './src/modules/employee/Employee.js';
import Attendance from './src/modules/attendance/Attendance.js';

async function testAttendanceLogic() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to MongoDB\n');

    // Test the exact logic from getWorkerManifests
    const taskId = 10003; // Use task 10003 as example
    
    console.log(`🔍 Testing attendance logic for task ${taskId}\n`);

    // 1. Get passengers for the task
    const passengers = await FleetTaskPassenger.find({
      fleetTaskId: Number(taskId)
    }).lean();

    console.log(`📋 Found ${passengers.length} passengers:`);
    passengers.forEach(p => {
      console.log(`   - Worker ${p.workerEmployeeId}`);
    });

    if (passengers.length === 0) {
      console.log('❌ No passengers found for this task');
      await mongoose.disconnect();
      return;
    }

    const employeeIds = passengers.map(p => p.workerEmployeeId);
    console.log(`\n👥 Employee IDs to check: [${employeeIds.join(', ')}]`);

    // 2. Get employees
    const employees = await Employee.find({
      id: { $in: employeeIds },
      companyId: 1
    }).lean();

    console.log(`\n👤 Found ${employees.length} employee records:`);
    employees.forEach(e => {
      console.log(`   - ID ${e.id}: ${e.fullName || 'Unknown'}`);
    });

    // 3. Check attendance for today (exact same logic as backend)
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
    
    if (todayAttendance.length > 0) {
      todayAttendance.forEach(att => {
        console.log(`   ✅ Employee ${att.employeeId}: checkIn = ${att.checkIn}`);
      });
    } else {
      console.log('   ❌ No attendance records found with checkIn for today');
      
      // Let's check if there are ANY attendance records for these employees
      console.log('\n🔍 Checking for ANY attendance records for these employees:');
      const anyAttendance = await Attendance.find({
        employeeId: { $in: employeeIds }
      }).sort({ date: -1 }).limit(10).lean();
      
      console.log(`   Found ${anyAttendance.length} total attendance records:`);
      anyAttendance.forEach(att => {
        const attDate = new Date(att.date);
        console.log(`   - Employee ${att.employeeId}: date=${attDate.toLocaleDateString()}, checkIn=${att.checkIn || 'null'}`);
      });
    }

    const checkedInEmployeeIds = new Set(todayAttendance.map(att => att.employeeId));

    // 4. Build the response (same as backend)
    console.log(`\n📝 Building manifest response:`);
    const manifests = passengers.map(p => {
      const employee = employees.find(e => e.id === p.workerEmployeeId);
      const isCheckedIn = checkedInEmployeeIds.has(p.workerEmployeeId);
      
      console.log(`   Worker ${p.workerEmployeeId}: ${isCheckedIn ? '✅ CHECKED IN' : '⏳ PENDING'}`);
      
      return {
        workerId: p.workerEmployeeId,
        workerName: employee?.fullName || 'Unknown',
        status: isCheckedIn ? 'checked-in' : 'Pending'
      };
    });

    const checkedInCount = manifests.filter(m => m.status === 'checked-in').length;
    
    console.log(`\n🎯 FINAL RESULT:`);
    console.log(`   Total workers: ${manifests.length}`);
    console.log(`   Checked in: ${checkedInCount}`);
    console.log(`   Dashboard should show: "${checkedInCount} of ${manifests.length} Checked In Today"`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAttendanceLogic();