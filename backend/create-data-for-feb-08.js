import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function createDataForFeb08() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const db = mongoose.connection.db;
    const assignmentsCol = db.collection('workertaskassignments');
    const attendanceCol = db.collection('attendances');
    const employeesCol = db.collection('employees');
    const tasksCol = db.collection('tasks');

    const employees = await employeesCol.find().limit(10).toArray();
    const task = await tasksCol.findOne();
    
    // Force date to 2026-02-08
    const targetDate = new Date('2026-02-08T00:00:00.000Z');
    const targetDateString = '2026-02-08';

    console.log(`📅 Creating for: ${targetDateString}\n`);

    // Clear
    await attendanceCol.deleteMany({ date: targetDate });
    await assignmentsCol.deleteMany({ date: targetDateString });

    // Create assignments
    const assignments = [];
    for (let i = 0; i < employees.length; i++) {
      assignments.push({
        employeeId: employees[i]._id,
        projectId: 1,
        taskId: task._id,
        date: targetDateString,
        status: 'queued',
        sequence: i + 1,
        createdAt: new Date()
      });
    }

    const assignResult = await assignmentsCol.insertMany(assignments);
    console.log(`✅ Created ${assignResult.insertedCount} assignments\n`);

    // Create attendance
    const scenarios = [
      { status: 'present', clockIn: 8, lunch: [12, 13, 60], clockOut: 18, hours: [9, 0] },
      { status: 'present', clockIn: 7, lunch: [12, 12.5, 30], clockOut: 20, hours: [9, 3.5] },
      { status: 'late', clockIn: 10, lunch: [13, 14, 60], clockOut: 18, hours: [7, 0], reason: 'Traffic delay', note: 'Heavy traffic on highway' },
      { status: 'absent', hours: [0, 0], reason: 'Sick Leave', note: 'Fever and flu symptoms', escalated: false },
      { status: 'absent', hours: [0, 0], reason: 'Emergency', note: 'Family emergency, no prior notice', escalated: true },
      { status: 'present', clockIn: 8, lunch: [12, 14, 120], clockOut: 18, hours: [8, 0], note: 'Extended lunch for personal appointment' },
      { status: 'half-day', clockIn: 8, clockOut: 13, hours: [5, 0], reason: 'Half Day Leave', note: 'Personal appointment' },
      { status: 'present', clockIn: 14, clockOut: 18, hours: [4, 0], lunch: [0, 0, 0] },
      { status: 'present', clockIn: 6, lunch: [12, 12.5, 30], clockOut: 22, hours: [9, 6.5] },
      { status: 'absent', hours: [0, 0], reason: 'Unauthorized', note: 'No call, no show - unable to contact', escalated: false }
    ];

    const attendances = [];
    for (let i = 0; i < employees.length; i++) {
      const s = scenarios[i];
      const att = {
        employeeId: employees[i]._id,
        employeeName: employees[i].name || `Employee ${i + 1}`,
        projectId: 1,
        projectName: 'Construction Site',
        date: targetDate,
        status: s.status,
        regularHours: s.hours[0],
        otHours: s.hours[1],
        totalHours: s.hours[0] + s.hours[1],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (s.clockIn) att.clockIn = new Date(targetDate.getTime() + s.clockIn * 3600000);
      if (s.clockOut) att.clockOut = new Date(targetDate.getTime() + s.clockOut * 3600000);
      if (s.lunch && s.lunch[2] > 0) {
        att.lunchStart = new Date(targetDate.getTime() + s.lunch[0] * 3600000);
        att.lunchEnd = new Date(targetDate.getTime() + s.lunch[1] * 3600000);
        att.lunchDuration = s.lunch[2];
      }
      if (s.reason) att.absenceReason = s.reason;
      if (s.note) att.absenceNote = s.note;
      if (s.escalated !== undefined) {
        att.escalated = s.escalated;
        if (s.escalated) {
          att.escalatedAt = new Date();
          att.escalatedBy = 1;
        }
      }

      attendances.push(att);
    }

    const attResult = await attendanceCol.insertMany(attendances);
    console.log(`✅ Created ${attResult.insertedCount} attendance records\n`);

    console.log('✅ SUCCESS! Data created for 2026-02-08!\n');
    console.log('📱 NOW TEST IN APP:');
    console.log('   Login: supervisor@gmail.com / password123');
    console.log('   Go to: Attendance Monitoring');
    console.log('   The data will show automatically for today\n');
    console.log('✅ ALL FEATURES READY TO VERIFY:');
    console.log('   ✅ Lunch Break Tracking (60, 30, 120 min)');
    console.log('   ✅ Regular Hours (green)');
    console.log('   ✅ OT Hours (orange/bold - 3.5h, 6.5h)');
    console.log('   ✅ Absence Reasons (color-coded badges)');
    console.log('   ✅ Action Buttons (Mark Reason, Escalate)');
    console.log('   ✅ Escalation Status (one already escalated)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Done');
  }
}

createDataForFeb08();
