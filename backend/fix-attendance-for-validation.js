import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixAttendanceRecord() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const attendanceCollection = db.collection('attendances');

    // Get the current attendance record
    const currentAttendance = await attendanceCollection.findOne({
      employeeId: 2,
      id: 1769696435731
    });

    if (!currentAttendance) {
      console.log('❌ Attendance record not found');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 Current Attendance Record:');
    console.log(`   ID: ${currentAttendance.id}`);
    console.log(`   Date: ${currentAttendance.date} (${typeof currentAttendance.date})`);
    console.log(`   checkInTime: ${currentAttendance.checkInTime}`);
    console.log(`   checkIn field: ${currentAttendance.checkIn || 'NOT SET'}`);

    // Fix the record to match API expectations
    const checkInTimeValue = new Date(currentAttendance.checkInTime);
    const dateValue = new Date('2026-02-15T00:00:00.000Z');

    const updateResult = await attendanceCollection.updateOne(
      { id: 1769696435731 },
      {
        $set: {
          checkIn: checkInTimeValue,  // Add checkIn field (Date object)
          date: dateValue,             // Convert date to Date object
          updatedAt: new Date()
        }
      }
    );

    console.log('\n✅ Update Result:');
    console.log(`   Matched: ${updateResult.matchedCount}`);
    console.log(`   Modified: ${updateResult.modifiedCount}`);

    // Verify the fix
    const updatedAttendance = await attendanceCollection.findOne({
      employeeId: 2,
      id: 1769696435731
    });

    console.log('\n📋 Updated Attendance Record:');
    console.log(`   ID: ${updatedAttendance.id}`);
    console.log(`   Date: ${updatedAttendance.date} (${typeof updatedAttendance.date})`);
    console.log(`   checkIn: ${updatedAttendance.checkIn}`);
    console.log(`   checkInTime: ${updatedAttendance.checkInTime}`);

    // Test the validation query
    console.log('\n🔍 Testing validation query:');
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const validationResult = await attendanceCollection.findOne({
      employeeId: 2,
      checkIn: { $exists: true, $ne: null },
      date: { $gte: startOfToday, $lt: startOfTomorrow }
    });

    if (validationResult) {
      console.log('✅ SUCCESS! Validation query now finds the attendance record');
      console.log('   You can now start tasks without the "must check in" error');
    } else {
      console.log('❌ Validation query still not working');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
    console.log('\n⚠️  RESTART BACKEND SERVER to apply changes');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

fixAttendanceRecord();
