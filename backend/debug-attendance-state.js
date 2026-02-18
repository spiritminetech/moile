// Debug script to check attendance state in database
// Run with: node debug-attendance-state.js

import mongoose from 'mongoose';
import Attendance from './src/modules/attendance/Attendance.js';
import Employee from './src/modules/employee/Employee.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function debugAttendanceState() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get today's date
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const todayString = todayDate.toISOString().split('T')[0];

    console.log('📅 Today:', todayString);
    console.log('📅 Today Date Object:', todayDate);
    console.log('');

    // Find all attendance records for today
    const allTodayAttendance = await Attendance.find({
      date: todayDate
    }).sort({ employeeId: 1 });

    console.log(`📊 Found ${allTodayAttendance.length} attendance records for today:\n`);

    for (const att of allTodayAttendance) {
      console.log('─'.repeat(80));
      console.log(`Employee ID: ${att.employeeId} | Project ID: ${att.projectId}`);
      console.log('─'.repeat(80));
      console.log('Check In:', att.checkIn);
      console.log('Check Out:', att.checkOut);
      console.log('Lunch Start:', att.lunchStartTime);
      console.log('Lunch End:', att.lunchEndTime);
      console.log('Overtime Start:', att.overtimeStartTime);
      console.log('Pending Checkout:', att.pendingCheckout);
      console.log('Inside Geofence (Check-in):', att.insideGeofenceAtCheckin);
      console.log('Inside Geofence (Check-out):', att.insideGeofenceAtCheckout);
      
      // Calculate session status
      let session = 'NOT_LOGGED_IN';
      let isOnLunchBreak = false;

      if (att.checkOut) {
        session = 'CHECKED_OUT';
      } else if (att.checkIn) {
        if (att.lunchStartTime && !att.lunchEndTime) {
          session = 'ON_LUNCH';
          isOnLunchBreak = true;
        } else {
          session = 'CHECKED_IN';
        }
      }

      console.log('\n📊 Calculated Status:');
      console.log('  Session:', session);
      console.log('  On Lunch Break:', isOnLunchBreak);
      console.log('  Can Clock In:', session === 'NOT_LOGGED_IN' || session === 'CHECKED_OUT');
      console.log('  Can Clock Out:', session === 'CHECKED_IN' && !isOnLunchBreak);
      console.log('');
    }

    if (allTodayAttendance.length === 0) {
      console.log('❌ No attendance records found for today');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugAttendanceState();
