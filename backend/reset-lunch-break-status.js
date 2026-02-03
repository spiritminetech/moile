import mongoose from 'mongoose';
import Attendance from './src/modules/attendance/Attendance.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function resetLunchBreakStatus() {
  console.log('🔄 Resetting Lunch Break Status');
  console.log('===============================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today: ${today}`);

    // Find today's attendance record for employee 107
    const attendance = await Attendance.findOne({
      employeeId: 107,
      date: today
    });

    if (!attendance) {
      console.log('❌ No attendance record found for today');
      return;
    }

    console.log('📋 Current attendance status:');
    console.log(`   Check-in: ${attendance.checkIn}`);
    console.log(`   Check-out: ${attendance.checkOut}`);
    console.log(`   Lunch start: ${attendance.lunchStartTime}`);
    console.log(`   Lunch end: ${attendance.lunchEndTime}`);

    // Reset lunch break times
    attendance.lunchStartTime = null;
    attendance.lunchEndTime = null;
    await attendance.save();

    console.log('✅ Reset lunch break times');
    console.log('\n📱 Now you can test the lunch break functionality from the beginning');

  } catch (error) {
    console.error('❌ Reset failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

resetLunchBreakStatus();