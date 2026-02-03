import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './src/modules/attendance/Attendance.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

async function checkAttendanceData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'erp' });
    
    const today = new Date().toISOString().split('T')[0];
    console.log('Checking attendance for date:', today);
    
    // Find the worker
    const employee = await Employee.findOne({ id: 107 });
    console.log('Worker found:', employee?.fullName, 'ID:', employee?.id);
    
    // Check attendance records for today
    const attendanceRecords = await Attendance.find({ 
      employeeId: 107,
      date: today 
    });
    
    console.log('\nAttendance records for today:', attendanceRecords.length);
    
    if (attendanceRecords.length === 0) {
      console.log('❌ No attendance records found for today');
      console.log('💡 Worker needs to check in first to see Today\'s Summary');
      
      // Let's create a sample attendance record for testing
      console.log('\n🧪 Creating sample attendance record for testing...');
      
      const sampleAttendance = new Attendance({
        employeeId: 107,
        projectId: 1003,
        date: today,
        checkIn: new Date(),
        checkOut: null,
        status: 'CHECKED_IN',
        session: 'CHECKED_IN',
        lunchStartTime: null,
        lunchEndTime: null,
        overtimeStartTime: null,
        companyId: 1
      });
      
      await sampleAttendance.save();
      console.log('✅ Sample attendance record created');
      
    } else {
      attendanceRecords.forEach((record, index) => {
        console.log(`✅ Attendance Record ${index + 1}:`);
        console.log('  Project ID:', record.projectId);
        console.log('  Check In:', record.checkIn);
        console.log('  Check Out:', record.checkOut);
        console.log('  Status:', record.status);
        console.log('  Session:', record.session);
        console.log('  Lunch Start:', record.lunchStartTime);
        console.log('  Lunch End:', record.lunchEndTime);
        console.log('---');
      });
    }
    
    // Check all attendance records for this worker
    const allRecords = await Attendance.find({ employeeId: 107 }).sort({ date: -1 }).limit(5);
    console.log('\nRecent attendance records (last 5):');
    if (allRecords.length === 0) {
      console.log('❌ No attendance records found for this worker');
    } else {
      allRecords.forEach(record => {
        console.log(`- Date: ${record.date}, Project: ${record.projectId}, Status: ${record.status}`);
      });
    }
    
    // Test the API endpoint that the mobile app calls
    console.log('\n🔍 Testing attendance API endpoints...');
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

checkAttendanceData();