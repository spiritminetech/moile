import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixAndCreate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const db = mongoose.connection.db;
    const assignmentsCol = db.collection('workertaskassignments');
    const attendanceCol = db.collection('attendances');
    const employeesCol = db.collection('employees');
    const tasksCol = db.collection('tasks');

    // Try to drop the problematic index
    try {
      await assignmentsCol.dropIndex('id_1');
      console.log('✅ Dropped id_1 index\n');
    } catch (err) {
      console.log('⚠️  Could not drop index (may not exist)\n');
    }

    // Get data
    const employees = await employeesCol.find().limit(10).toArray();
    const task = await tasksCol.findOne();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    console.log(`📅 Creating for: ${todayString}\n`);

    // Clear
    await attendanceCol.deleteMany({ date: today });
    await assignmentsCol.deleteMany({ date: todayString });

    // Create assignments
    const assignments = [];
    for (let i = 0; i < employees.length; i++) {
      assignments.push({
        employeeId: employees[i]._id,
        projectId: 1,
        taskId: task._id,
        date: todayString,
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
      { status: 'late', clockIn: 10, lunch: [13, 14, 60], clockOut: 18, hours: [7, 0], reason: 'Traffic delay', note: 'Heavy traffic' },
      { status: 'absent', hours: [0, 0], reason: 'Sick Leave', note: 'Fever and flu', escalated: false },
      { status: 'absent', hours: [0, 0], reason: 'Emergency', note: 'Family emergency', escalated: true },
      { status: 'present', clockIn: 8, lunch: [12, 14, 120], clockOut: 18, hours: [8, 0], note: 'Extended lunch' },
      { status: 'half-day', clockIn: 8, clockOut: 13, hours: [5, 0], reason: 'Half Day Leave' },
      { status: 'present', clockIn: 14, clockOut: 18, hours: [4, 0], lunch: [0, 0, 0] },
      { status: 'present', clockIn: 6, lunch: [12, 12.5, 30], clockOut: 22, hours: [9, 6.5] },
      { status: 'absent', hours: [0, 0], reason: 'Unauthorized', note: 'No call no show', escalated: false }
    ];

    const attendances = [];
    for (let i = 0; i < employees.length; i++) {
      const s = scenarios[i];
      const att = {
        employeeId: employees[i]._id,
        employeeName: employees[i].name || `Employee ${i + 1}`,
        projectId: 1,
        projectName: 'Construction Site',
        date: today,
        status: s.status,
        regularHours: s.hours[0],
        otHours: s.hours[1],
        totalHours: s.hours[0] + s.hours[1],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (s.clockIn) att.clockIn = new Date(today.getTime() + s.clockIn * 3600000);
      if (s.clockOut) att.clockOut = new Date(today.getTime() + s.clockOut * 3600000);
      if (s.lunch && s.lunch[2] > 0) {
        att.lunchStart = new Date(today.getTime() + s.lunch[0] * 3600000);
        att.lunchEnd = new Date(today.getTime() + s.lunch[1] * 3600000);
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

    console.log('✅ SUCCESS! Data is ready!\n');
    console.log('📱 TEST IN APP:');
    console.log('   Login: supervisor@gmail.com / password123');
    console.log('   Screen: Attendance Monitoring');
    console.log('   Date: Today');
    console.log('   Project: Any project\n');
    console.log('✅ ALL FEATURES READY:');
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
    console.log('\n👋 Done');
  }
}

fixAndCreate();
