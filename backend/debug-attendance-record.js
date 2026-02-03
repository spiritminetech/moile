import mongoose from 'mongoose';
import Attendance from './src/modules/attendance/Attendance.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function debugAttendanceRecord() {
  console.log('🔍 Debugging Attendance Record');
  console.log('==============================');

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
      console.log('❌ No attendance record found');
      return;
    }

    console.log('📋 Attendance record found:');
    console.log('   ID:', attendance._id);
    console.log('   Employee ID:', attendance.employeeId);
    console.log('   Project ID:', attendance.projectId);
    console.log('   Date:', attendance.date);
    console.log('   Check-in:', attendance.checkIn);
    console.log('   Check-out:', attendance.checkOut);
    console.log('   Lunch start:', attendance.lunchStartTime);
    console.log('   Lunch end:', attendance.lunchEndTime);

    // Try to update the lunch start time manually
    console.log('\n🧪 Testing manual lunch start update...');
    
    attendance.lunchStartTime = new Date();
    await attendance.save();
    
    console.log('✅ Manual update successful');
    console.log('   New lunch start time:', attendance.lunchStartTime);

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugAttendanceRecord();