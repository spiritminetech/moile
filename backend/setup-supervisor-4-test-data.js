import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import Attendance from './src/modules/attendance/Attendance.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function setupSupervisor4TestData() {
  try {
    console.log('🚀 Setting up test data for Supervisor ID 4...\n');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to database\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Step 1: Find or create supervisor with ID 4
    let supervisor = await Employee.findOne({ id: 4 });
    
    if (!supervisor || !supervisor.jobTitle?.toLowerCase().includes('supervisor')) {
      console.log('📝 Creating Supervisor ID 4...\n');
      
      // Get max IDs
      const maxUser = await User.findOne().sort({ id: -1 });
      const newUserId = maxUser ? maxUser.id + 1 : 100;
      
      // Hash password
      const passwordHash = await bcrypt.hash('password123', 10);
      
      // Create user
      const supervisorUser = new User({
        id: newUserId,
        email: 'supervisor4@test.com',
        passwordHash: passwordHash,
        isActive: true
      });
      await supervisorUser.save();
      console.log(`✅ Created user: ${supervisorUser.email} (ID: ${supervisorUser.id})`);
      
      // Create or update employee
      if (supervisor) {
        supervisor.userId = newUserId;
        supervisor.jobTitle = 'Site Supervisor';
        supervisor.fullName = 'Supervisor 4 Test';
        await supervisor.save();
      } else {
        supervisor = new Employee({
          id: 4,
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
        await supervisor.save();
      }
      console.log(`✅ Created supervisor: ${supervisor.fullName} (ID: ${supervisor.id})\n`);
    } else {
      console.log('✅ Supervisor ID 4 found:', supervisor.fullName);
      const user = await User.findOne({ id: supervisor.userId });
      console.log(`   Email: ${user?.email || 'N/A'}`);
    }

    console.log(`   Company ID: ${supervisor.companyId}`);
    console.log(`   Project ID: ${supervisor.currentProject?.id || 1}\n`);

    const projectId = supervisor.currentProject?.id || 1;
    const companyId = supervisor.companyId;

    // Step 2: Create 5 test workers
    console.log('👷 Creating test workers...\n');
    
    const maxEmployee = await Employee.findOne().sort({ id: -1 });
    let nextEmpId = maxEmployee ? maxEmployee.id + 1 : 100;
    
    const maxUser = await User.findOne().sort({ id: -1 });
    let nextUserId = maxUser ? maxUser.id + 1 : 200;
    
    const passwordHash = await bcrypt.hash('password123', 10);
    const workers = [];
    
    for (let i = 1; i <= 5; i++) {
      const workerUser = new User({
        id: nextUserId++,
        email: `worker.sup4.${i}@test.com`,
        passwordHash: passwordHash,
        isActive: true
      });
      await workerUser.save();
      
      const worker = new Employee({
        id: nextEmpId++,
        companyId: companyId,
        userId: workerUser.id,
        fullName: `Test Worker ${i}`,
        phone: `555-030${i}`,
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
      
      console.log(`✅ Created: ${worker.fullName} (ID: ${worker.id})`);
    }
    console.log('');

    // Step 3: Create attendance records for today
    console.log('📅 Creating attendance records for today...\n');

    // Clear existing attendance for these workers today
    await Attendance.deleteMany({
      employeeId: { $in: workers.map(w => w.id) },
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    const maxAttendance = await Attendance.findOne().sort({ id: -1 });
    let nextAttId = maxAttendance ? maxAttendance.id + 1 : 1000;

    // Worker 1: Present, On Time (8:00 AM)
    const checkIn1 = new Date(today);
    checkIn1.setHours(8, 0, 0, 0);
    
    await Attendance.create({
      id: nextAttId++,
      employeeId: workers[0].id,
      projectId: projectId,
      date: today,
      checkIn: checkIn1,
      insideGeofenceAtCheckin: true,
      pendingCheckout: true
    });
    console.log(`✅ ${workers[0].fullName}: Present, On Time (8:00 AM)`);

    // Worker 2: Late (9:30 AM)
    const checkIn2 = new Date(today);
    checkIn2.setHours(9, 30, 0, 0);
    
    await Attendance.create({
      id: nextAttId++,
      employeeId: workers[1].id,
      projectId: projectId,
      date: today,
      checkIn: checkIn2,
      insideGeofenceAtCheckin: true,
      pendingCheckout: true
    });
    console.log(`✅ ${workers[1].fullName}: Late (9:30 AM)`);

    // Worker 3: Absent (no record)
    console.log(`✅ ${workers[2].fullName}: Absent (no check-in)`);

    // Worker 4: Present with Geofence Violation (8:15 AM)
    const checkIn4 = new Date(today);
    checkIn4.setHours(8, 15, 0, 0);
    
    await Attendance.create({
      id: nextAttId++,
      employeeId: workers[3].id,
      projectId: projectId,
      date: today,
      checkIn: checkIn4,
      insideGeofenceAtCheckin: false,
      lastLatitude: 12.9716,
      lastLongitude: 77.5946,
      pendingCheckout: true
    });
    console.log(`✅ ${workers[3].fullName}: Present with Geofence Violation (8:15 AM)`);

    // Worker 5: Late with Geofence Violation (10:00 AM)
    const checkIn5 = new Date(today);
    checkIn5.setHours(10, 0, 0, 0);
    
    await Attendance.create({
      id: nextAttId++,
      employeeId: workers[4].id,
      projectId: projectId,
      date: today,
      checkIn: checkIn5,
      insideGeofenceAtCheckin: false,
      lastLatitude: 12.9800,
      lastLongitude: 77.6000,
      pendingCheckout: true
    });
    console.log(`✅ ${workers[4].fullName}: Late with Geofence Violation (10:00 AM)\n`);

    // Step 4: Summary
    console.log('✅ TEST DATA SETUP COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   - Supervisor ID: 4`);
    console.log(`   - Company ID: ${companyId}`);
    console.log(`   - Project ID: ${projectId}`);
    console.log(`   - Date: ${today.toLocaleDateString()}`);
    console.log(`   - Total Workers: 5`);
    console.log(`   - Present (On Time): 1`);
    console.log(`   - Late: 2`);
    console.log(`   - Absent: 1`);
    console.log(`   - Geofence Violations: 2\n`);
    
    console.log('🧪 Test the APIs with:');
    console.log(`   GET /api/supervisor/workers-assigned`);
    console.log(`   GET /api/supervisor/late-absent-workers`);
    console.log(`   GET /api/supervisor/geofence-violations\n`);
    
    console.log('🔐 Login credentials:');
    console.log(`   Email: supervisor4@test.com`);
    console.log(`   Password: password123\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

setupSupervisor4TestData();
