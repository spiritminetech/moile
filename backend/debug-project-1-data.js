/**
 * Debug Project 1 data to find the ObjectId casting issue
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';
import Attendance from './src/modules/attendance/Attendance.js';

dotenv.config();

async function debugProject1Data() {
  try {
    console.log('🔍 Debugging Project 1 Data...\n');

    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');

    const workDate = new Date().toISOString().split('T')[0];
    console.log(`📅 Work Date: ${workDate}\n`);

    // Step 1: Check assignments for Project 1
    console.log('1️⃣ Checking assignments for Project 1...');
    const assignments = await WorkerTaskAssignment.find({
      projectId: 1,
      date: workDate
    });
    console.log(`📋 Found ${assignments.length} assignments`);
    
    if (assignments.length > 0) {
      console.log('Assignment details:');
      assignments.forEach((assignment, index) => {
        console.log(`  ${index + 1}. Employee ID: ${assignment.employeeId} (type: ${typeof assignment.employeeId})`);
        console.log(`     Task: ${assignment.taskName}`);
        console.log(`     Date: ${assignment.date}`);
      });
    }

    // Step 2: Get employee IDs and check their types
    const employeeIds = [...new Set(assignments.map(a => a.employeeId))];
    console.log(`\n2️⃣ Employee IDs from assignments:`);
    employeeIds.forEach((id, index) => {
      console.log(`  ${index + 1}. ID: ${id} (type: ${typeof id})`);
    });

    // Step 3: Try to find employees using numeric IDs
    console.log(`\n3️⃣ Searching for employees with numeric IDs...`);
    try {
      const employees = await Employee.find({ id: { $in: employeeIds } });
      console.log(`✅ Found ${employees.length} employees using numeric IDs`);
      employees.forEach((emp, index) => {
        console.log(`  ${index + 1}. ID: ${emp.id}, Name: ${emp.fullName}, _id: ${emp._id}`);
      });
    } catch (error) {
      console.log(`❌ Error finding employees with numeric IDs: ${error.message}`);
    }

    // Step 4: Try to find employees using _id field (ObjectId)
    console.log(`\n4️⃣ Searching for employees with _id field...`);
    try {
      // Convert to ObjectIds if they're strings
      const objectIdEmployeeIds = employeeIds.map(id => {
        try {
          return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
        } catch (e) {
          console.log(`⚠️  Cannot convert ${id} to ObjectId: ${e.message}`);
          return id;
        }
      });
      
      const employees = await Employee.find({ _id: { $in: objectIdEmployeeIds } });
      console.log(`✅ Found ${employees.length} employees using _id field`);
    } catch (error) {
      console.log(`❌ Error finding employees with _id field: ${error.message}`);
      console.log(`Error details: ${error.stack}`);
    }

    // Step 5: Check all employees to see their ID structure
    console.log(`\n5️⃣ Checking all employees to understand ID structure...`);
    const allEmployees = await Employee.find({}).limit(5);
    console.log(`Sample employees:`);
    allEmployees.forEach((emp, index) => {
      console.log(`  ${index + 1}. id: ${emp.id} (${typeof emp.id}), _id: ${emp._id}, name: ${emp.fullName}`);
    });

    // Step 6: Check attendance data
    console.log(`\n6️⃣ Checking attendance data for these employees...`);
    const attendanceRecords = await Attendance.find({
      employeeId: { $in: employeeIds },
      date: {
        $gte: new Date(workDate),
        $lt: new Date(new Date(workDate).setDate(new Date(workDate).getDate() + 1))
      }
    });
    console.log(`📊 Found ${attendanceRecords.length} attendance records`);
    attendanceRecords.forEach((att, index) => {
      console.log(`  ${index + 1}. Employee ID: ${att.employeeId}, Project: ${att.projectId}, Date: ${att.date}`);
    });

  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

debugProject1Data();