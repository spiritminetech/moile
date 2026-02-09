import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function createNow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
    const Attendance = mongoose.model('Attendance', new mongoose.Schema({}, { strict: false, collection: 'attendances' }));

    // Get any 10 employees
    const employees = await Employee.find().limit(10);
    console.log(`📊 Found ${employees.length} employees\n`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Clear today's attendance
    await Attendance.deleteMany({ date: today });
    console.log('🗑️  Cleared today\'s attendance\n');

    const records = [];

    // 1. Perfect attendance with lunch
    if (employees[0]) {
      records.push({
        employeeId: employees[0]._id,
        employeeName: employees[0].name || 'Employee 1',
        projectId: 1,
        projectName: 'Construction Site',
        date: today,
        status: 'present',
        clockIn: new Date(today.getTime() + 8 * 3600000),
        lunchStart: new Date(today.getTime() + 12 * 3600000),
        lunchEnd: new Date(today.getTime() + 13 * 3600000),
        clockOut: new Date(today.getTime() + 18 * 3600000),
        regularHours: 9,
        otHours: 0,
        totalHours: 9,
        lunchDuration: 60
      });
    }

    // 2. Overtime with short lunch
    if (employees[1]) {
      records.push({
        employeeId: employees[1]._id,
        employeeName: employees[1].name || 'Employee 2',
        projectId: 1,
        projectName: 'Construction Site',
        date: today,
        status: 'present',
        clockIn: new Date(today.getTime() + 7 * 3600000),
        lunchStart: new Date(today.getTime() + 12 * 3600000),
        lunchEnd: new Date(today.getTime() + 12.5 * 3600000),
        clockOut: new Date(today.getTime() + 20 * 3600000),
        regularHours: 9,
        otHours: 3.5,
        totalHours: 12.5,
        lunchDuration: 30
      });
    }

    // 3. Late with reason
    if (employees[2]) {
      records.push({
        employeeId: employees[2]._id,
        employeeName: employees[2].name || 'Employee 3',
        projectId: 1,
        projectName: 'Construction Site',
        date: today,
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
      });
    }

    // 4. Sick leave
    if (employees[3]) {
      records.push({
        employeeId: employees[3]._id,
        employeeName: employees[3].name || 'Employee 4',
        projectId: 1,
        projectName: 'Construction Site',
        date: today,
        status: 'absent',
        regularHours: 0,
        otHours: 0,
        totalHours: 0,
        absenceReason: 'Sick Leave',
        absenceNote: 'Fever and flu symptoms, doctor advised rest',
        escalated: false
      });
    }

    // 5. Emergency - escalated
    if (employees[4]) {
      records.push({
        employeeId: employees[4]._id,
        employeeName: employees[4].name || 'Employee 5',
        projectId: 1,
        projectName: 'Construction Site',
        date: today,
        status: 'absent',
        regularHours: 0,
        otHours: 0,
        totalHours: 0,
        absenceReason: 'Emergency',
        absenceNote: 'Family emergency, no prior notice',
        escalated: true,
        escalatedAt: new Date(),
        escalatedBy: 1
      });
    }

    // 6. Extended lunch
    if (employees[5]) {
      records.push({
        employeeId: employees[5]._id,
        employeeName: employees[5].name || 'Employee 6',
        projectId: 1,
        projectName: 'Construction Site',
        date: today,
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
      });
    }

    // 7. Half day
    if (employees[6]) {
      records.push({
        employeeId: employees[6]._id,
        employeeName: employees[6].name || 'Employee 7',
        projectId: 1,
        projectName: 'Construction Site',
        date: today,
        status: 'half-day',
        clockIn: new Date(today.getTime() + 8 * 3600000),
        clockOut: new Date(today.getTime() + 13 * 3600000),
        regularHours: 5,
        otHours: 0,
        totalHours: 5,
        absenceReason: 'Half Day Leave',
        absenceNote: 'Personal appointment in afternoon'
      });
    }

    // 8. Short shift - no lunch
    if (employees[7]) {
      records.push({
        employeeId: employees[7]._id,
        employeeName: employees[7].name || 'Employee 8',
        projectId: 1,
        projectName: 'Construction Site',
        date: today,
        status: 'present',
        clockIn: new Date(today.getTime() + 14 * 3600000),
        clockOut: new Date(today.getTime() + 18 * 3600000),
        regularHours: 4,
        otHours: 0,
        totalHours: 4,
        lunchDuration: 0
      });
    }

    // 9. Maximum OT
    if (employees[8]) {
      records.push({
        employeeId: employees[8]._id,
        employeeName: employees[8].name || 'Employee 9',
        projectId: 1,
        projectName: 'Construction Site',
        date: today,
        status: 'present',
        clockIn: new Date(today.getTime() + 6 * 3600000),
        lunchStart: new Date(today.getTime() + 12 * 3600000),
        lunchEnd: new Date(today.getTime() + 12.5 * 3600000),
        clockOut: new Date(today.getTime() + 22 * 3600000),
        regularHours: 9,
        otHours: 6.5,
        totalHours: 15.5,
        lunchDuration: 30
      });
    }

    // 10. Unauthorized
    if (employees[9]) {
      records.push({
        employeeId: employees[9]._id,
        employeeName: employees[9].name || 'Employee 10',
        projectId: 1,
        projectName: 'Construction Site',
        date: today,
        status: 'absent',
        regularHours: 0,
        otHours: 0,
        totalHours: 0,
        absenceReason: 'Unauthorized',
        absenceNote: 'No call, no show - unable to contact',
        escalated: false
      });
    }

    await Attendance.insertMany(records);

    console.log(`✅ Created ${records.length} attendance records:\n`);
    records.forEach((r, i) => {
      console.log(`${i + 1}. ${r.employeeName} - ${r.status.toUpperCase()}`);
      if (r.lunchDuration) console.log(`   Lunch: ${r.lunchDuration} min`);
      console.log(`   Hours: ${r.regularHours}h regular | ${r.otHours}h OT`);
      if (r.absenceReason) console.log(`   Reason: ${r.absenceReason}`);
      if (r.escalated) console.log(`   ⚠️  ESCALATED`);
      console.log('');
    });

    console.log('✅ SUCCESS!\n');
    console.log('📱 FEATURES TO VERIFY:');
    console.log('✅ Lunch Break Tracking (60, 30, 120 min)');
    console.log('✅ Regular Hours (green)');
    console.log('✅ OT Hours (orange/bold - 3.5h, 6.5h)');
    console.log('✅ Absence Reasons (badges)');
    console.log('✅ Action Buttons (Mark Reason, Escalate)');
    console.log('✅ Escalation Status');
    console.log('\n🔍 Login: supervisor@gmail.com / password123');
    console.log('Navigate to Attendance Monitoring → Select Today');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Done');
  }
}

createNow();
