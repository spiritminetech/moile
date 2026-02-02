import mongoose from 'mongoose';
import Attendance from './src/modules/attendance/Attendance.js';
import appConfig from './src/config/app.config.js';

async function clearTodayAttendance() {
  try {
    // Connect to MongoDB
    await mongoose.connect(appConfig.database.uri, { 
      dbName: appConfig.database.name,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Clearing attendance records for today: ${today}`);

    // Find today's attendance records for employee ID 2 (worker@gmail.com)
    const todayRecords = await Attendance.find({
      employeeId: 2,
      date: { $gte: new Date(today), $lt: new Date(today + 'T23:59:59.999Z') }
    });

    console.log(`\n📋 Found ${todayRecords.length} attendance records for today:`);
    todayRecords.forEach((record, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(`  Employee ID: ${record.employeeId}`);
      console.log(`  Project ID: ${record.projectId}`);
      console.log(`  Date: ${record.date}`);
      console.log(`  Check-in: ${record.checkIn}`);
      console.log(`  Check-out: ${record.checkOut}`);
      console.log(`  Status: ${record.checkOut ? 'CHECKED_OUT' : (record.checkIn ? 'CHECKED_IN' : 'NOT_LOGGED_IN')}`);
    });

    if (todayRecords.length > 0) {
      // Delete today's attendance records
      const deleteResult = await Attendance.deleteMany({
        employeeId: 2,
        date: { $gte: new Date(today), $lt: new Date(today + 'T23:59:59.999Z') }
      });

      console.log(`\n🗑️ Deleted ${deleteResult.deletedCount} attendance records`);
      console.log('✅ Today\'s attendance cleared successfully!');
      console.log('📱 Worker can now check in fresh for today');
    } else {
      console.log('\n📝 No attendance records found for today');
    }

  } catch (error) {
    console.error('❌ Error clearing attendance:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

clearTodayAttendance();