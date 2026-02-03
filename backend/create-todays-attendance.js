import mongoose from 'mongoose';
import Attendance from './src/modules/attendance/Attendance.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function createTodaysAttendance() {
  console.log('🔧 Creating Today\'s Attendance Record');
  console.log('====================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today: ${today}`);

    // Check if today's attendance already exists
    const existingAttendance = await Attendance.findOne({
      employeeId: 107,
      projectId: 1,
      date: today
    });

    if (existingAttendance) {
      console.log('✅ Today\'s attendance record already exists');
      console.log('   Check-in:', existingAttendance.checkIn);
      console.log('   Lunch start:', existingAttendance.lunchStartTime);
      return;
    }

    // Create today's attendance record
    const attendance = new Attendance({
      employeeId: 107,
      projectId: 1,
      date: today,
      checkIn: new Date(), // Clock in now
      checkOut: null,
      lunchStartTime: null,
      lunchEndTime: null,
      overtimeStartTime: null,
      pendingCheckout: true,
      insideGeofenceAtCheckin: true
    });

    await attendance.save();
    console.log('✅ Created today\'s attendance record');
    console.log('   Employee ID: 107');
    console.log('   Project ID: 1');
    console.log('   Date:', today);
    console.log('   Check-in time:', attendance.checkIn);

    console.log('\n📱 Now the mobile app lunch break functionality should work!');

  } catch (error) {
    console.error('❌ Failed to create attendance:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createTodaysAttendance();