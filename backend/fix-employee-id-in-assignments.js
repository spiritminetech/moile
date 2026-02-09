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

const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' });
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

const AttendanceSchema = new mongoose.Schema({}, { strict: false, collection: 'attendances' });
const Attendance = mongoose.model('Attendance', AttendanceSchema);

async function fixEmployeeIds() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = '2026-02-08';
    const projectId = 1;

    // Get all employees for project 1
    const employees = await Employee.find({ projectId: 1 });
    console.log(`📋 Found ${employees.length} employees for project 1\n`);

    // Create a map of _id to id (string representation)
    const idMap = {};
    employees.forEach(emp => {
      idMap[emp._id.toString()] = emp.id || emp._id.toString();
    });

    console.log('🔧 Fixing task assignments...\n');

    // Get all assignments for today
    const assignments = await WorkerTaskAssignment.find({
      projectId: projectId,
      date: today
    });

    console.log(`Found ${assignments.length} assignments to fix\n`);

    for (const assignment of assignments) {
      const currentEmployeeId = assignment.employeeId.toString();
      const correctId = idMap[currentEmployeeId];
      
      if (correctId) {
        // Update assignment to use the string id instead of ObjectId
        await WorkerTaskAssignment.updateOne(
          { _id: assignment._id },
          { $set: { employeeId: correctId } }
        );
        console.log(`✅ Fixed assignment ${assignment._id}: ${currentEmployeeId} → ${correctId}`);
      }
    }

    console.log('\n🔧 Fixing attendance records...\n');

    // Fix attendance records too
    const attendanceRecords = await Attendance.find({
      projectId: projectId,
      date: today
    });

    console.log(`Found ${attendanceRecords.length} attendance records to fix\n`);

    for (const attendance of attendanceRecords) {
      const currentEmployeeId = attendance.employeeId.toString();
      const correctId = idMap[currentEmployeeId];
      
      if (correctId) {
        await Attendance.updateOne(
          { _id: attendance._id },
          { $set: { employeeId: correctId } }
        );
        console.log(`✅ Fixed attendance ${attendance._id}: ${currentEmployeeId} → ${correctId}`);
      }
    }

    console.log('\n📊 Verification...\n');

    // Verify the fix
    const verifyAssignments = await WorkerTaskAssignment.find({
      projectId: projectId,
      date: today
    }).limit(3);

    console.log('Sample assignments after fix:');
    verifyAssignments.forEach((a, idx) => {
      console.log(`  ${idx + 1}. employeeId: ${a.employeeId} (type: ${typeof a.employeeId})`);
    });

    // Test the API query
    console.log('\n🔍 Testing API query logic...\n');
    
    const testAssignments = await WorkerTaskAssignment.find({
      projectId: projectId,
      date: today
    });
    
    const employeeIds = [...new Set(testAssignments.map(a => a.employeeId))];
    console.log(`Employee IDs from assignments: ${employeeIds.length}`);
    
    const testEmployees = await Employee.find({ id: { $in: employeeIds } });
    console.log(`Employees found with those IDs: ${testEmployees.length}`);
    
    if (testEmployees.length === employeeIds.length) {
      console.log('\n✅ SUCCESS! API query will now work correctly');
    } else {
      console.log('\n⚠️  Still have issues - some employees not found');
    }

    await mongoose.disconnect();
    console.log('\n👋 Done\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

fixEmployeeIds();
