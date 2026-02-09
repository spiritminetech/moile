import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function createAttendanceForSupervisorGmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
    const Supervisor = mongoose.model('Supervisor', new mongoose.Schema({}, { strict: false, collection: 'supervisors' }));
    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
    const Attendance = mongoose.model('Attendance', new mongoose.Schema({}, { strict: false, collection: 'attendances' }));

    // Find supervisor@gmail.com user
    const user = await User.findOne({ email: 'supervisor@gmail.com' });
    if (!user) {
      console.log('❌ User supervisor@gmail.com not found');
      return;
    }

    console.log('✅ Found user:', user.email);
    console.log('   User ID:', user.userId);
    console.log('   Role:', user.role);

    // Find supervisor record
    const supervisor = await Supervisor.findOne({ userId: user.userId });
    if (!supervisor) {
      console.log('❌ Supervisor record not found for this user');
      return;
    }

    console.log('\n✅ Found supervisor:');
    console.log('   Supervisor ID:', supervisor.supervisorId);
    console.log('   Name:', supervisor.name);
    console.log('   Project ID:', supervisor.projectId);

    // Find employees under this supervisor
    const employees = await Employee.find({ 
      supervisorId: supervisor.supervisorId 
    }).limit(10);

    console.log(`\n📊 Found ${employees.length} employees under this supervisor`);

    if (employees.length === 0) {
      console.log('❌ No employees found. Creating test employees...');
      
      // Create test employees
      const testEmployees = [
        'John Smith', 'Mike Johnson', 'David Brown', 'Robert Wilson',
        'James Davis', 'William Miller', 'Richard Moore', 'Joseph Taylor',
        'Thomas Anderson', 'Charles White'
      ];

      for (let i = 0; i < testEmployees.length; i++) {
        await Employee.create({
          employeeId: 200 + i,
          name: testEmployees[i],
          supervisorId: supervisor.supervisorId,
          projectId: supervisor.projectId || 1,
          status: 'active',
          role: 'Worker',
          createdAt: new Date()
        });
      }

      const newEmployees = await Employee.find({ supervisorId: supervisor.supervisorId });
      console.log(`✅ Created ${newEmployees.length} test employees`);
      employees.push(...newEmployees);
    } else {
      console.log('\nEmployees:');
      employees.forEach((emp, i) => {
        console.log(`   ${i + 1}. ${emp.name} (ID: ${emp.employeeId})`);
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Clear existing attendance
    await Attendance.deleteMany({ 
      date: today,
      projectId: supervisor.projectId || 1
    });
    console.log('\n🗑️  Cleared existing attendance for today\n');

    // Create comprehensive test data
    const records = [];

    if (employees[0]) {
      records.push({
        employeeId: employees[0].employeeId,
        employeeName: employees[0].name,
        projectId: supervisor.projectId || 1,
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

    if (employees[1]) {
      records.push({
        employeeId: employees[1].employeeId,
        employeeName: employees[1].name,
        projectId: supervisor.projectId || 1,
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

    if (employees[2]) {
      records.push({
        employeeId: employees[2].employeeId,
        employeeName: employees[2].name,
        projectId: supervisor.projectId || 1,
        projectName: 'Construction Site',
        date: today,
        status: 'late',
        clockIn: new Date(today.getTime() + 10 * 3600000),
        clockOut: new Date(today.getTime() + 18 * 3600000),
        regularHours: 7,
        otHours: 0,
        totalHours: 7,
        absenceReason: 'Traffic delay',
        absenceNote: 'Heavy traffic on highway due to accident'
      });
    }

    if (employees[3]) {
      records.push({
        employeeId: employees[3].employeeId,
        employeeName: employees[3].name,
        projectId: supervisor.projectId || 1,
        projectName: 'Construction Site',
        date: today,
        status: 'absent',
        regularHours: 0,
        otHours: 0,
        totalHours: 0,
        absenceReason: 'Sick Leave',
        absenceNote: 'Fever and flu symptoms',
        escalated: false
      });
    }

    if (employees[4]) {
      records.push({
        employeeId: employees[4].employeeId,
        employeeName: employees[4].name,
        projectId: supervisor.projectId || 1,
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
        escalatedBy: supervisor.supervisorId
      });
    }

    if (employees[5]) {
      records.push({
        employeeId: employees[5].employeeId,
        employeeName: employees[5].name,
        projectId: supervisor.projectId || 1,
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
        absenceNote: 'Extended lunch - personal appointment'
      });
    }

    if (employees[6]) {
      records.push({
        employeeId: employees[6].employeeId,
        employeeName: employees[6].name,
        projectId: supervisor.projectId || 1,
        projectName: 'Construction Site',
        date: today,
        status: 'half-day',
        clockIn: new Date(today.getTime() + 8 * 3600000),
        clockOut: new Date(today.getTime() + 13 * 3600000),
        regularHours: 5,
        otHours: 0,
        totalHours: 5,
        absenceReason: 'Half Day Leave',
        absenceNote: 'Personal appointment'
      });
    }

    if (employees[7]) {
      records.push({
        employeeId: employees[7].employeeId,
        employeeName: employees[7].name,
        projectId: supervisor.projectId || 1,
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

    if (employees[8]) {
      records.push({
        employeeId: employees[8].employeeId,
        employeeName: employees[8].name,
        projectId: supervisor.projectId || 1,
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

    if (employees[9]) {
      records.push({
        employeeId: employees[9].employeeId,
        employeeName: employees[9].name,
        projectId: supervisor.projectId || 1,
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

    console.log('✅ Created attendance records:\n');
    records.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.employeeName} - ${rec.status.toUpperCase()}`);
      if (rec.clockIn) console.log(`   In: ${rec.clockIn.toLocaleTimeString()}`);
      if (rec.lunchStart) console.log(`   Lunch: ${rec.lunchStart.toLocaleTimeString()} - ${rec.lunchEnd.toLocaleTimeString()} (${rec.lunchDuration}min)`);
      if (rec.clockOut) console.log(`   Out: ${rec.clockOut.toLocaleTimeString()}`);
      console.log(`   Hours: ${rec.regularHours}h | OT: ${rec.otHours}h`);
      if (rec.absenceReason) console.log(`   Reason: ${rec.absenceReason}`);
      if (rec.escalated) console.log(`   ⚠️  ESCALATED`);
      console.log('');
    });

    console.log('\n✅ SUCCESS! Test data created for supervisor@gmail.com');
    console.log('\n📱 Login with:');
    console.log('   Email: supervisor@gmail.com');
    console.log('   Password: password123');
    console.log('\n🔍 Navigate to Attendance Monitoring and select today\'s date');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected');
  }
}

createAttendanceForSupervisorGmail();
