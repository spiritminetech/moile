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

const AttendanceSchema = new mongoose.Schema({}, { strict: false, collection: 'attendances' });
const Attendance = mongoose.model('Attendance', AttendanceSchema);

const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' });
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

async function testAPI() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = '2026-02-08';
    const projectId = 1;

    // Get employees for project 1
    const employees = await Employee.find({ projectId: 1 });
    console.log(`📋 Employees for Project 1: ${employees.length}`);
    
    if (employees.length > 0) {
      console.log('\nEmployee Details:');
      employees.forEach((emp, idx) => {
        console.log(`  ${idx + 1}. ${emp.name || 'No Name'} (ID: ${emp._id}, Project: ${emp.projectId})`);
      });
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find({ 
      date: today,
      projectId: projectId
    });
    
    console.log(`\n📅 Attendance Records for ${today}: ${attendanceRecords.length}`);
    
    if (attendanceRecords.length > 0) {
      console.log('\nAttendance Details:');
      for (const att of attendanceRecords) {
        const employee = await Employee.findById(att.employeeId);
        console.log(`  - ${employee?.name || 'Unknown'}: ${att.status}, Regular: ${att.regularHours}h, OT: ${att.otHours}h`);
      }
    }

    // Get task assignments
    const taskAssignments = await WorkerTaskAssignment.find({
      projectId: projectId,
      assignedDate: today
    });
    
    console.log(`\n📋 Task Assignments for ${today}: ${taskAssignments.length}`);

    // Simulate API query
    console.log('\n🔍 Simulating API Query...');
    console.log('Query: { projectId: 1, date: "2026-02-08" }');
    
    const apiResult = await Attendance.aggregate([
      {
        $match: {
          projectId: projectId,
          date: today
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: {
          path: '$employee',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          employeeId: 1,
          workerName: '$employee.name',
          status: 1,
          regularHours: 1,
          otHours: 1,
          workingHours: 1,
          absenceReason: 1
        }
      }
    ]);

    console.log(`\n✅ API Result: ${apiResult.length} workers found`);
    apiResult.forEach((worker, idx) => {
      console.log(`  ${idx + 1}. ${worker.workerName || 'No Name'} - ${worker.status}`);
    });

    await mongoose.disconnect();
    console.log('\n👋 Done');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

testAPI();
