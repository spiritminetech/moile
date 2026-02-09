import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function forceCreateData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const db = mongoose.connection.db;
    
    // Get collections directly
    const employeesCol = db.collection('employees');
    const attendanceCol = db.collection('attendances');
    const assignmentsCol = db.collection('workertaskassignments');
    const tasksCol = db.collection('tasks');

    // Get employees
    const employees = await employeesCol.find().limit(10).toArray();
    console.log(`📊 Found ${employees.length} employees\n`);

    // Get a task
    const task = await tasksCol.findOne();
    console.log(`✅ Using task: ${task?.taskName || 'Unknown'}\n`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    console.log(`📅 Date: ${todayString}\n`);

    // Clear existing
    await attendanceCol.deleteMany({ date: today });
    await assignmentsCol.deleteMany({ date: todayString });
    console.log('🗑️  Cleared existing data\n');

    const scenarios = [
      { name: 'Perfect', status: 'present', clockIn: 8, lunch: [12, 13, 60], clockOut: 18, hours: [9, 0] },
      { name: 'Overtime', status: 'present', clockIn: 7, lunch: [12, 12.5, 30], clockOut: 20, hours: [9, 3.5] },
      { name: 'Late', status: 'late', clockIn: 10, lunch: [13, 14, 60], clockOut: 18, hours: [7, 0], reason: 'Traffic delay', note: 'Heavy traffic' },
      { name: 'Sick', status: 'absent', hours: [0, 0], reason: 'Sick Leave', note: 'Fever and flu', escalated: false },
      { name: 'Emergency', status: 'absent', hours: [0, 0], reason: 'Emergency', note: 'Family emergency', escalated: true },
      { name: 'Extended Lunch', status: 'present', clockIn: 8, lunch: [12, 14, 120], clockOut: 18, hours: [8, 0], note: 'Extended lunch' },
      { name: 'Half Day', status: 'half-day', clockIn: 8, clockOut: 13, hours: [5, 0], reason: 'Half Day Leave', note: 'Personal' },
      { name: 'Short', status: 'present', clockIn: 14, clockOut: 18, hours: [4, 0], lunch: [0, 0, 0] },
      { name: 'Max OT', status: 'present', clockIn: 6, lunch: [12, 12.5, 30], clockOut: 22, hours: [9, 6.5] },
      { name: 'Unauthorized', status: 'absent', hours: [0, 0], reason: 'Unauthorized', note: 'No call no show', escalated: false }
    ];

    console.log('📝 Creating data...\n');

    for (let i = 0; i < Math.min(employees.length, 10); i++) {
      const emp = employees[i];
      const s = scenarios[i];

      // Insert assignment directly (no id field to avoid index issue)
      try {
        await assignmentsCol.insertOne({
          employeeId: emp._id,
          projectId: 1,
          taskId: task?._id,
          date: todayString,
          status: 'queued',
          sequence: i + 1,
          createdAt: new Date()
        });
      } catch (err) {
        // Ignore
      }

      // Insert attendance
      const att = {
        employeeId: emp._id,
        employeeName: emp.name || `Employee ${i + 1}`,
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
      if (s.lunch) {
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

      await attendanceCol.insertOne(att);
      console.log(`✅ ${i + 1}. ${s.name} - ${s.status}`);
    }

    // Verify
    const assignCount = await assignmentsCol.countDocuments({ date: todayString });
    const attCount = await attendanceCol.countDocuments({ date: today });

    console.log(`\n✅ SUCCESS!`);
    console.log(`   Assignments: ${assignCount}`);
    console.log(`   Attendance: ${attCount}`);
    console.log(`\n📱 TEST NOW:`);
    console.log(`   Login: supervisor@gmail.com / password123`);
    console.log(`   Go to: Attendance Monitoring`);
    console.log(`   Date: Today (${todayString})`);
    console.log(`   Project: Any project`);
    console.log(`\n✅ ALL FEATURES READY TO VERIFY!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Done');
  }
}

forceCreateData();
