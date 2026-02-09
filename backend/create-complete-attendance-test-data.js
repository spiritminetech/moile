import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function createCompleteTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
    const Attendance = mongoose.model('Attendance', new mongoose.Schema({}, { strict: false, collection: 'attendances' }));
    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
    const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false, collection: 'tasks' }));

    // Get employees
    const employees = await Employee.find().limit(10);
    console.log(`📊 Found ${employees.length} employees\n`);

    if (employees.length === 0) {
      console.log('❌ No employees found');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    // Clear existing data for today
    await Attendance.deleteMany({ date: today });
    await WorkerTaskAssignment.deleteMany({ date: todayString });
    console.log('🗑️  Cleared existing data for today\n');

    // Get or create a task
    let task = await Task.findOne({ projectId: 1 });
    if (!task) {
      const lastTask = await Task.findOne().sort({ id: -1 });
      const nextTaskId = lastTask ? lastTask.id + 1 : 1;
      
      task = await Task.create({
        id: nextTaskId,
        taskName: 'General Construction Work',
        projectId: 1,
        status: 'active',
        createdAt: new Date()
      });
      console.log('✅ Created task:', task.taskName);
    }

    console.log('📝 Creating task assignments and attendance records...\n');

    const records = [];
    const assignments = [];

    for (let i = 0; i < Math.min(10, employees.length); i++) {
      const emp = employees[i];
      
      // Create task assignment (REQUIRED for API to show worker)
      assignments.push({
        employeeId: emp._id,
        projectId: 1,
        taskId: task.id || 1,
        date: todayString,
        status: 'queued',
        sequence: i + 1,
        createdAt: new Date()
      });

      // Create attendance record with different scenarios
      let attendanceRecord = {
        employeeId: emp._id,
        employeeName: emp.name || `Employee ${i + 1}`,
        projectId: 1,
        projectName: 'Construction Site',
        date: today,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Different scenarios
      switch (i) {
        case 0: // Perfect attendance
          attendanceRecord = {
            ...attendanceRecord,
            status: 'present',
            clockIn: new Date(today.getTime() + 8 * 3600000),
            lunchStart: new Date(today.getTime() + 12 * 3600000),
            lunchEnd: new Date(today.getTime() + 13 * 3600000),
            clockOut: new Date(today.getTime() + 18 * 3600000),
            regularHours: 9,
            otHours: 0,
            totalHours: 9,
            lunchDuration: 60
          };
          break;

        case 1: // Overtime
          attendanceRecord = {
            ...attendanceRecord,
            status: 'present',
            clockIn: new Date(today.getTime() + 7 * 3600000),
            lunchStart: new Date(today.getTime() + 12 * 3600000),
            lunchEnd: new Date(today.getTime() + 12.5 * 3600000),
            clockOut: new Date(today.getTime() + 20 * 3600000),
            regularHours: 9,
            otHours: 3.5,
            totalHours: 12.5,
            lunchDuration: 30
          };
          break;

        case 2: // Late
          attendanceRecord = {
            ...attendanceRecord,
            status: 'late',
            clockIn: new Date(today.getTime() + 10 * 3600000),
            lunchStart: new Date(today.getTime() + 13 * 3600000),
            lunchEnd: new Date(today.getTime() + 14 * 3600000),
            clockOut: new Date(today.getTime() + 18 * 3600000),
            regularHours: 7,
            otHours: 0,
            totalHours: 7,
            lunchDuration: 60,
            absenceReason: 'Traffic delay',
            absenceNote: 'Heavy traffic on highway due to accident'
          };
          break;

        case 3: // Sick leave
          attendanceRecord = {
            ...attendanceRecord,
            status: 'absent',
            regularHours: 0,
            otHours: 0,
            totalHours: 0,
            absenceReason: 'Sick Leave',
            absenceNote: 'Fever and flu symptoms, doctor advised rest',
            escalated: false
          };
          break;

        case 4: // Emergency - escalated
          attendanceRecord = {
            ...attendanceRecord,
            status: 'absent',
            regularHours: 0,
            otHours: 0,
            totalHours: 0,
            absenceReason: 'Emergency',
            absenceNote: 'Family emergency, no prior notice',
            escalated: true,
            escalatedAt: new Date(),
            escalatedBy: 1
          };
          break;

        case 5: // Extended lunch
          attendanceRecord = {
            ...attendanceRecord,
            status: 'present',
            clockIn: new Date(today.getTime() + 8 * 3600000),
            lunchStart: new Date(today.getTime() + 12 * 3600000),
            lunchEnd: new Date(today.getTime() + 14 * 3600000),
            clockOut: new Date(today.getTime() + 18 * 3600000),
            regularHours: 8,
            otHours: 0,
            totalHours: 8,
            lunchDuration: 120,
            absenceNote: 'Extended lunch for personal appointment'
          };
          break;

        case 6: // Half day
          attendanceRecord = {
            ...attendanceRecord,
            status: 'half-day',
            clockIn: new Date(today.getTime() + 8 * 3600000),
            clockOut: new Date(today.getTime() + 13 * 3600000),
            regularHours: 5,
            otHours: 0,
            totalHours: 5,
            absenceReason: 'Half Day Leave',
            absenceNote: 'Personal appointment in afternoon'
          };
          break;

        case 7: // Short shift
          attendanceRecord = {
            ...attendanceRecord,
            status: 'present',
            clockIn: new Date(today.getTime() + 14 * 3600000),
            clockOut: new Date(today.getTime() + 18 * 3600000),
            regularHours: 4,
            otHours: 0,
            totalHours: 4,
            lunchDuration: 0
          };
          break;

        case 8: // Maximum OT
          attendanceRecord = {
            ...attendanceRecord,
            status: 'present',
            clockIn: new Date(today.getTime() + 6 * 3600000),
            lunchStart: new Date(today.getTime() + 12 * 3600000),
            lunchEnd: new Date(today.getTime() + 12.5 * 3600000),
            clockOut: new Date(today.getTime() + 22 * 3600000),
            regularHours: 9,
            otHours: 6.5,
            totalHours: 15.5,
            lunchDuration: 30
          };
          break;

        case 9: // Unauthorized
          attendanceRecord = {
            ...attendanceRecord,
            status: 'absent',
            regularHours: 0,
            otHours: 0,
            totalHours: 0,
            absenceReason: 'Unauthorized',
            absenceNote: 'No call, no show - unable to contact',
            escalated: false
          };
          break;
      }

      records.push(attendanceRecord);
    }

    // Insert task assignments first (CRITICAL!)
    console.log('Creating task assignments one by one...');
    for (const assignment of assignments) {
      try {
        await WorkerTaskAssignment.create(assignment);
      } catch (err) {
        console.log(`  Skipping duplicate assignment for employee ${assignment.employeeId}`);
      }
    }
    const createdAssignments = await WorkerTaskAssignment.find({ date: todayString });
    console.log(`✅ Created/Found ${createdAssignments.length} task assignments\n`);

    // Then insert attendance records
    await Attendance.insertMany(records);
    console.log(`✅ Created ${records.length} attendance records\n`);

    // Display summary
    const scenarios = [
      'Perfect Attendance (9h)',
      'Overtime (3.5h OT)',
      'Late Arrival',
      'Sick Leave',
      'Emergency (Escalated)',
      'Extended Lunch (120 min)',
      'Half Day',
      'Short Shift (no lunch)',
      'Maximum OT (6.5h)',
      'Unauthorized Absence'
    ];

    console.log('📋 TEST DATA SUMMARY:\n');
    records.forEach((r, i) => {
      console.log(`${i + 1}. ${r.employeeName} - ${scenarios[i]}`);
      console.log(`   Status: ${r.status.toUpperCase()}`);
      if (r.lunchDuration) console.log(`   Lunch: ${r.lunchDuration} min`);
      console.log(`   Hours: ${r.regularHours}h regular | ${r.otHours}h OT`);
      if (r.absenceReason) console.log(`   Reason: ${r.absenceReason}`);
      if (r.escalated) console.log(`   ⚠️  ESCALATED`);
      console.log('');
    });

    console.log('✅ SUCCESS! Complete test data created\n');
    console.log('📱 READY TO TEST:');
    console.log('   Login: supervisor@gmail.com / password123');
    console.log('   Navigate to: Attendance Monitoring');
    console.log('   Select: Today\'s date');
    console.log('   Project: Any project (data is for projectId: 1)');
    console.log('\n✅ FEATURES TO VERIFY:');
    console.log('   ✅ Lunch Break Tracking');
    console.log('   ✅ Regular Hours (green)');
    console.log('   ✅ OT Hours (orange/bold)');
    console.log('   ✅ Absence Reasons (badges)');
    console.log('   ✅ Action Buttons');
    console.log('   ✅ Escalation Status');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected');
  }
}

createCompleteTestData();
