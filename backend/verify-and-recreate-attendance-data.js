import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Import models
const AttendanceSchema = new mongoose.Schema({}, { strict: false, collection: 'attendances' });
const Attendance = mongoose.model('Attendance', AttendanceSchema);

const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' });
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const Employee = mongoose.model('Employee', EmployeeSchema);

const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', UserSchema);

async function verifyAndRecreate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const today = '2026-02-08';
    
    // Check supervisor
    const supervisor = await User.findOne({ email: 'supervisor@gmail.com' });
    console.log('\n📋 Supervisor:', supervisor ? {
      id: supervisor._id,
      email: supervisor.email,
      role: supervisor.role
    } : 'NOT FOUND');

    // Check employees for project 1
    const employees = await Employee.find({ projectId: 1 }).limit(5);
    console.log('\n👷 Employees for Project 1:', employees.length);
    employees.forEach(emp => {
      console.log(`  - ID: ${emp._id}, Name: ${emp.name}, Project: ${emp.projectId}`);
    });

    // Check existing attendance for today
    const existingAttendance = await Attendance.find({ 
      date: today,
      projectId: 1
    });
    console.log('\n📅 Existing Attendance Records for 2026-02-08:', existingAttendance.length);

    // Check task assignments
    const taskAssignments = await WorkerTaskAssignment.find({
      projectId: 1,
      assignedDate: today
    });
    console.log('\n📋 Task Assignments for today:', taskAssignments.length);

    if (existingAttendance.length === 0) {
      console.log('\n⚠️ No attendance data found. Creating fresh data...');
      
      // Get 10 employees
      const employeesToUse = await Employee.find({ projectId: 1 }).limit(10);
      
      if (employeesToUse.length < 10) {
        console.log(`❌ Only found ${employeesToUse.length} employees for project 1. Need at least 10.`);
        await mongoose.disconnect();
        return;
      }

      console.log(`\n✅ Found ${employeesToUse.length} employees. Creating attendance records...`);

      // Delete old data for today
      await Attendance.deleteMany({ date: today, projectId: 1 });
      await WorkerTaskAssignment.deleteMany({ assignedDate: today, projectId: 1 });

      const scenarios = [
        { name: 'Perfect Attendance', checkIn: '08:00', checkOut: '17:00', lunchStart: '12:00', lunchEnd: '13:00', regularHours: 9, otHours: 0, status: 'CHECKED_OUT' },
        { name: 'Overtime Worker', checkIn: '08:00', checkOut: '20:30', lunchStart: '12:00', lunchEnd: '12:30', regularHours: 9, otHours: 3.5, status: 'CHECKED_OUT' },
        { name: 'Late Arrival', checkIn: '10:00', checkOut: '17:00', lunchStart: '12:00', lunchEnd: '13:00', regularHours: 7, otHours: 0, status: 'CHECKED_OUT', isLate: true, minutesLate: 120, absenceReason: 'PRESENT' },
        { name: 'Sick Leave', status: 'ABSENT', absenceReason: 'MEDICAL', absenceNotes: 'Sick leave - doctor appointment' },
        { name: 'Emergency', status: 'ABSENT', absenceReason: 'LEAVE_APPROVED', absenceNotes: 'Family emergency - escalated' },
        { name: 'Extended Lunch', checkIn: '08:00', checkOut: '17:00', lunchStart: '12:00', lunchEnd: '14:00', regularHours: 8, otHours: 0, status: 'CHECKED_OUT' },
        { name: 'Half Day', checkIn: '08:00', checkOut: '13:00', lunchStart: null, lunchEnd: null, regularHours: 5, otHours: 0, status: 'CHECKED_OUT' },
        { name: 'Short Shift', checkIn: '08:00', checkOut: '12:00', lunchStart: null, lunchEnd: null, regularHours: 4, otHours: 0, status: 'CHECKED_OUT' },
        { name: 'Maximum OT', checkIn: '08:00', checkOut: '23:30', lunchStart: '12:00', lunchEnd: '13:00', regularHours: 9, otHours: 6.5, status: 'CHECKED_OUT' },
        { name: 'Unauthorized', status: 'ABSENT', absenceReason: 'UNAUTHORIZED', absenceNotes: 'Did not inform - needs escalation' }
      ];

      for (let i = 0; i < 10; i++) {
        const employee = employeesToUse[i];
        const scenario = scenarios[i];

        // Create task assignment
        const taskAssignment = await WorkerTaskAssignment.create({
          employeeId: employee._id,
          projectId: 1,
          taskName: `Task for ${employee.name}`,
          taskDescription: `Daily task assignment for ${scenario.name}`,
          assignedDate: today,
          status: 'assigned',
          priority: 'medium',
          estimatedHours: 8
        });

        // Create attendance record
        const attendanceData = {
          employeeId: employee._id,
          projectId: 1,
          date: today,
          status: scenario.status,
          checkInTime: scenario.checkIn ? `${today}T${scenario.checkIn}:00.000Z` : null,
          checkOutTime: scenario.checkOut ? `${today}T${scenario.checkOut}:00.000Z` : null,
          lunchStartTime: scenario.lunchStart ? `${today}T${scenario.lunchStart}:00.000Z` : null,
          lunchEndTime: scenario.lunchEnd ? `${today}T${scenario.lunchEnd}:00.000Z` : null,
          workingHours: scenario.regularHours || 0,
          regularHours: scenario.regularHours || 0,
          otHours: scenario.otHours || 0,
          isLate: scenario.isLate || false,
          minutesLate: scenario.minutesLate || 0,
          insideGeofence: true,
          insideGeofenceAtCheckout: true,
          taskAssignmentId: taskAssignment._id,
          absenceReason: scenario.absenceReason || 'PRESENT',
          absenceNotes: scenario.absenceNotes || null,
          lastKnownLocation: {
            latitude: 1.3521,
            longitude: 103.8198,
            insideGeofence: true
          }
        };

        await Attendance.create(attendanceData);
        console.log(`  ✅ Created: ${scenario.name} for ${employee.name}`);
      }

      console.log('\n✅ Successfully created 10 attendance records with task assignments!');
    } else {
      console.log('\n✅ Attendance data already exists.');
    }

    // Final verification
    const finalCount = await Attendance.countDocuments({ date: today, projectId: 1 });
    console.log(`\n📊 Final count: ${finalCount} attendance records for 2026-02-08, Project 1`);

    await mongoose.disconnect();
    console.log('\n👋 Done');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

verifyAndRecreate();
