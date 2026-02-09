import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function setupAttendanceTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Attendance = mongoose.model('Attendance', new mongoose.Schema({}, { strict: false, collection: 'attendances' }));
    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false, collection: 'projects' }));

    // Find any project
    const project = await Project.findOne();
    if (!project) {
      console.log('❌ No projects found. Creating sample project...');
      const newProject = await Project.create({
        projectId: 1,
        name: 'Construction Site Alpha',
        location: 'Downtown Area',
        status: 'active',
        createdAt: new Date()
      });
      console.log('✅ Created project:', newProject.name);
    }

    const activeProject = await Project.findOne();
    console.log(`\n📍 Using project: ${activeProject.name} (ID: ${activeProject.projectId || activeProject._id})`);

    // Find or create employees
    let employees = await Employee.find({ supervisorId: 4 }).limit(10);
    
    if (employees.length === 0) {
      console.log('\n📝 Creating sample employees...');
      const sampleEmployees = [
        { name: 'John Smith', role: 'Mason' },
        { name: 'Mike Johnson', role: 'Carpenter' },
        { name: 'David Brown', role: 'Electrician' },
        { name: 'Robert Wilson', role: 'Plumber' },
        { name: 'James Davis', role: 'Painter' },
        { name: 'William Miller', role: 'Welder' },
        { name: 'Richard Moore', role: 'Helper' },
        { name: 'Joseph Taylor', role: 'Driver' },
        { name: 'Thomas Anderson', role: 'Foreman' },
        { name: 'Charles White', role: 'Laborer' }
      ];

      for (let i = 0; i < sampleEmployees.length; i++) {
        await Employee.create({
          employeeId: 100 + i,
          name: sampleEmployees[i].name,
          role: sampleEmployees[i].role,
          supervisorId: 4,
          projectId: activeProject.projectId || 1,
          status: 'active',
          createdAt: new Date()
        });
      }
      
      employees = await Employee.find({ supervisorId: 4 }).limit(10);
      console.log(`✅ Created ${employees.length} employees`);
    }

    console.log(`\n📊 Found ${employees.length} employees for test data`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Clear existing attendance for today
    await Attendance.deleteMany({
      date: today,
      projectId: activeProject.projectId || 1
    });

    console.log('\n🗑️  Cleared existing attendance data for today');

    const testScenarios = [
      // Scenario 1: Perfect attendance with lunch break
      {
        employee: employees[0],
        scenario: 'Perfect Attendance with Lunch',
        clockIn: new Date(today.getTime() + 8 * 60 * 60 * 1000),
        lunchStart: new Date(today.getTime() + 12 * 60 * 60 * 1000),
        lunchEnd: new Date(today.getTime() + 13 * 60 * 60 * 1000),
        clockOut: new Date(today.getTime() + 18 * 60 * 60 * 1000),
        status: 'present',
        regularHours: 9,
        otHours: 0,
        lunchDuration: 60
      },
      // Scenario 2: Overtime with lunch
      {
        employee: employees[1],
        scenario: 'Overtime Worker',
        clockIn: new Date(today.getTime() + 7 * 60 * 60 * 1000),
        lunchStart: new Date(today.getTime() + 12 * 60 * 60 * 1000),
        lunchEnd: new Date(today.getTime() + 12.5 * 60 * 60 * 1000),
        clockOut: new Date(today.getTime() + 20 * 60 * 60 * 1000),
        status: 'present',
        regularHours: 9,
        otHours: 3.5,
        lunchDuration: 30
      },
      // Scenario 3: Late arrival
      {
        employee: employees[2],
        scenario: 'Late Arrival',
        clockIn: new Date(today.getTime() + 10 * 60 * 60 * 1000),
        lunchStart: new Date(today.getTime() + 13 * 60 * 60 * 1000),
        lunchEnd: new Date(today.getTime() + 14 * 60 * 60 * 1000),
        clockOut: new Date(today.getTime() + 18 * 60 * 60 * 1000),
        status: 'late',
        regularHours: 7,
        otHours: 0,
        lunchDuration: 60,
        absenceReason: 'Traffic delay',
        absenceNote: 'Heavy traffic on highway due to accident'
      },
      // Scenario 4: Absent - Sick Leave
      {
        employee: employees[3],
        scenario: 'Sick Leave',
        status: 'absent',
        regularHours: 0,
        otHours: 0,
        absenceReason: 'Sick Leave',
        absenceNote: 'Fever and flu symptoms, doctor advised rest',
        escalated: false
      },
      // Scenario 5: Absent - Emergency (Escalated)
      {
        employee: employees[4],
        scenario: 'Emergency - Escalated',
        status: 'absent',
        regularHours: 0,
        otHours: 0,
        absenceReason: 'Emergency',
        absenceNote: 'Family emergency, no prior notice',
        escalated: true,
        escalatedAt: new Date(),
        escalatedBy: 4
      },
      // Scenario 6: Extended lunch break
      {
        employee: employees[5],
        scenario: 'Extended Lunch Break',
        clockIn: new Date(today.getTime() + 8 * 60 * 60 * 1000),
        lunchStart: new Date(today.getTime() + 12 * 60 * 60 * 1000),
        lunchEnd: new Date(today.getTime() + 14 * 60 * 60 * 1000),
        clockOut: new Date(today.getTime() + 18 * 60 * 60 * 1000),
        status: 'present',
        regularHours: 8,
        otHours: 0,
        lunchDuration: 120,
        absenceNote: 'Extended lunch for personal appointment'
      },
      // Scenario 7: Half day
      {
        employee: employees[6],
        scenario: 'Half Day',
        clockIn: new Date(today.getTime() + 8 * 60 * 60 * 1000),
        clockOut: new Date(today.getTime() + 13 * 60 * 60 * 1000),
        status: 'half-day',
        regularHours: 5,
        otHours: 0,
        absenceReason: 'Half Day Leave',
        absenceNote: 'Personal appointment in afternoon'
      },
      // Scenario 8: No lunch break (short shift)
      {
        employee: employees[7],
        scenario: 'Short Shift - No Lunch',
        clockIn: new Date(today.getTime() + 14 * 60 * 60 * 1000),
        clockOut: new Date(today.getTime() + 18 * 60 * 60 * 1000),
        status: 'present',
        regularHours: 4,
        otHours: 0,
        lunchDuration: 0
      },
      // Scenario 9: Maximum overtime
      {
        employee: employees[8],
        scenario: 'Maximum Overtime',
        clockIn: new Date(today.getTime() + 6 * 60 * 60 * 1000),
        lunchStart: new Date(today.getTime() + 12 * 60 * 60 * 1000),
        lunchEnd: new Date(today.getTime() + 12.5 * 60 * 60 * 1000),
        clockOut: new Date(today.getTime() + 22 * 60 * 60 * 1000),
        status: 'present',
        regularHours: 9,
        otHours: 6.5,
        lunchDuration: 30
      },
      // Scenario 10: Absent - Unauthorized (Needs Escalation)
      {
        employee: employees[9] || employees[0],
        scenario: 'Unauthorized Absence',
        status: 'absent',
        regularHours: 0,
        otHours: 0,
        absenceReason: 'Unauthorized',
        absenceNote: 'No call, no show - unable to contact',
        escalated: false
      }
    ];

    console.log('\n📝 Creating attendance records...\n');

    for (const scenario of testScenarios) {
      const attendanceData = {
        employeeId: scenario.employee.employeeId,
        employeeName: scenario.employee.name,
        projectId: activeProject.projectId || 1,
        projectName: activeProject.name,
        date: today,
        status: scenario.status,
        regularHours: scenario.regularHours,
        otHours: scenario.otHours,
        totalHours: scenario.regularHours + scenario.otHours,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (scenario.clockIn) attendanceData.clockIn = scenario.clockIn;
      if (scenario.clockOut) attendanceData.clockOut = scenario.clockOut;
      if (scenario.lunchStart && scenario.lunchEnd) {
        attendanceData.lunchStart = scenario.lunchStart;
        attendanceData.lunchEnd = scenario.lunchEnd;
        attendanceData.lunchDuration = scenario.lunchDuration;
      }
      if (scenario.absenceReason) attendanceData.absenceReason = scenario.absenceReason;
      if (scenario.absenceNote) attendanceData.absenceNote = scenario.absenceNote;
      if (scenario.escalated !== undefined) {
        attendanceData.escalated = scenario.escalated;
        if (scenario.escalated) {
          attendanceData.escalatedAt = scenario.escalatedAt;
          attendanceData.escalatedBy = scenario.escalatedBy;
        }
      }

      await Attendance.create(attendanceData);

      console.log(`✅ ${scenario.scenario}`);
      console.log(`   Employee: ${scenario.employee.name}`);
      console.log(`   Status: ${scenario.status}`);
      if (scenario.clockIn) console.log(`   Clock In: ${scenario.clockIn.toLocaleTimeString()}`);
      if (scenario.lunchStart) console.log(`   Lunch: ${scenario.lunchStart.toLocaleTimeString()} - ${scenario.lunchEnd.toLocaleTimeString()} (${scenario.lunchDuration} min)`);
      if (scenario.clockOut) console.log(`   Clock Out: ${scenario.clockOut.toLocaleTimeString()}`);
      console.log(`   Hours: ${scenario.regularHours}h regular | ${scenario.otHours}h OT`);
      if (scenario.absenceReason) console.log(`   Reason: ${scenario.absenceReason}`);
      if (scenario.escalated !== undefined) console.log(`   Escalated: ${scenario.escalated ? 'Yes ⚠️' : 'No'}`);
      console.log('');
    }

    console.log('\n✅ Test data created successfully!');
    console.log('\n📱 Features to verify in mobile app:');
    console.log('   ✅ Lunch Break Tracking - Start time, end time, duration');
    console.log('   ✅ Regular Hours - Displayed in green');
    console.log('   ✅ OT Hours - Displayed in orange/bold');
    console.log('   ✅ Absence Reasons - Color-coded badges with notes');
    console.log('   ✅ Action Buttons - Mark Reason & Escalate');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

setupAttendanceTestData();
