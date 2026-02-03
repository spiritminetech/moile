import mongoose from 'mongoose';
import Attendance from './src/modules/attendance/Attendance.js';
import Employee from './src/modules/employee/Employee.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

// Simulate the exact same logic as the lunch start controller
async function debugLunchStartIssue() {
  console.log('🔍 Debugging Lunch Start Issue');
  console.log('==============================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Simulate the controller logic
    const userId = 64; // From login response
    const companyId = 1;
    const projectId = 1;

    console.log('🔍 Input parameters:');
    console.log('   userId:', userId);
    console.log('   companyId:', companyId);
    console.log('   projectId:', projectId);

    // Step 1: Resolve employee
    const employee = await Employee.findOne({
      userId,
      companyId,
      status: { $in: ["active", "ACTIVE"] }
    });

    if (!employee) {
      console.log('❌ Employee not found');
      return;
    }

    console.log('✅ Employee found:', employee.id, employee.fullName);

    // Step 2: Get today's attendance
    const getTodayString = () => {
      return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    };

    const today = getTodayString();
    console.log('📅 Today string:', today);

    const attendance = await Attendance.findOne({ 
      employeeId: employee.id, 
      projectId, 
      date: today 
    });

    if (!attendance) {
      console.log('❌ No attendance record found');
      console.log('🔍 Checking all attendance records for this employee...');
      
      const allAttendance = await Attendance.find({ employeeId: employee.id });
      console.log(`Found ${allAttendance.length} total attendance records:`);
      allAttendance.forEach(a => {
        console.log(`   Date: ${a.date}, Project: ${a.projectId}, CheckIn: ${!!a.checkIn}`);
      });
      return;
    }

    console.log('✅ Attendance record found');
    console.log('   Check-in:', attendance.checkIn);
    console.log('   Check-out:', attendance.checkOut);
    console.log('   Lunch start:', attendance.lunchStartTime);
    console.log('   Lunch end:', attendance.lunchEndTime);

    // Step 3: Validate conditions
    if (!attendance.checkIn) {
      console.log('❌ Must be clocked in to start lunch break');
      return;
    }

    if (attendance.checkOut) {
      console.log('❌ Cannot start lunch break after clocking out');
      return;
    }

    if (attendance.lunchStartTime) {
      console.log('❌ Lunch break already started');
      console.log('   Lunch start time:', attendance.lunchStartTime);
      return;
    }

    // Step 4: Try to update
    console.log('🧪 Attempting to update lunch start time...');
    attendance.lunchStartTime = new Date();
    await attendance.save();

    console.log('✅ Lunch start time updated successfully!');
    console.log('   New lunch start time:', attendance.lunchStartTime);

    // Step 5: Simulate response
    const response = { 
      message: "Lunch break started",
      lunchStartTime: attendance.lunchStartTime,
      projectId: projectId
    };

    console.log('📤 Response that would be sent:');
    console.log(JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('❌ Error occurred:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugLunchStartIssue();