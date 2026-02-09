// Create comprehensive test data for Attendance Monitoring with Pending Corrections
// This script creates attendance records and manual attendance correction requests

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './src/modules/attendance/Attendance.js';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function createAttendanceMonitoringTestData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get supervisor@gmail.com
    const supervisorUser = await User.findOne({ email: 'supervisor@gmail.com' });
    if (!supervisorUser) {
      console.error('❌ Supervisor user not found with email: supervisor@gmail.com');
      console.log('Please create supervisor user first');
      process.exit(1);
    }
    console.log('✅ Found supervisor user:', supervisorUser.email);

    // Get supervisor employee record (any employee linked to this user)
    const supervisor = await Employee.findOne({ userId: supervisorUser.id });
    if (!supervisor) {
      console.error('❌ Supervisor employee record not found');
      console.log('Creating supervisor employee record...');
      
      const maxId = await Employee.findOne().sort({ id: -1 }).select('id');
      const newId = (maxId?.id || 0) + 1;
      
      const newSupervisor = await Employee.create({
        id: newId,
        userId: supervisorUser.id,
        fullName: 'Supervisor User',
        phone: '+1234567890',
        jobTitle: 'Site Supervisor',
        companyId: 1,
        status: 'ACTIVE'
      });
      
      console.log('✅ Created supervisor employee, ID:', newSupervisor.id);
    } else {
      console.log('✅ Found supervisor employee record, ID:', supervisor.id);
    }
    
    // Use the supervisor variable for the rest of the script
    const supervisorEmployee = supervisor || await Employee.findOne({ userId: supervisorUser.id });

    // Get project
    const project = await Project.findOne({ id: 1 });
    if (!project) {
      console.error('❌ Project 1 not found');
      process.exit(1);
    }
    console.log('✅ Found project:', project.projectName || project.name);

    // Get employees assigned to this supervisor's project
    const employees = await Employee.find({ 
      companyId: 1,
      status: 'ACTIVE'
    }).limit(5);

    if (employees.length === 0) {
      console.error('❌ No employees found for project');
      process.exit(1);
    }
    console.log(`✅ Found ${employees.length} employees\n`);

    // Use current local date
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    const today = new Date(todayString + 'T00:00:00');

    console.log('📅 Creating attendance records for TODAY:', todayString);
    console.log('─────────────────────────────────────────\n');

    // Clear existing attendance for today
    await Attendance.deleteMany({
      projectId: project.id,
      date: { $gte: today }
    });
    console.log('🗑️  Cleared existing attendance records\n');

    // Create varied attendance scenarios
    const attendanceScenarios = [
      {
        employee: employees[0],
        scenario: 'On Time - Checked In',
        checkIn: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00 AM
        checkOut: null,
        insideGeofence: true,
        hasCorrection: true,
        correctionType: 'check_in',
        originalTime: new Date(today.getTime() + 8.5 * 60 * 60 * 1000), // 8:30 AM
        requestedTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00 AM
        reason: 'GPS signal was weak, actual arrival was at 8:00 AM'
      },
      {
        employee: employees[1],
        scenario: 'Late - Checked In',
        checkIn: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00 AM (1 hour late)
        checkOut: null,
        insideGeofence: true,
        hasCorrection: true,
        correctionType: 'check_in',
        originalTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00 AM
        requestedTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00 AM
        reason: 'Traffic jam due to accident on highway. Left home on time.'
      },
      {
        employee: employees[2],
        scenario: 'Checked In & Out',
        checkIn: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00 AM
        checkOut: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 5:00 PM
        insideGeofence: true,
        hasCorrection: true,
        correctionType: 'check_out',
        originalTime: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 5:00 PM
        requestedTime: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6:00 PM
        reason: 'Forgot to check out, worked until 6:00 PM'
      },
      {
        employee: employees[3],
        scenario: 'Outside Geofence',
        checkIn: new Date(today.getTime() + 8.25 * 60 * 60 * 1000), // 8:15 AM
        checkOut: null,
        insideGeofence: false,
        hasCorrection: false
      },
      {
        employee: employees[4],
        scenario: 'Absent',
        checkIn: null,
        checkOut: null,
        insideGeofence: false,
        hasCorrection: true,
        correctionType: 'check_in',
        originalTime: null,
        requestedTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00 AM
        reason: 'System error - I was present but check-in failed. Please add manual attendance.'
      }
    ];

    let attendanceId = await Attendance.countDocuments() + 1;
    const createdAttendance = [];

    for (const scenario of attendanceScenarios) {
      const { employee, checkIn, checkOut, insideGeofence, hasCorrection } = scenario;

      // Create task assignment if not exists
      const existingAssignment = await WorkerTaskAssignment.findOne({
        employeeId: employee.id,
        projectId: project.id,
        date: todayString
      });

      if (!existingAssignment) {
        await WorkerTaskAssignment.create({
          id: await WorkerTaskAssignment.countDocuments() + 1,
          employeeId: employee.id,
          projectId: project.id,
          taskId: 1,
          supervisorId: supervisorEmployee.id,
          date: todayString,
          status: 'queued',
          assignedAt: new Date()
        });
      }

      // Create attendance record (skip if absent and no correction)
      if (checkIn || hasCorrection) {
        const attendanceData = {
          id: attendanceId++,
          employeeId: employee.id,
          projectId: project.id,
          date: today,
          checkIn: checkIn,
          checkOut: checkOut,
          insideGeofenceAtCheckin: insideGeofence,
          insideGeofenceAtCheckout: checkOut ? insideGeofence : false,
          lastLatitude: project.latitude || 12.9716,
          lastLongitude: project.longitude || 77.5946,
          pendingCheckout: checkIn && !checkOut,
          manualOverrides: []
        };

        const attendance = await Attendance.create(attendanceData);
        createdAttendance.push(attendance);

        console.log(`✅ Created attendance for ${employee.fullName}`);
        console.log(`   Scenario: ${scenario.scenario}`);
        console.log(`   Check-in: ${checkIn ? checkIn.toLocaleTimeString() : 'N/A'}`);
        console.log(`   Check-out: ${checkOut ? checkOut.toLocaleTimeString() : 'N/A'}`);
        console.log(`   Inside Geofence: ${insideGeofence ? 'Yes' : 'No'}`);
        if (hasCorrection) {
          console.log(`   📝 Has pending correction request`);
        }
        console.log('');
      }
    }

    console.log('\n📋 Creating Manual Attendance Correction Requests');
    console.log('─────────────────────────────────────────\n');

    // Create a separate collection for pending corrections
    // Since there's no dedicated model, we'll add them to a temporary collection
    const CorrectionSchema = new mongoose.Schema({
      correctionId: Number,
      workerId: Number,
      workerName: String,
      requestType: String,
      originalTime: Date,
      requestedTime: Date,
      reason: String,
      requestedAt: Date,
      status: String,
      projectId: Number,
      supervisorId: Number,
      attendanceId: Number
    });

    const AttendanceCorrection = mongoose.models.AttendanceCorrection || 
                                 mongoose.model('AttendanceCorrection', CorrectionSchema);

    // Clear existing corrections
    await AttendanceCorrection.deleteMany({});

    let correctionId = 1;
    const corrections = [];

    for (const scenario of attendanceScenarios) {
      if (scenario.hasCorrection) {
        const correction = {
          correctionId: correctionId++,
          workerId: scenario.employee.id,
          workerName: scenario.employee.fullName,
          requestType: scenario.correctionType,
          originalTime: scenario.originalTime,
          requestedTime: scenario.requestedTime,
          reason: scenario.reason,
          requestedAt: new Date(today.getTime() + 9 * 60 * 60 * 1000), // Requested at 9 AM
          status: 'pending',
          projectId: project.id,
          supervisorId: supervisorEmployee.id,
          attendanceId: createdAttendance.find(a => a.employeeId === scenario.employee.id)?.id || null
        };

        await AttendanceCorrection.create(correction);
        corrections.push(correction);

        console.log(`📝 Created correction request #${correction.correctionId}`);
        console.log(`   Worker: ${correction.workerName}`);
        console.log(`   Type: ${correction.requestType.toUpperCase()}`);
        console.log(`   Original: ${correction.originalTime ? correction.originalTime.toLocaleTimeString() : 'N/A'}`);
        console.log(`   Requested: ${correction.requestedTime.toLocaleTimeString()}`);
        console.log(`   Reason: ${correction.reason}`);
        console.log('');
      }
    }

    console.log('\n✅ TEST DATA CREATION COMPLETE!');
    console.log('═════════════════════════════════════════\n');
    console.log('📊 Summary:');
    console.log(`   • Attendance Records: ${createdAttendance.length}`);
    console.log(`   • Pending Corrections: ${corrections.length}`);
    console.log(`   • Project: ${project.projectName || project.name}`);
    console.log(`   • Supervisor: ${supervisorUser.email}`);
    console.log(`   • Date: ${todayString}\n`);

    console.log('🎯 Next Steps:');
    console.log('   1. Login to mobile app as: supervisor@gmail.com');
    console.log('   2. Navigate to: Team Tab (👥)');
    console.log('   3. Go to: Attendance Monitoring');
    console.log('   4. Look for: Yellow "Pending Corrections" alert card');
    console.log('   5. Click: "Review Corrections" button');
    console.log('   6. Modal will open with the first pending request\n');

    console.log('📱 Expected UI:');
    console.log('   ⚠️  Pending Corrections');
    console.log(`   ${corrections.length} attendance correction(s) awaiting approval`);
    console.log('   [Review Corrections]\n');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
createAttendanceMonitoringTestData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
