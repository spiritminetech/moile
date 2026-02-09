import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const Employee = mongoose.model('Employee', EmployeeSchema);

const ProjectSchema = new mongoose.Schema({}, { strict: false, collection: 'projects' });
const Project = mongoose.model('Project', ProjectSchema);

const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', UserSchema);

const AttendanceSchema = new mongoose.Schema({}, { strict: false, collection: 'attendances' });
const Attendance = mongoose.model('Attendance', AttendanceSchema);

const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' });
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

async function checkAndFix() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check project 1
    const project1 = await Project.findOne({ projectId: 1 });
    console.log('📁 Project 1:', project1 ? {
      id: project1.projectId,
      name: project1.name,
      location: project1.location
    } : 'NOT FOUND');

    // Check all employees
    const allEmployees = await Employee.find({}).limit(20);
    console.log(`\n👷 Total Employees: ${allEmployees.length}`);
    
    // Group by project
    const byProject = {};
    allEmployees.forEach(emp => {
      const pid = emp.projectId || 'none';
      if (!byProject[pid]) byProject[pid] = [];
      byProject[pid].push(emp);
    });

    console.log('\n📊 Employees by Project:');
    Object.keys(byProject).forEach(pid => {
      console.log(`  Project ${pid}: ${byProject[pid].length} employees`);
      if (byProject[pid].length <= 5) {
        byProject[pid].forEach(emp => {
          console.log(`    - ${emp.name} (ID: ${emp._id})`);
        });
      }
    });

    // Check supervisor
    const supervisor = await User.findOne({ email: 'supervisor@gmail.com' });
    console.log('\n👤 Supervisor:', supervisor ? {
      id: supervisor._id,
      email: supervisor.email,
      role: supervisor.role
    } : 'NOT FOUND');

    // Find employees that need to be linked to project 1
    const employeesWithoutProject = await Employee.find({ 
      $or: [
        { projectId: { $exists: false } },
        { projectId: null },
        { projectId: { $ne: 1 } }
      ]
    }).limit(10);

    console.log(`\n🔧 Found ${employeesWithoutProject.length} employees that can be assigned to project 1`);

    if (employeesWithoutProject.length >= 10) {
      console.log('\n✅ Assigning first 10 employees to project 1...');
      
      const employeesToAssign = employeesWithoutProject.slice(0, 10);
      
      for (const emp of employeesToAssign) {
        await Employee.updateOne(
          { _id: emp._id },
          { $set: { projectId: 1 } }
        );
        console.log(`  ✅ Assigned ${emp.name} to project 1`);
      }

      console.log('\n✅ Successfully assigned 10 employees to project 1!');
      
      // Now create attendance data
      console.log('\n📅 Creating attendance data for 2026-02-08...');
      
      const today = '2026-02-08';
      
      // Delete old data
      await Attendance.deleteMany({ date: today, projectId: 1 });
      await WorkerTaskAssignment.deleteMany({ assignedDate: today, projectId: 1 });

      const scenarios = [
        { name: 'Perfect Attendance', checkIn: '08:00', checkOut: '17:00', lunchStart: '12:00', lunchEnd: '13:00', regularHours: 9, otHours: 0, status: 'CHECKED_OUT' },
        { name: 'Overtime Worker', checkIn: '08:00', checkOut: '20:30', lunchStart: '12:00', lunchEnd: '12:30', regularHours: 9, otHours: 3.5, status: 'CHECKED_OUT' },
        { name: 'Late Arrival', checkIn: '10:00', checkOut: '17:00', lunchStart: '12:00', lunchEnd: '13:00', regularHours: 7, otHours: 0, status: 'CHECKED_OUT', isLate: true, minutesLate: 120 },
        { name: 'Sick Leave', status: 'ABSENT', absenceReason: 'MEDICAL', absenceNotes: 'Sick leave - doctor appointment' },
        { name: 'Emergency', status: 'ABSENT', absenceReason: 'LEAVE_APPROVED', absenceNotes: 'Family emergency - escalated' },
        { name: 'Extended Lunch', checkIn: '08:00', checkOut: '17:00', lunchStart: '12:00', lunchEnd: '14:00', regularHours: 8, otHours: 0, status: 'CHECKED_OUT' },
        { name: 'Half Day', checkIn: '08:00', checkOut: '13:00', lunchStart: null, lunchEnd: null, regularHours: 5, otHours: 0, status: 'CHECKED_OUT' },
        { name: 'Short Shift', checkIn: '08:00', checkOut: '12:00', lunchStart: null, lunchEnd: null, regularHours: 4, otHours: 0, status: 'CHECKED_OUT' },
        { name: 'Maximum OT', checkIn: '08:00', checkOut: '23:30', lunchStart: '12:00', lunchEnd: '13:00', regularHours: 9, otHours: 6.5, status: 'CHECKED_OUT' },
        { name: 'Unauthorized', status: 'ABSENT', absenceReason: 'UNAUTHORIZED', absenceNotes: 'Did not inform - needs escalation' }
      ];

      for (let i = 0; i < 10; i++) {
        const employee = employeesToAssign[i];
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

      console.log('\n✅ Successfully created 10 attendance records!');
      
      // Final verification
      const finalCount = await Attendance.countDocuments({ date: today, projectId: 1 });
      console.log(`\n📊 Final count: ${finalCount} attendance records for 2026-02-08, Project 1`);
    } else {
      console.log('\n❌ Not enough employees available to assign to project 1');
    }

    await mongoose.disconnect();
    console.log('\n👋 Done');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

checkAndFix();
