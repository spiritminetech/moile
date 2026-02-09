// Check attendance record dates
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './src/modules/attendance/Attendance.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkAttendanceDates() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const attendances = await Attendance.find({}).sort({ date: -1 }).limit(10);
    
    console.log(`Found ${attendances.length} attendance records:\n`);
    
    attendances.forEach((att, index) => {
      console.log(`${index + 1}. Employee ID: ${att.employeeId}`);
      console.log(`   Date field: ${att.date}`);
      console.log(`   Date type: ${typeof att.date}`);
      console.log(`   Date ISO: ${att.date.toISOString()}`);
      console.log(`   Check-in: ${att.checkIn}`);
      console.log(`   Project ID: ${att.projectId}`);
      console.log('');
    });

    // Test the query that the API uses
    const workDate = '2026-02-07';
    console.log(`\nTesting API query for date: ${workDate}`);
    console.log(`Query: date >= ${new Date(workDate)} AND date < ${new Date(new Date(workDate).setDate(new Date(workDate).getDate() + 1))}`);
    
    const testResults = await Attendance.find({
      date: {
        $gte: new Date(workDate),
        $lt: new Date(new Date(workDate).setDate(new Date(workDate).getDate() + 1))
      }
    });
    
    console.log(`\nFound ${testResults.length} records with API query`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkAttendanceDates();
