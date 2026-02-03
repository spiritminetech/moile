// Debug attendance record structure to understand the data format
import mongoose from 'mongoose';
import Attendance from './src/modules/attendance/Attendance.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function debugAttendanceRecordStructure() {
  console.log('🔍 Debugging Attendance Record Structure');
  console.log('=======================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the latest attendance record for Employee 107
    const latestRecord = await Attendance.findOne({
      employeeId: 107
    }).sort({ createdAt: -1 });

    if (latestRecord) {
      console.log('\n1️⃣ Latest Attendance Record (Raw):');
      console.log('   Full Record:', JSON.stringify(latestRecord, null, 2));

      console.log('\n2️⃣ Field Analysis:');
      console.log('   _id:', latestRecord._id);
      console.log('   employeeId:', latestRecord.employeeId);
      console.log('   projectId:', latestRecord.projectId);
      console.log('   date:', latestRecord.date);
      console.log('   loginTime:', latestRecord.loginTime, '(type:', typeof latestRecord.loginTime, ')');
      console.log('   logoutTime:', latestRecord.logoutTime, '(type:', typeof latestRecord.logoutTime, ')');
      console.log('   lunchStartTime:', latestRecord.lunchStartTime, '(type:', typeof latestRecord.lunchStartTime, ')');
      console.log('   lunchEndTime:', latestRecord.lunchEndTime, '(type:', typeof latestRecord.lunchEndTime, ')');
      console.log('   sessionType:', latestRecord.sessionType, '(type:', typeof latestRecord.sessionType, ')');
      console.log('   latitude:', latestRecord.latitude, '(type:', typeof latestRecord.latitude, ')');
      console.log('   longitude:', latestRecord.longitude, '(type:', typeof latestRecord.longitude, ')');
      console.log('   createdAt:', latestRecord.createdAt);
      console.log('   updatedAt:', latestRecord.updatedAt);

      // Check for alternative field names
      console.log('\n3️⃣ Alternative Field Names Check:');
      const allFields = Object.keys(latestRecord.toObject());
      console.log('   All fields in record:', allFields);

      // Look for fields that might contain time data
      const timeFields = allFields.filter(field => 
        field.toLowerCase().includes('time') || 
        field.toLowerCase().includes('in') || 
        field.toLowerCase().includes('out') ||
        field.toLowerCase().includes('check')
      );
      console.log('   Time-related fields:', timeFields);

      // Check if there are any fields with actual time values
      console.log('\n4️⃣ Fields with Date/Time Values:');
      for (const field of allFields) {
        const value = latestRecord[field];
        if (value instanceof Date || (typeof value === 'string' && value.includes('T'))) {
          console.log(`   ${field}:`, value);
        }
      }

    } else {
      console.log('❌ No attendance records found for Employee 107');
    }

    // Check a few more recent records to see the pattern
    console.log('\n5️⃣ Recent Records Analysis:');
    const recentRecords = await Attendance.find({
      employeeId: 107
    }).sort({ createdAt: -1 }).limit(3);

    for (let i = 0; i < recentRecords.length; i++) {
      const record = recentRecords[i];
      console.log(`\n   Record ${i + 1}:`);
      console.log(`     Date: ${record.date}`);
      console.log(`     LoginTime: ${record.loginTime} (${typeof record.loginTime})`);
      console.log(`     LogoutTime: ${record.logoutTime} (${typeof record.logoutTime})`);
      console.log(`     CreatedAt: ${record.createdAt}`);
      console.log(`     UpdatedAt: ${record.updatedAt}`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugAttendanceRecordStructure();