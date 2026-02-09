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

async function finalVerification() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = '2026-02-08';
    const projectId = 1;

    console.log('🔍 FINAL VERIFICATION FOR MOBILE APP\n');
    console.log('=' .repeat(60));

    // 1. Check task assignments with correct field name
    const assignments = await WorkerTaskAssignment.find({
      projectId: projectId,
      date: today
    });
    
    console.log(`\n1️⃣ Task Assignments (date field): ${assignments.length}`);
    if (assignments.length > 0) {
      console.log('   ✅ PASS - Task assignments found with correct date field');
    } else {
      console.log('   ❌ FAIL - No task assignments found');
    }

    // 2. Check employees
    const employeeIds = assignments.map(a => a.employeeId);
    const employees = await Employee.find({
      _id: { $in: employeeIds }
    });
    
    console.log(`\n2️⃣ Employees linked to assignments: ${employees.length}`);
    if (employees.length === assignments.length) {
      console.log('   ✅ PASS - All assignments have valid employees');
    } else {
      console.log(`   ⚠️  WARNING - ${assignments.length - employees.length} assignments missing employees`);
    }

    // 3. Check attendance records
    const attendanceRecords = await Attendance.find({
      projectId: projectId,
      date: today
    });
    
    console.log(`\n3️⃣ Attendance Records: ${attendanceRecords.length}`);
    if (attendanceRecords.length > 0) {
      console.log('   ✅ PASS - Attendance records found');
      
      // Count by status
      const statusCounts = attendanceRecords.reduce((acc, att) => {
        acc[att.status] = (acc[att.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n   Status Breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`     - ${status}: ${count}`);
      });
      
      // Count features
      const withLunch = attendanceRecords.filter(a => a.lunchStartTime && a.lunchEndTime).length;
      const withOT = attendanceRecords.filter(a => a.otHours > 0).length;
      const late = attendanceRecords.filter(a => a.isLate).length;
      
      console.log('\n   Feature Breakdown:');
      console.log(`     - With Lunch Break: ${withLunch}`);
      console.log(`     - With OT Hours: ${withOT}`);
      console.log(`     - Late Arrivals: ${late}`);
    } else {
      console.log('   ❌ FAIL - No attendance records found');
    }

    // 4. Simulate API query (what the mobile app will receive)
    console.log('\n4️⃣ Simulating Mobile App API Call...');
    console.log('   Query: GET /api/supervisor/attendance-monitoring?projectId=1&date=2026-02-08');
    
    const apiSimulation = await WorkerTaskAssignment.aggregate([
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
        $lookup: {
          from: 'attendances',
          let: { empId: '$employeeId', projId: '$projectId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$employeeId', '$$empId'] },
                    { $eq: ['$projectId', '$$projId'] },
                    { $eq: ['$date', today] }
                  ]
                }
              }
            }
          ],
          as: 'attendance'
        }
      },
      {
        $unwind: {
          path: '$attendance',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          employeeId: 1,
          workerName: '$employee.name',
          status: '$attendance.status',
          regularHours: '$attendance.regularHours',
          otHours: '$attendance.otHours',
          hasAttendance: { $cond: [{ $ifNull: ['$attendance', false] }, true, false] }
        }
      }
    ]);

    console.log(`\n   ✅ API would return: ${apiSimulation.length} workers`);
    
    if (apiSimulation.length > 0) {
      console.log('\n   Sample Workers:');
      apiSimulation.slice(0, 3).forEach((worker, idx) => {
        console.log(`     ${idx + 1}. ${worker.workerName || 'No Name'} - ${worker.status || 'No Status'} (${worker.regularHours || 0}h regular, ${worker.otHours || 0}h OT)`);
      });
    }

    // 5. Final verdict
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 FINAL VERDICT:\n');
    
    const allChecks = [
      assignments.length >= 10,
      employees.length >= 10,
      attendanceRecords.length >= 10,
      apiSimulation.length >= 10
    ];
    
    if (allChecks.every(check => check)) {
      console.log('✅ ALL SYSTEMS GO!');
      console.log('✅ Mobile app should now display 10 workers with attendance data');
      console.log('\n📱 Next Steps:');
      console.log('   1. Open mobile app');
      console.log('   2. Login as supervisor@gmail.com');
      console.log('   3. Go to Attendance Monitoring');
      console.log('   4. Wait for auto-load (project 1 will be selected automatically)');
      console.log('   5. Verify all 10 workers appear with their attendance details');
    } else {
      console.log('❌ ISSUES DETECTED - Some checks failed');
      console.log('\nFailed Checks:');
      if (assignments.length < 10) console.log('   - Task assignments');
      if (employees.length < 10) console.log('   - Employees');
      if (attendanceRecords.length < 10) console.log('   - Attendance records');
      if (apiSimulation.length < 10) console.log('   - API simulation');
    }

    await mongoose.disconnect();
    console.log('\n👋 Done\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

finalVerification();
