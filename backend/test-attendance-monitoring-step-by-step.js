/**
 * Step-by-step test of attendance monitoring logic
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';
import Attendance from './src/modules/attendance/Attendance.js';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

async function testAttendanceMonitoringStepByStep() {
  try {
    console.log('🔍 Step-by-step Attendance Monitoring Test...\n');

    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');

    const projectId = 1;
    const workDate = new Date().toISOString().split('T')[0];
    console.log(`📅 Testing Project ${projectId} for date: ${workDate}\n`);

    // Step 1: Check project exists
    console.log('1️⃣ Checking if project exists...');
    const project = await Project.findOne({ id: Number(projectId) });
    if (!project) {
      console.log('❌ Project not found');
      return;
    }
    console.log(`✅ Project found: ${project.projectName || project.name}`);

    // Step 2: Get assignments
    console.log('\n2️⃣ Getting assignments...');
    const assignments = await WorkerTaskAssignment.find({
      projectId: Number(projectId),
      date: workDate
    });
    console.log(`📋 Found ${assignments.length} assignments`);
    
    if (assignments.length === 0) {
      console.log('⚠️  No assignments found for this date');
      return;
    }

    // Step 3: Get employee IDs
    console.log('\n3️⃣ Extracting employee IDs...');
    const employeeIds = [...new Set(assignments.map(a => a.employeeId))];
    console.log(`👥 Employee IDs: ${employeeIds.join(', ')}`);
    console.log(`Types: ${employeeIds.map(id => typeof id).join(', ')}`);

    // Step 4: Query employees using numeric IDs
    console.log('\n4️⃣ Querying employees...');
    try {
      let employeeQuery = { id: { $in: employeeIds } };
      console.log(`Query: ${JSON.stringify(employeeQuery)}`);
      
      const employees = await Employee.find(employeeQuery).lean();
      console.log(`✅ Found ${employees.length} employees`);
      
      employees.forEach((emp, index) => {
        console.log(`  ${index + 1}. ID: ${emp.id}, Name: ${emp.fullName}`);
      });

      // Step 5: Create employee map
      console.log('\n5️⃣ Creating employee map...');
      const employeeMap = employees.reduce((map, emp) => {
        map[emp.id] = emp;
        return map;
      }, {});
      console.log(`📊 Employee map keys: ${Object.keys(employeeMap).join(', ')}`);

      // Step 6: Get attendance records
      console.log('\n6️⃣ Getting attendance records...');
      const startOfDay = new Date(workDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(workDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      console.log(`Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
      
      const attendanceRecords = await Attendance.find({
        employeeId: { $in: employeeIds },
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).lean();
      
      console.log(`📊 Found ${attendanceRecords.length} attendance records`);
      attendanceRecords.forEach((att, index) => {
        console.log(`  ${index + 1}. Employee: ${att.employeeId}, Project: ${att.projectId}, CheckIn: ${att.checkIn || 'None'}`);
      });

      // Step 7: Process workers
      console.log('\n7️⃣ Processing workers...');
      const workers = [];
      
      for (const assignment of assignments) {
        console.log(`\n   Processing assignment for employee ${assignment.employeeId}...`);
        
        const employee = employeeMap[assignment.employeeId];
        if (!employee) {
          console.log(`   ❌ Employee ${assignment.employeeId} not found in map`);
          continue;
        }
        console.log(`   ✅ Employee found: ${employee.fullName}`);

        const attendanceKey = `${assignment.employeeId}-${assignment.projectId}`;
        const attendance = attendanceRecords.find(att => 
          att.employeeId === assignment.employeeId && att.projectId === assignment.projectId
        );
        
        if (attendance) {
          console.log(`   ✅ Attendance found: CheckIn=${attendance.checkIn}, CheckOut=${attendance.checkOut || 'None'}`);
        } else {
          console.log(`   ⚠️  No attendance record found`);
        }

        const workerData = {
          employeeId: assignment.employeeId,
          workerName: employee.fullName,
          status: attendance ? (attendance.checkOut ? 'CHECKED_OUT' : 'CHECKED_IN') : 'ABSENT',
          checkInTime: attendance?.checkIn || null,
          checkOutTime: attendance?.checkOut || null,
          projectName: project.projectName || project.name
        };
        
        workers.push(workerData);
        console.log(`   ✅ Worker processed: ${workerData.workerName} - ${workerData.status}`);
      }

      console.log(`\n✅ Successfully processed ${workers.length} workers`);
      console.log('\n📊 Final Results:');
      workers.forEach((worker, index) => {
        console.log(`  ${index + 1}. ${worker.workerName} - ${worker.status}`);
      });

    } catch (error) {
      console.log(`❌ Error in employee query: ${error.message}`);
      console.log(`Stack: ${error.stack}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

testAttendanceMonitoringStepByStep();