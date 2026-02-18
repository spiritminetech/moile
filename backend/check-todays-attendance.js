import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkTodaysAttendance() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const attendancesCollection = db.collection('attendances');
    const employeesCollection = db.collection('employees');
    const projectsCollection = db.collection('projects');

    const today = '2026-02-15';

    console.log('📅 Checking Attendance for: ' + today);
    console.log('='.repeat(60) + '\n');

    // Get all attendance records for today
    const attendanceRecords = await attendancesCollection.find({
      date: today
    }).sort({ checkInTime: 1 }).toArray();

    if (attendanceRecords.length === 0) {
      console.log('   ❌ No attendance records found for today\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`📊 Found ${attendanceRecords.length} attendance record(s):\n`);

    for (let i = 0; i < attendanceRecords.length; i++) {
      const record = attendanceRecords[i];
      
      // Get employee details
      const employee = await employeesCollection.findOne({ id: record.employeeId });
      
      // Get project details
      const project = await projectsCollection.findOne({ id: record.projectId });

      console.log(`${i + 1}. Employee: ${employee?.fullName || 'Unknown'} (ID: ${record.employeeId})`);
      console.log(`   Attendance ID: ${record.id}`);
      console.log(`   Project: ${project?.name || 'Unknown'} (ID: ${record.projectId})`);
      console.log(`   Status: ${record.status}`);
      
      if (record.checkInTime) {
        const checkInTime = new Date(record.checkInTime);
        console.log(`   ✅ Check-in: ${checkInTime.toLocaleString()}`);
      }
      
      if (record.checkOutTime) {
        const checkOutTime = new Date(record.checkOutTime);
        console.log(`   🏁 Check-out: ${checkOutTime.toLocaleString()}`);
      }
      
      if (record.checkInLocation) {
        console.log(`   📍 Location: ${record.checkInLocation.latitude}, ${record.checkInLocation.longitude}`);
      }
      
      if (record.isLate !== undefined) {
        console.log(`   ⏰ Late: ${record.isLate ? 'Yes' : 'No'}`);
      }
      
      if (record.workHours !== undefined) {
        console.log(`   ⏱️  Work Hours: ${record.workHours}`);
      }
      
      console.log('');
    }

    // Check specific employee (worker@gmail.com - Employee ID 2)
    console.log('='.repeat(60));
    console.log('\n👤 Checking Employee ID 2 (Ravi Smith / worker@gmail.com):\n');
    
    const workerAttendance = await attendancesCollection.findOne({
      employeeId: 2,
      date: today
    });

    if (workerAttendance) {
      console.log('   ✅ Checked in today');
      console.log(`   Status: ${workerAttendance.status}`);
      console.log(`   Check-in: ${new Date(workerAttendance.checkInTime).toLocaleString()}`);
      
      if (workerAttendance.checkOutTime) {
        console.log(`   Check-out: ${new Date(workerAttendance.checkOutTime).toLocaleString()}`);
      } else {
        console.log('   Check-out: Not yet');
      }
      
      console.log(`   Work Hours: ${workerAttendance.workHours || 0}`);
    } else {
      console.log('   ❌ Not checked in today');
    }

    console.log('\n' + '='.repeat(60));

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkTodaysAttendance();
