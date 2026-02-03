// Fix attendance data corruption - checkOut time is before checkIn time
// This script will fix the corrupted attendance record

import mongoose from 'mongoose';
import Attendance from './src/modules/attendance/Attendance.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function fixAttendanceDataCorruption() {
  try {
    console.log('🔧 Fixing Attendance Data Corruption');
    console.log('='.repeat(50));
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find the corrupted attendance record for employee 107
    const corruptedRecord = await Attendance.findOne({
      employeeId: 107,
      projectId: 1,
      date: '2026-02-02'
    });
    
    if (!corruptedRecord) {
      console.log('❌ No attendance record found for employee 107');
      return;
    }
    
    console.log('🔍 Found corrupted attendance record:');
    console.log('  Employee ID:', corruptedRecord.employeeId);
    console.log('  Project ID:', corruptedRecord.projectId);
    console.log('  Date:', corruptedRecord.date);
    console.log('  Check In:', corruptedRecord.checkIn);
    console.log('  Check Out:', corruptedRecord.checkOut);
    
    // Check if checkOut is before checkIn
    if (corruptedRecord.checkOut && corruptedRecord.checkIn && 
        corruptedRecord.checkOut < corruptedRecord.checkIn) {
      console.log('⚠️ CORRUPTION DETECTED: checkOut time is before checkIn time!');
      
      // Fix the corruption by removing the invalid checkOut
      console.log('🔧 Fixing corruption by removing invalid checkOut...');
      
      corruptedRecord.checkOut = null;
      corruptedRecord.pendingCheckout = true;
      corruptedRecord.insideGeofenceAtCheckout = null;
      
      await corruptedRecord.save();
      
      console.log('✅ Fixed corrupted attendance record:');
      console.log('  Check In:', corruptedRecord.checkIn);
      console.log('  Check Out:', corruptedRecord.checkOut);
      console.log('  Pending Checkout:', corruptedRecord.pendingCheckout);
      
      console.log('✅ Worker is now properly CHECKED IN');
    } else {
      console.log('✅ No corruption detected in attendance record');
    }
    
  } catch (error) {
    console.error('❌ Error fixing attendance data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixAttendanceDataCorruption();