import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import Attendance from './src/modules/attendance/Attendance.js';
import dotenv from 'dotenv';

dotenv.config();

async function createSupervisor4SampleData() {
  try {
    console.log('🚀 Creating sample data for Supervisor ID 4...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to database\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Step 1: Find supervisor with ID 4
    const supervisor = await Employee.findOne({ id: 4, jobTitle: /supervisor/i });
    
    if (!supervisor) {
      console.error('❌ Supervisor ID 4 not found!');
      console.log('   Creating supervisor with ID 4...\n');
      
      // Get max employee ID
      const maxEmployee = await Employee.findOne().sort({ id: -1 });
      const newId = maxEmployee ? maxEmployee.id + 1 : 4;
      
      // Create user for supervisor
      const maxUser = await User.findOne().sort({ id: -1 });
      const newUserId = maxUser ? maxUser.id + 1 : 100;
      
      const supervisorUser = new User({
        id: newUserId,
        email: 'supervisor4@test.com',
        password: '$2b$10$YourHashedPasswordHere', // You should hash this properly
        role: 'supervisor',
        isActive: true
      });
      await supervisorUser.save();
      
      const newSupervisor = new Employee({
        id: newId === 4 ? 4 : newId,
        companyId: 1,
        userId: newUserId,
        fullName: 'Supervisor 4 Test',
        phone: '555-0104',
        jobTitle: 'Site Supervisor',
        currentProject: {
          id: 1,
          name: 'Test Project',
          code: 'TP001'
        },
        status: 'ACTIVE'
      });
      await newSupervisor.save();
      
      console.log('✅ Created Supervisor 4');
      console.log(`   ID: ${newSupervisor.id}`);
      console.log(`   Name: ${newSupervisor.fullName}`);
      console.log(`   Company ID: ${newSupervisor.companyId}`);
      console.log(`   Project ID: ${newSupervisor.currentProject.id}\n`);
      
      return;
    }

    console.log('✅ Supervisor found:', supervisor.fullName);
    console.log('   ID:', supervisor.id);
    console.log('   Company ID:', supervisor.companyId);
    console.log('   Project ID:', supervisor.currentProject?.id || 'N/A', '\n');

    const projectId = supervisor.currentProject?.id || 1;
    const companyId = supervisor.companyId;

    // Step 2: Get or create workers
    console.log('📋 Setting up workers...');
    
    let workers = await Employee.find({
      companyId: companyId,
      jobTitle: /worker/i,
      status: 'ACTIVE'
    }).limit(5);

    if (workers.length < 5) {
      console.log(`⚠️  Only ${workers.length} workers found. Creating additional workers...\n`);
      
      const maxEmployee = await Employee.findOne().sort({ id: -1 });
      let nextId = maxEmployee ? maxEmployee.id + 1 : 100;
      
      const maxUser = await User.findOne().sort({ id: -1 });
      let nextUserId = maxUser ? maxUser.id + 1 : 200;
      
      for (let i = workers.length; i < 5; i++) {
        const workerUser = new User({
          id: nextUserId++,
          email: `worker${i + 1}.sup4@test.com`,
          password: '$2b$10$YourHashedPasswordHere',
          role: 'worker',
          isActive: true
        });
        await workerUser.save();
        
        const worker = new Employee({
          id: nextId++,
          companyId: companyId,
          userId: workerUser.id,
          fullName: `Worker ${i + 1} - Supervisor 4`,
          phone: `555-020${i + 1}`,
          jobTitle: 'Construction Worker',
          currentProject: {
            id: projectId,
            name: 'Test Project',
            code: 'TP001'
          },
          status: 'ACTIVE'
        });
        await worker.save();
        workers.push(worker);
      }
      
      console.log(`✅ Created ${5 - workers.length} additional workers\n`);
    }

    console.log('👷 Workers for testing:');
    workers.forEach((w, idx) => {
      console.log(`   ${idx + 1}. ${w.fullName} (ID: ${w.id})`);
    });
    console.log('');

    // Step 3: Create attendance records for today
    console.log('📅 Creating attendance records for today...\n');

    // Clear existing attendance for today
    await Attendance.deleteMany({
      employeeId: { $in: workers.map(w => w.id) },
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // Get max attendance ID
    const maxAttendance = await Attendance.findOne().sort({ id: -1 });
    let nextAttId = maxAttendance ? maxAttendance.id + 1 : 1000;

    // Scenario 1: Worker 1 - Present, On Time
    const worker1 = workers[0];
    const checkInTime1 = new Date(today);
    checkInTime1.setHours(8, 0, 0, 0); // 8:00 AM

    await Attendance.create({
      id: nextAttId++,
      employeeId: worker1.id,
      projectId: projectId,
      date: today,
      checkIn: checkInTime1,
      insideGeofenceAtCheckin: true,
      pendingCheckout: true
    });
    console.log(`✅ ${worker1.fullName}: Present, On Time (8:00 AM)`);

    // Scenario 2: Worker 2 - Present, Late
    const worker2 = workers[1];
    const checkInTime2 = new Date(today);
    checkInTime2.setHours(9, 30, 0, 0); // 9:30 AM (Late)

    await Attendance.create({
      id: nextAttId++,
      employeeId: worker2.id,
      projectId: projectId,
      date: today,
      checkIn: checkInTime2,
      insideGeofenceAtCheckin: true,
      pendingCheckout: true
    });
    console.log(`✅ ${worker2.fullName}: Late (9:30 AM)`);

    // Scenario 3: Worker 3 - Absent (no attendance record)
    const worker3 = workers[2];
    console.log(`✅ ${worker3.fullName}: Absent (no check-in)`);

    // Scenario 4: Worker 4 - Present with Geofence Violation
    const worker4 = workers[3];
    const checkInTime4 = new Date(today);
    checkInTime4.setHours(8, 15, 0, 0); // 8:15 AM

    await Attendance.create({
      id: nextAttId++,
      employeeId: worker4.id,
      projectId: projectId,
      date: today,
      checkIn: checkInTime4,
      insideGeofenceAtCheckin: false, // Outside geofence
      lastLatitude: 12.9716,
      lastLongitude: 77.5946,
      pendingCheckout: true
    });
    console.log(`✅ ${worker4.fullName}: Present with Geofence Violation`);

    // Scenario 5: Worker 5 - Late with Geofence Violation
    const worker5 = workers[4];
    const checkInTime5 = new Date(today);
    checkInTime5.setHours(10, 0, 0, 0); // 10:00 AM (Very Late)

    await Attendance.create({
      id: nextAttId++,
      employeeId: worker5.id,
      projectId: projectId,
      date: today,
      checkIn: checkInTime5,
      insideGeofenceAtCheckin: false,
      lastLatitude: 12.9800,
      lastLongitude: 77.6000,
      pendingCheckout: true
    });
    console.log(`✅ ${worker5.fullName}: Late with Geofence Violation (10:00 AM)\n`);

    // Step 4: Verify data
    console.log('🔍 Verifying created data...\n');

    const todayAttendance = await Attendance.find({
      projectId: projectId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    console.log('📊 Summary:');
    console.log(`   - Supervisor ID: 4`);
    console.log(`   - Company ID: ${companyId}`);
    console.log(`   - Project ID: ${projectId}`);
    console.log(`   - Date: ${today.toLocaleDateString()}`);
    console.log(`   - Total Workers: ${workers.length}`);
    console.log(`   - Attendance Records: ${todayAttendance.length}`);
    console.log(`   - Present (On Time): 1`);
    console.log(`   - Late: 2`);
    console.log(`   - Absent: 1`);
    console.log(`   - Geofence Violations: 2`);
    console.log('');
    console.log('✅ SAMPLE DATA CREATION COMPLETE!');
    console.log('🧪 You can now test the supervisor APIs!\n');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

createSupervisor4SampleData();
