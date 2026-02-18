import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkAttendanceDirect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the attendance collection directly
    const db = mongoose.connection.db;
    const attendanceCollection = db.collection('attendances');

    // Check all attendance records for employee 2
    const allAttendance = await attendanceCollection.find({ employeeId: 2 })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    console.log(`📊 Found ${allAttendance.length} attendance records for Employee 2:\n`);

    allAttendance.forEach((record, index) => {
      console.log(`${index + 1}. Attendance ID: ${record.id}`);
      console.log(`   Date: ${record.date}`);
      console.log(`   Status: ${record.status}`);
      console.log(`   Check-in Time: ${record.checkInTime}`);
      console.log(`   Project ID: ${record.projectId}`);
      console.log(`   Created: ${record.createdAt}`);
      console.log('');
    });

    // Check specifically for today's date
    console.log('=' .repeat(70));
    console.log('🔍 Checking for 2026-02-15:\n');

    const todayAttendance = await attendanceCollection.find({
      employeeId: 2,
      date: { $gte: new Date('2026-02-15T00:00:00.000Z'), $lte: new Date('2026-02-15T23:59:59.999Z') }
    }).toArray();

    console.log(`Found ${todayAttendance.length} records with Date object query`);

    // Try with string date
    const todayAttendanceString = await attendanceCollection.find({
      employeeId: 2,
      date: '2026-02-15'
    }).toArray();

    console.log(`Found ${todayAttendanceString.length} records with string date query`);

    if (todayAttendanceString.length > 0) {
      console.log('\n✅ Today\'s attendance record:');
      const record = todayAttendanceString[0];
      console.log(`   ID: ${record.id}`);
      console.log(`   Status: ${record.status}`);
      console.log(`   Check-in: ${new Date(record.checkInTime).toLocaleString()}`);
      console.log(`   Date field type: ${typeof record.date}`);
      console.log(`   Date value: ${record.date}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

checkAttendanceDirect();
