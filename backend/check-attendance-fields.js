import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkAttendanceFields() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const attendanceCollection = db.collection('attendances');

    // Get the attendance record we created
    const attendance = await attendanceCollection.findOne({
      employeeId: 2,
      id: 1769696435731
    });

    if (attendance) {
      console.log('📋 Attendance Record Fields:');
      console.log('=' .repeat(70));
      console.log(JSON.stringify(attendance, null, 2));
      console.log('=' .repeat(70));
      
      console.log('\n🔍 Field Analysis:');
      console.log(`  - Has "checkIn" field: ${attendance.checkIn !== undefined}`);
      console.log(`  - Has "checkInTime" field: ${attendance.checkInTime !== undefined}`);
      console.log(`  - Has "date" field: ${attendance.date !== undefined}`);
      console.log(`  - Date type: ${typeof attendance.date}`);
      console.log(`  - Date value: ${attendance.date}`);
    } else {
      console.log('❌ Attendance record not found');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

checkAttendanceFields();
