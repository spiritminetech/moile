import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function quickTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
    const Attendance = mongoose.model('Attendance', new mongoose.Schema({}, { strict: false, collection: 'attendances' }));

    // Find ANY employees
    const allEmployees = await Employee.find().limit(10);
    console.log(`Found ${allEmployees.length} total employees`);
    
    if (allEmployees.length > 0) {
      console.log('\nFirst few employees:');
      allEmployees.slice(0, 5).forEach(emp => {
        console.log(`- ${emp.name} (ID: ${emp.employeeId}, Supervisor: ${emp.supervisorId})`);
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (allEmployees.length >= 10) {
      await Attendance.deleteMany({ date: today });
      console.log('\n🗑️  Cleared today\'s attendance\n');

      const records = [
        {
          employeeId: allEmployees[0].employeeId,
          employeeName: allEmployees[0].name,
          projectId: 1,
          projectName: 'Test Site',
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
        },
        {
          employeeId: allEmployees[1].employeeId,
          employeeName: allEmployees[1].name,
          projectId: 1,
          projectName: 'Test Site',
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
        },
        {
          employeeId: allEmployees[2].employeeId,
          employeeName: allEmployees[2].name,
          projectId: 1,
          projectName: 'Test Site',
          date: today,
          status: 'late',
          clockIn: new Date(today.getTime() + 10 * 3600000),
          clockOut: new Date(today.getTime() + 18 * 3600000),
          regularHours: 7,
          otHours: 0,
          totalHours: 7,
          absenceReason: 'Traffic delay',
          absenceNote: 'Heavy traffic due to accident'
        },
        {
          employeeId: allEmployees[3].employeeId,
          employeeName: allEmployees[3].name,
          projectId: 1,
          projectName: 'Test Site',
          date: today,
          status: 'absent',
          regularHours: 0,
          otHours: 0,
          totalHours: 0,
          absenceReason: 'Sick Leave',
          absenceNote: 'Fever and flu',
          escalated: false
        },
        {
          employeeId: allEmployees[4].employeeId,
          employeeName: allEmployees[4].name,
          projectId: 1,
          projectName: 'Test Site',
          date: today,
          status: 'absent',
          regularHours: 0,
          otHours: 0,
          totalHours: 0,
          absenceReason: 'Emergency',
          absenceNote: 'Family emergency',
          escalated: true,
          escalatedAt: new Date(),
          escalatedBy: 4
        },
        {
          employeeId: allEmployees[5].employeeId,
          employeeName: allEmployees[5].name,
          projectId: 1,
          projectName: 'Test Site',
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
        },
        {
          employeeId: allEmployees[6].employeeId,
          employeeName: allEmployees[6].name,
          projectId: 1,
          projectName: 'Test Site',
          date: today,
          status: 'half-day',
          clockIn: new Date(today.getTime() + 8 * 3600000),
          clockOut: new Date(today.getTime() + 13 * 3600000),
          regularHours: 5,
          otHours: 0,
          totalHours: 5,
          absenceReason: 'Half Day Leave',
          absenceNote: 'Personal appointment'
        },
        {
          employeeId: allEmployees[7].employeeId,
          employeeName: allEmployees[7].name,
          projectId: 1,
          projectName: 'Test Site',
          date: today,
          status: 'present',
          clockIn: new Date(today.getTime() + 14 * 3600000),
          clockOut: new Date(today.getTime() + 18 * 3600000),
          regularHours: 4,
          otHours: 0,
          totalHours: 4,
          lunchDuration: 0
        },
        {
          employeeId: allEmployees[8].employeeId,
          employeeName: allEmployees[8].name,
          projectId: 1,
          projectName: 'Test Site',
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
        },
        {
          employeeId: allEmployees[9].employeeId,
          employeeName: allEmployees[9].name,
          projectId: 1,
          projectName: 'Test Site',
          date: today,
          status: 'absent',
          regularHours: 0,
          otHours: 0,
          totalHours: 0,
          absenceReason: 'Unauthorized',
          absenceNote: 'No call, no show',
          escalated: false
        }
      ];

      await Attendance.insertMany(records);
      
      console.log('✅ Created 10 attendance records\n');
      console.log('📱 FEATURES TO VERIFY:');
      console.log('✅ Lunch Break Tracking');
      console.log('✅ Regular Hours (green)');
      console.log('✅ OT Hours (orange/bold)');
      console.log('✅ Absence Reasons (badges)');
      console.log('✅ Action Buttons');
      console.log('\n✅ Done!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

quickTest();
