// Fix corrupted attendance record - checkout before checkin

import mongoose from 'mongoose';
import Attendance from './src/modules/attendance/Attendance.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function fixCorruptedAttendance() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔧 Fixing corrupted attendance records...');
    
    // Find today's attendance for employee 107
    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({
      employeeId: 107,
      date: today
    });
    
    if (attendance) {
      console.log('📍 Found attendance record:');
      console.log('  Check In:', attendance.checkIn);
      console.log('  Check Out:', attendance.checkOut);
      console.log('  Project ID:', attendance.projectId);
      
      // Check if checkout is before checkin
      if (attendance.checkOut && attendance.checkIn && 
          attendance.checkOut < attendance.checkIn) {
        console.log('⚠️ CORRUPTION: Checkout is before checkin!');
        
        // Delete the corrupted record completely
        await Attendance.deleteOne({ _id: attendance._id });
        console.log('🗑️ Deleted corrupted attendance record');
        console.log('✅ Worker attendance reset - can start fresh');
      } else {
        console.log('✅ No corruption detected');
      }
    } else {
      console.log('📍 No attendance record found for today');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixCorruptedAttendance();