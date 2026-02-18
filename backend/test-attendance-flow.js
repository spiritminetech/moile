// Test script to verify attendance flow
// Run with: node test-attendance-flow.js

import mongoose from 'mongoose';
import Attendance from './src/modules/attendance/Attendance.js';
import Employee from './src/modules/employee/Employee.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function testAttendanceFlow() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test employee ID (adjust based on your data)
    const employeeId = 2;
    const projectId = 1003;

    // Get today's date
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    console.log('\n📊 Checking attendance for employee:', employeeId);
    console.log('📅 Date:', todayDate);

    // Find today's attendance
    const attendance = await Attendance.findOne({
      employeeId: employeeId,
      projectId: projectId,
      date: todayDate
    });

    if (!attendance) {
      console.log('❌ No attendance record found for today');
    } else {
      console.log('\n✅ Attendance record found:');
      console.log('  - Check In:', attendance.checkIn);
      console.log('  - Check Out:', attendance.checkOut);
      console.log('  - Lunch Start:', attendance.lunchStartTime);
      console.log('  - Lunch End:', attendance.lunchEndTime);
      console.log('  - Pending Checkout:', attendance.pendingCheckout);

      // Determine session status
      let session = 'NOT_LOGGED_IN';
      let isOnLunchBreak = false;

      if (attendance.checkOut) {
        session = 'CHECKED_OUT';
      } else if (attendance.checkIn) {
        if (attendance.lunchStartTime && !attendance.lunchEndTime) {
          session = 'ON_LUNCH';
          isOnLunchBreak = true;
        } else {
          session = 'CHECKED_IN';
        }
      }

      console.log('\n📊 Session Status:');
      console.log('  - Session:', session);
      console.log('  - On Lunch Break:', isOnLunchBreak);
      console.log('  - Can Clock In:', session === 'NOT_LOGGED_IN' || session === 'CHECKED_OUT');
      console.log('  - Can Clock Out:', session === 'CHECKED_IN' && !isOnLunchBreak);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testAttendanceFlow();
