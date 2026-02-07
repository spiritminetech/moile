import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import Attendance from './src/modules/attendance/Attendance.js';
import dotenv from 'dotenv';

dotenv.config();

async function verifySupervisor4Data() {
  try {
    console.log('🔍 Verifying Supervisor ID 4 test data...\n');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to database\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find supervisor
    const supervisor = await Employee.findOne({ id: 4 });
    if (!supervisor) {
      console.error('❌ Supervisor ID 4 not found!');
      return;
    }

    const supervisorUser = await User.findOne({ id: supervisor.userId });
    
    console.log('👨‍💼 Supervisor Information:');
    console.log(`   ID: ${supervisor.id}`);
    console.log(`   Name: ${supervisor.fullName}`);
    console.log(`   Email: ${supervisorUser?.email || 'N/A'}`);
    console.log(`   Company ID: ${supervisor.companyId}`);
    console.log(`   Project ID: ${supervisor.currentProject?.id || 'N/A'}\n`);

    const projectId = supervisor.currentProject?.id || 1;
    const companyId = supervisor.companyId;

    // Find all workers for this project
    const workers = await Employee.find({
      companyId: companyId,
      'currentProject.id': projectId,
      jobTitle: /worker/i,
      status: 'ACTIVE'
    });

    console.log(`📊 API 1: Workers Assigned (${workers.length} workers)\n`);
    
    for (const worker of workers) {
      const attendance = await Attendance.findOne({
        employeeId: worker.id,
        projectId: projectId,
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      const status = attendance ? 'Present' : 'Absent';
      const checkInTime = attendance?.checkIn ? attendance.checkIn.toLocaleTimeString() : 'N/A';
      const geofence = attendance?.insideGeofenceAtCheckin ? '✅' : '❌';
      
      console.log(`   ${worker.fullName} (ID: ${worker.id})`);
      console.log(`      Status: ${status}`);
      console.log(`      Check-in: ${checkInTime}`);
      if (attendance) {
        console.log(`      Geofence: ${geofence}`);
      }
      console.log('');
    }

    // Find late/absent workers
    const lateWorkers = await Attendance.find({
      projectId: projectId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      checkIn: {
        $gte: new Date(today.getTime() + 9 * 60 * 60 * 1000) // After 9 AM
      }
    });

    const absentWorkerIds = workers
      .filter(w => !lateWorkers.find(att => att.employeeId === w.id))
      .map(w => w.id);

    const absentWorkers = await Employee.find({
      id: { $in: absentWorkerIds },
      companyId: companyId,
      'currentProject.id': projectId
    });

    // Check for workers with no attendance today
    const workersWithAttendance = await Attendance.find({
      projectId: projectId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).distinct('employeeId');

    const actualAbsentWorkers = workers.filter(w => !workersWithAttendance.includes(w.id));

    console.log(`📊 API 2: Late/Absent Workers (${lateWorkers.length + actualAbsentWorkers.length} workers)\n`);
    
    console.log('   Late Workers:');
    for (const att of lateWorkers) {
      const worker = workers.find(w => w.id === att.employeeId);
      if (worker) {
        console.log(`      ${worker.fullName} - ${att.checkIn.toLocaleTimeString()}`);
      }
    }
    
    console.log('\n   Absent Workers:');
    for (const worker of actualAbsentWorkers) {
      console.log(`      ${worker.fullName} - No check-in`);
    }
    console.log('');

    // Find geofence violations
    const violations = await Attendance.find({
      projectId: projectId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      insideGeofenceAtCheckin: false
    });

    console.log(`📊 API 3: Geofence Violations (${violations.length} violations)\n`);
    
    for (const att of violations) {
      const worker = workers.find(w => w.id === att.employeeId);
      if (worker) {
        console.log(`   ${worker.fullName}`);
        console.log(`      Time: ${att.checkIn.toLocaleTimeString()}`);
        console.log(`      Location: ${att.lastLatitude}, ${att.lastLongitude}`);
        console.log('');
      }
    }

    console.log('✅ DATA VERIFICATION COMPLETE!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Start the backend server: npm start');
    console.log('   2. Test the APIs using the test script or Postman');
    console.log('   3. Login with: supervisor4@test.com / password123\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

verifySupervisor4Data();
