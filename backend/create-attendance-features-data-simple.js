import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function createAttendanceData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Attendance = mongoose.model('Attendance', new mongoose.Schema({}, { strict: false, collection: 'attendances' }));
    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));

    // Get existing employees
    const employees = await Employee.find({ supervisorId: 4 }).limit(10);
    console.log(`\n📊 Found ${employees.length} employees`);

    if (employees.length === 0) {
      console.log('❌ No employees found for supervisor 4');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Clear existing
    await Attendance.deleteMany({ date: today });
    console.log('🗑️  Cleared existing attendance\n');

    const scenarios = [
      {
        emp: employees[0],
        clockIn: new Date(today.getTime() + 8 * 60 * 60 * 1000),
        lunchStart: new Date(today.getTime() + 12 * 60 * 60 * 1000),
        lunchEnd: new Date(today.getTime() + 13 * 60 * 60 * 1000),
        clockOut: new Date(today.getTime() + 18 * 60 * 60 * 1000),
        status: 'present',
        regularHours: 9,
        otHours: 0,
        lunchDuration: 60
      },
