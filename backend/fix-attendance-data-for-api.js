import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixAttendanceData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const Attendance = mongoose.model('Attendance', new mongoose.Schema({}, { strict: false, collection: 'attendances' }));
    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    // Get existing task assignments for today
    const assignments = await WorkerTaskAssignment.find({ date: todayString });
    console.log(`📊 Found ${assignments.length} task assignments for today\n`);

    if (assignments.length === 0) {
      console.log('❌ No task assignments found. The API requires task assignments to show workers.');
      console.log('   Workers must be assigned to tasks to appear in attendance monitoring.');
      return;
    }

    // Get employee IDs from assignments
    const employeeIds = assignments.map(a => a.employeeId);
    console.log(`👥 Employee IDs from assignments:`, employeeIds.slice(0, 5), '...\n');

    // Clear existing attendance for these employees
    await Attendance.deleteMany({
      employeeId: { $in: employeeIds },
      date: today
    });
    console.log('🗑️  Cleared existing attendance\n');

    // Create attendance records for assigned workers
    const scenarios = [
      { status: 'present', clockIn: 8, lunchStart: 12, lunchEnd: 13, clockOut: 18, regularHours: 9, otHours: 0, lunchDuration: 60 },
      { status: 'present', clockIn: 7, lunchStart: 12, lunchEnd: 12.5, clockOut: 20, regularHours: 9, otHours: 3.5, lunchDuration: 30 },
      { status: 'late', clockIn: 10, lunchStart: 13, lunchEnd: 14, clockOut: 18, regularHours: 7, otHours: 0, lunchDuration: 60, absenceReason: 'Traffic delay', absenceNote: 'Heavy traffic' },
      { status: 'absent', regularHours: 0, otHours: 0, absenceReason: 'Sick Leave', absenceNote: 'Fever and flu', escalated: false },
      { status: 'absent', regularHours: 0, otHours: 0, absenceReason: 'Emergency', absenceNote: 'Family emergency', escalated: true, escalatedAt: new Date(), escalatedBy: 1 },
      { status: 'present', clockIn: 8, lunchStart: 12, lunchEnd: 14, clockOut: 18, regularHours: 8, otHours: 0, lunchDuration: 120, absenceNote: 'Extended lunch' },
      { status: 'half-day', clockIn: 8, clockOut: 13, regularHours: 5, otHours: 0, absenceReason: 'Half Day Leave', absenceNote: 'Personal appointment' },
      { status: 'present', clockIn: 14, clockOut: 18, regularHours: 4, otHours: 0, lunchDuration: 0 },
      { status: 'present', clockIn: 6, lunchStart: 12, lunchEnd: 12.5, clockOut: 22, regularHours: 9, otHours: 6.5, lunchDuration: 30 },
      { status: 'absent', regularHours: 0, otHours: 0, absenceReason: 'Unauthorized', absenceNote: 'No call, no show', escalated: false }
    ];

    const records = [];
    for (let i = 0; i < Math.min(employeeIds.length, 10); i++) {
      const scenario = scenarios[i % scenarios.length];
      const empId = employeeIds[i];

      const record = {
        employeeId: empId,
        employeeName: `Employee ${i + 1}`,
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

      if (scenario.clockIn) record.clockIn = new Date(today.getTime() + scenario.clockIn * 3600000);
      if (scenario.clockOut) record.clockOut = new Date(today.getTime() + scenario.clockOut * 3600000);
      if (scenario.lunchStart) record.lunchStart = new Date(today.getTime() + scenario.lunchStart * 3600000);
      if (scenario.lunchEnd) record.lunchEnd = new Date(today.getTime() + scenario.lunchEnd * 3600000);
      if (scenario.lunchDuration !== undefined) record.lunchDuration = scenario.lunchDuration;
      if (scenario.absenceReason) record.absenceReason = scenario.absenceReason;
      if (scenario.absenceNote) record.absenceNote = scenario.absenceNote;
      if (scenario.escalated !== undefined) {
        record.escalated = scenario.escalated;
        if (scenario.escalated) {
          record.escalatedAt = scenario.escalatedAt;
          record.escalatedBy = scenario.escalatedBy;
        }
      }

      records.push(record);
    }

    await Attendance.insertMany(records);
    console.log(`✅ Created ${records.length} attendance records\n`);

    console.log('📋 SUMMARY:\n');
    records.forEach((r, i) => {
      console.log(`${i + 1}. ${r.status.toUpperCase()}`);
      if (r.lunchDuration) console.log(`   Lunch: ${r.lunchDuration} min`);
      console.log(`   Hours: ${r.regularHours}h | OT: ${r.otHours}h`);
      if (r.absenceReason) console.log(`   Reason: ${r.absenceReason}`);
      if (r.escalated) console.log(`   ⚠️  ESCALATED`);
    });

    console.log('\n✅ SUCCESS!');
    console.log('\n📱 Login: supervisor@gmail.com / password123');
    console.log('   Navigate to: Attendance Monitoring');
    console.log('   Select: Today, Project ID: 1');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Done');
  }
}

fixAttendanceData();
