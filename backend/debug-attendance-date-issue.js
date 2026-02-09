import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const AttendanceSchema = new mongoose.Schema({}, { strict: false, collection: 'attendance' });
const Attendance = mongoose.model('AttendanceDebug', AttendanceSchema);

async function debugAttendanceDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const todayString = new Date().toISOString().split('T')[0];
    console.log(`📅 Today's date string: ${todayString}\n`);

    // Check all attendance records
    const allAttendance = await Attendance.find({}).lean();
    console.log(`📊 Total attendance records: ${allAttendance.length}\n`);

    // Check today's attendance
    const todayAttendance = allAttendance.filter(a => {
      const recordDate = new Date(a.date).toISOString().split('T')[0];
      return recordDate === todayString;
    });

    console.log(`📅 Attendance records for today (${todayString}): ${todayAttendance.length}\n`);

    if (todayAttendance.length > 0) {
      console.log('Sample records:');
      todayAttendance.forEach(att => {
        console.log(`  - Employee ${att.employeeId}, Project ${att.projectId}`);
        console.log(`    Date stored: ${att.date}`);
        console.log(`    Date type: ${typeof att.date}`);
        console.log(`    Check-in: ${att.checkIn || 'N/A'}`);
        console.log('');
      });
    }

    // Test the API query
    console.log('\n🔍 Testing API Query Logic:\n');
    const workDate = todayString;
    const startOfDay = new Date(workDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(workDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    console.log(`Query range:`);
    console.log(`  Start: ${startOfDay.toISOString()}`);
    console.log(`  End: ${endOfDay.toISOString()}\n`);

    const queryResult = await Attendance.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).lean();

    console.log(`✅ Query found ${queryResult.length} records\n`);

    if (queryResult.length > 0) {
      console.log('Records found by query:');
      queryResult.forEach(att => {
        console.log(`  - Employee ${att.employeeId}, Project ${att.projectId}`);
      });
    } else {
      console.log('❌ No records found by query!');
      console.log('\nLet\'s check what dates are actually stored:\n');
      
      const recentAttendance = await Attendance.find({}).sort({ date: -1 }).limit(5).lean();
      recentAttendance.forEach(att => {
        console.log(`  - Date: ${att.date} (${new Date(att.date).toISOString()})`);
        console.log(`    Employee: ${att.employeeId}, Project: ${att.projectId}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

debugAttendanceDates();
