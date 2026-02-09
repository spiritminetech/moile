import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function addAttendanceTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Attendance = mongoose.model('Attendance', new mongoose.Schema({}, { strict: false, collection: 'attendances' }));
    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));

    const employees = await Employee.find({ supervisorId: 4 }).limit(10);
    console.log(`\n📊 Found ${employees.length} employees for supervisor 4`);

    if (employees.length === 0) {
      console.log('❌ No employees found. Please ensure employees exist with supervisorId: 4');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Attendance.deleteMany({ date: today });
    console.log('🗑️  Cleared existing attendance for today\n');

    const testData = [];

    // 1. Perfect attendance with lunch break
    if (employees[0]) {
      testData.push({
        employeeId: employees[0].employeeId,
        employeeName: employees[0].name,
        projectId: 1,
        projectName: 'Construction Site Alpha',
        date: today,
        status: 'present',
        clockIn: new Date(today.getTime() + 8 * 60 * 60 * 1000),
        lunchStart: new Date(today.getTime() + 12 * 60 * 60 * 1000),
        lunchEnd: new Date(today.getTime() + 13 * 60 * 60 * 1000),
        clockOut: new Date(today.getTime() + 18 * 60 * 60 * 1000),
        regularHours: 9,
        otHours: 0,
        totalHours: 9,
        lunchDuration: 60
      });
    }

    // 2. Overtime worker with short lunch
    if (employees[1]) {
      testData.push({
        employeeId: employees[1].employeeId,
        employeeName: employees[1].name,
        projectId: 1,
        projectName: 'Construction Site Alpha',
        date: today,
        status: 'present',
        clockIn: new Date(today.getTime() + 7 * 60 * 60 * 1000),
        lunchStart: new Date(today.getTime() + 12 * 60 * 60 * 1000),
        lunchEnd: new Date(today.getTime() + 12.5 * 60 * 60 * 1000),
        clockOut: new Date(today.getTime() + 20 * 60 * 60 * 1000),
        regularHours: 9,
        otHours: 3.5,
        totalHours: 12.5,
        lunchDuration: 30
      });
    }

    // 3. Late arrival with reason
    if (employees[2]) {
      testData.push({
        employeeId: employees[2].employeeId,
        employeeName: employees[2].name,
        projectId: 1,
        projectName: 'Construction Site Alpha',
        date: today,
        status: 'late',
        clockIn: new Date(today.getTime() + 10 * 60 * 60 * 1000),
        lunchStart: new Date(today.getTime() + 13 * 60 * 60 * 1000),
        lunchEnd: new Date(today.getTime() + 14 * 60 * 60 * 1000),
        clockOut: new Date(today.getTime() + 18 * 60 * 60 * 1000),
        regularHours: 7,
        otHours: 0,
        totalHours: 7,
        lunchDuration: 60,
        absenceReason: 'Traffic delay',
        absenceNote: 'Heavy traffic on highway due to accident'
      });
    }

    // 4. Sick leave (absent)
    if (employees[3]) {
      testData.push({
        employeeId: employees[3].employeeId,
        employeeName: employees[3].name,
        projectId: 1,
        projectName: 'Construction Site Alpha',
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
      testData.push({
        employeeId: employees[4].employeeId,
        employeeName: employees[4].name,
        projectId: 1,
        projectName: 'Construction Site Alpha',
        date: today,
        status: 'absent',
        regularHours: 0,
        otHours: 0,
        totalHours: 0,
        absenceReason: 'Emergency',
        absenceNote: 'Family emergency, no prior notice',
        escalated: true,
        escalatedAt: new Date(),
        escalatedBy: 4
      });
    }

    // 6. Extended lunch break
    if (employees[5]) {
      testData.push({
        employeeId: employees[5].employeeId,
        employeeName: employees[5].name,
        projectId: 1,
        projectName: 'Construction Site Alpha',
        date: today,
        status: 'present',
        clockIn: new Date(today.getTime() + 8 * 60 * 60 * 1000),
        lunchStart: new Date(today.getTime() + 12 * 60 * 60 * 1000),
        lunchEnd: new Date(today.getTime() + 14 * 60 * 60 * 1000),
        clockOut: new Date(today.getTime() + 18 * 60 * 60 * 1000),
        regularHours: 8,
        otHours: 0,
        totalHours: 8,
        lunchDuration: 120,
        absenceNote: 'Extended lunch for personal appointment'
      });
    }

    // 7. Half day
    if (employees[6]) {
      testData.push({
        employeeId: employees[6].employeeId,
        employeeName: employees[6].name,
        projectId: 1,
        projectName: 'Construction Site Alpha',
        date: today,
        status: 'half-day',
        clockIn: new Date(today.getTime() + 8 * 60 * 60 * 1000),
        clockOut: new Date(today.getTime() + 13 * 60 * 60 * 1000),
        regularHours: 5,
        otHours: 0,
        totalHours: 5,
        absenceReason: 'Half Day Leave',
        absenceNote: 'Personal appointment in afternoon'
      });
    }

    // 8. Short shift - no lunch
    if (employees[7]) {
      testData.push({
        employeeId: employees[7].employeeId,
        employeeName: employees[7].name,
        projectId: 1,
        projectName: 'Construction Site Alpha',
        date: today,
        status: 'present',
        clockIn: new Date(today.getTime() + 14 * 60 * 60 * 1000),
        clockOut: new Date(today.getTime() + 18 * 60 * 60 * 1000),
        regularHours: 4,
        otHours: 0,
        totalHours: 4,
        lunchDuration: 0
      });
    }

    // 9. Maximum overtime
    if (employees[8]) {
      testData.push({
        employeeId: employees[8].employeeId,
        employeeName: employees[8].name,
        projectId: 1,
        projectName: 'Construction Site Alpha',
        date: today,
        status: 'present',
        clockIn: new Date(today.getTime() + 6 * 60 * 60 * 1000),
        lunchStart: new Date(today.getTime() + 12 * 60 * 60 * 1000),
        lunchEnd: new Date(today.getTime() + 12.5 * 60 * 60 * 1000),
        clockOut: new Date(today.getTime() + 22 * 60 * 60 * 1000),
        regularHours: 9,
        otHours: 6.5,
        totalHours: 15.5,
        lunchDuration: 30
      });
    }

    // 10. Unauthorized absence
    if (employees[9]) {
      testData.push({
        employeeId: employees[9].employeeId,
        employeeName: employees[9].name,
        projectId: 1,
        projectName: 'Construction Site Alpha',
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

    await Attendance.insertMany(testData);

    console.log('✅ Created attendance records:\n');
    testData.forEach((record, i) => {
      console.log(`${i + 1}. ${record.employeeName} - ${record.status.toUpperCase()}`);
      if (record.clockIn) console.log(`   Clock In: ${record.clockIn.toLocaleTimeString()}`);
      if (record.lunchStart) console.log(`   Lunch: ${record.lunchStart.toLocaleTimeString()} - ${record.lunchEnd.toLocaleTimeString()} (${record.lunchDuration} min)`);
      if (record.clockOut) console.log(`   Clock Out: ${record.clockOut.toLocaleTimeString()}`);
      console.log(`   Hours: ${record.regularHours}h regular | ${record.otHours}h OT`);
      if (record.absenceReason) console.log(`   Reason: ${record.absenceReason}`);
      if (record.escalated !== undefined) console.log(`   Escalated: ${record.escalated ? 'YES ⚠️' : 'NO'}`);
      console.log('');
    });

    console.log('\n📱 FEATURES TO VERIFY IN MOBILE APP:');
    console.log('✅ Lunch Break Tracking - Start time, end time, duration');
    console.log('✅ Regular Hours - Displayed in green');
    console.log('✅ OT Hours - Displayed in orange/bold');
    console.log('✅ Absence Reasons - Color-coded badges with notes');
    console.log('✅ Action Buttons - Mark Reason & Escalate');
    console.log('✅ Extended lunch breaks highlighted');
    console.log('✅ Various attendance statuses');
    console.log('✅ Escalation indicators');

    console.log('\n🔍 TO TEST:');
    console.log('1. Login as supervisor4@example.com');
    console.log('2. Go to Attendance Monitoring');
    console.log('3. Select today\'s date');
    console.log('4. Verify all features display correctly');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected');
  }
}

addAttendanceTestData();
