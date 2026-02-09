import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function createFinalTestData() {
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

    // Get or create task
    let task = await Task.findOne();
    if (!task) {
      task = await Task.create({
        taskName: 'General Construction Work',
        projectId: 1,
        status: 'active'
      });
    }
    console.log(`✅ Using task: ${task.taskName}\n`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    console.log(`📅 Creating data for: ${todayString}\n`);

    // Clear existing data
    await Attendance.deleteMany({ date: today });
    await WorkerTaskAssignment.deleteMany({ date: todayString });
    console.log('🗑️  Cleared existing data\n');

    // Create task assignments AND attendance together
    console.log('📝 Creating task assignments and attendance...\n');

    const scenarios = [
      { name: 'Perfect Attendance', status: 'present', clockIn: 8, lunchStart: 12, lunchEnd: 13, clockOut: 18, regularHours: 9, otHours: 0, lunchDuration: 60 },
      { name: 'Overtime Worker', status: 'present', clockIn: 7, lunchStart: 12, lunchEnd: 12.5, clockOut: 20, regularHours: 9, otHours: 3.5, lunchDuration: 30 },
      { name: 'Late Arrival', status: 'late', clockIn: 10, lunchStart: 13, lunchEnd: 14, clockOut: 18, regularHours: 7, otHours: 0, lunchDuration: 60, absenceReason: 'Traffic delay', absenceNote: 'Heavy traffic on highway' },
      { name: 'Sick Leave', status: 'absent', regularHours: 0, otHours: 0, absenceReason: 'Sick Leave', absenceNote: 'Fever and flu symptoms', escalated: false },
      { name: 'Emergency (Escalated)', status: 'absent', regularHours: 0, otHours: 0, absenceReason: 'Emergency', absenceNote: 'Family emergency', escalated: true, escalatedAt: new Date(), escalatedBy: 1 },
      { name: 'Extended Lunch', status: 'present', clockIn: 8, lunchStart: 12, lunchEnd: 14, clockOut: 18, regularHours: 8, otHours: 0, lunchDuration: 120, absenceNote: 'Extended lunch - personal appointment' },
      { name: 'Half Day', status: 'half-day', clockIn: 8, clockOut: 13, regularHours: 5, otHours: 0, absenceReason: 'Half Day Leave', absenceNote: 'Personal appointment' },
      { name: 'Short Shift', status: 'present', clockIn: 14, clockOut: 18, regularHours: 4, otHours: 0, lunchDuration: 0 },
      { name: 'Maximum OT', status: 'present', clockIn: 6, lunchStart: 12, lunchEnd: 12.5, clockOut: 22, regularHours: 9, otHours: 6.5, lunchDuration: 30 },
      { name: 'Unauthorized', status: 'absent', regularHours: 0, otHours: 0, absenceReason: 'Unauthorized', absenceNote: 'No call, no show', escalated: false }
    ];

    for (let i = 0; i < Math.min(employees.length, 10); i++) {
      const emp = employees[i];
      const scenario = scenarios[i];

      // Create task assignment
      try {
        await WorkerTaskAssignment.create({
          employeeId: emp._id,
          projectId: 1,
          taskId: task._id,
          date: todayString,
          status: 'queued',
          sequence: i + 1,
          createdAt: new Date()
        });
      } catch (err) {
        // Ignore duplicates
      }

      // Create attendance
      const attendance = {
        employeeId: emp._id,
        employeeName: emp.name || `Employee ${i + 1}`,
        projectId: 1,
        projectName: 'Construction Site',
        date: today,
        status: scenario.status,
        regularHours: scenario.regularHours,
        otHours: scenario.otHours,
        totalHours: scenario.regularHours + scenario.otHours,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (scenario.clockIn) attendance.clockIn = new Date(today.getTime() + scenario.clockIn * 3600000);
      if (scenario.clockOut) attendance.clockOut = new Date(today.getTime() + scenario.clockOut * 3600000);
      if (scenario.lunchStart) attendance.lunchStart = new Date(today.getTime() + scenario.lunchStart * 3600000);
      if (scenario.lunchEnd) attendance.lunchEnd = new Date(today.getTime() + scenario.lunchEnd * 3600000);
      if (scenario.lunchDuration !== undefined) attendance.lunchDuration = scenario.lunchDuration;
      if (scenario.absenceReason) attendance.absenceReason = scenario.absenceReason;
      if (scenario.absenceNote) attendance.absenceNote = scenario.absenceNote;
      if (scenario.escalated !== undefined) {
        attendance.escalated = scenario.escalated;
        if (scenario.escalated) {
          attendance.escalatedAt = scenario.escalatedAt;
          attendance.escalatedBy = scenario.escalatedBy;
        }
      }

      await Attendance.create(attendance);
      console.log(`✅ ${i + 1}. ${scenario.name} - ${scenario.status.toUpperCase()}`);
    }

    // Verify
    const assignmentCount = await WorkerTaskAssignment.countDocuments({ date: todayString });
    const attendanceCount = await Attendance.countDocuments({ date: today });

    console.log(`\n✅ SUCCESS!`);
    console.log(`   Task Assignments: ${assignmentCount}`);
    console.log(`   Attendance Records: ${attendanceCount}`);
    console.log(`\n📱 READY TO TEST:`);
    console.log(`   Login: supervisor@gmail.com / password123`);
    console.log(`   Navigate to: Attendance Monitoring`);
    console.log(`   Select: Today (${todayString})`);
    console.log(`   Project: Select any project`);
    console.log(`\n✅ FEATURES TO VERIFY:`);
    console.log(`   ✅ Lunch Break Tracking (60, 30, 120 min)`);
    console.log(`   ✅ Regular Hours (green)`);
    console.log(`   ✅ OT Hours (orange/bold - 3.5h, 6.5h)`);
    console.log(`   ✅ Absence Reasons (color-coded badges)`);
    console.log(`   ✅ Action Buttons (Mark Reason, Escalate)`);
    console.log(`   ✅ Escalation Status`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log(`\n👋 Disconnected`);
  }
}

createFinalTestData();
