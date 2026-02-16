import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './src/modules/attendance/Attendance.js';

dotenv.config();

async function testAttendanceQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const employeeId = 2;
    
    // This is the EXACT query used in workerController.js
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log('🔍 Testing the EXACT query from workerController.js:');
    console.log('=' .repeat(70));
    console.log('Query parameters:');
    console.log(`  employeeId: ${employeeId}`);
    console.log(`  checkIn: { $exists: true, $ne: null }`);
    console.log(`  date: { $gte: ${startOfToday.toISOString()}, $lt: ${startOfTomorrow.toISOString()} }`);
    console.log('');

    const todayAttendance = await Attendance.findOne({
      employeeId: employeeId,
      checkIn: { $exists: true, $ne: null },
      date: { $gte: startOfToday, $lt: startOfTomorrow }
    });

    console.log('Result from Date object query:');
    if (todayAttendance) {
      console.log('✅ FOUND attendance record');
      console.log(`   ID: ${todayAttendance.id}`);
      console.log(`   Status: ${todayAttendance.status}`);
      console.log(`   Date: ${todayAttendance.date}`);
      console.log(`   Check-in: ${todayAttendance.checkIn || todayAttendance.checkInTime}`);
    } else {
      console.log('❌ NO attendance record found');
      console.log('   This is why you get "You must check in before starting tasks"');
    }

    console.log('\n' + '=' .repeat(70));
    console.log('🔍 Let\'s check what\'s actually in the database:\n');

    // Check with checkInTime field (what we actually have)
    const attendanceWithCheckInTime = await Attendance.findOne({
      employeeId: employeeId,
      checkInTime: { $exists: true, $ne: null },
      date: '2026-02-15'
    });

    console.log('Result with checkInTime field and string date:');
    if (attendanceWithCheckInTime) {
      console.log('✅ FOUND attendance record');
      console.log(`   ID: ${attendanceWithCheckInTime.id}`);
      console.log(`   Status: ${attendanceWithCheckInTime.status}`);
      console.log(`   Date: ${attendanceWithCheckInTime.date} (type: ${typeof attendanceWithCheckInTime.date})`);
      console.log(`   Check-in Time: ${attendanceWithCheckInTime.checkInTime}`);
    } else {
      console.log('❌ NO attendance record found');
    }

    console.log('\n' + '=' .repeat(70));
    console.log('📊 DIAGNOSIS:\n');
    
    if (!todayAttendance && attendanceWithCheckInTime) {
      console.log('❌ PROBLEM IDENTIFIED:');
      console.log('   1. Attendance record exists in database');
      console.log('   2. But the query is looking for:');
      console.log('      - Field name: "checkIn" (but database has "checkInTime")');
      console.log('      - Date type: Date object (but database has string)');
      console.log('');
      console.log('💡 SOLUTION:');
      console.log('   Need to fix the attendance record to match what the API expects');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

testAttendanceQuery();
