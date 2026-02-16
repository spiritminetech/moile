// Check detailed assignments for employee ID 2

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));

async function checkEmployee2Detailed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find employee 2
    const employee = await Employee.findOne({ employeeId: 2 });
    if (employee) {
      console.log('👤 Employee 2:');
      console.log(`   Name: ${employee.name}`);
      console.log(`   Email: ${employee.email}\n`);
    } else {
      console.log('❌ Employee 2 not found\n');
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find ALL assignments for employee 2
    const allAssignments = await WorkerTaskAssignment.find({ 
      employeeId: 2,
      date: { $gte: today }
    }).sort({ assignmentId: 1 });
    
    console.log(`📊 Found ${allAssignments.length} assignments for employee 2 today\n`);

    if (allAssignments.length > 0) {
      console.log('📋 DETAILED Assignment Information:\n');
      allAssignments.forEach((assignment, index) => {
        console.log(`${index + 1}. Assignment ${assignment.assignmentId}:`);
        console.log(`   Task Name: ${assignment.taskName || 'MISSING'}`);
        console.log(`   Task ID: ${assignment.taskId || 'MISSING'}`);
        console.log(`   Status: ${assignment.status}`);
        console.log(`   Date: ${assignment.date}`);
        console.log(`   Sequence: ${assignment.sequence}`);
        console.log(`   Daily Target:`);
        if (assignment.dailyTarget) {
          console.log(`     Quantity: ${assignment.dailyTarget.quantity || 'MISSING'}`);
          console.log(`     Unit: ${assignment.dailyTarget.unit || 'MISSING'}`);
          console.log(`     Description: ${assignment.dailyTarget.description || 'MISSING'}`);
        } else {
          console.log(`     ❌ NO DAILY TARGET OBJECT`);
        }
        console.log(`   Actual Output: ${assignment.actualOutput || 0}`);
        console.log('');
      });

      // Check for duplicates
      const assignmentIds = allAssignments.map(a => a.assignmentId);
      const duplicates = assignmentIds.filter((id, index) => assignmentIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        console.log('⚠️ DUPLICATE ASSIGNMENT IDs FOUND:');
        console.log(`   ${[...new Set(duplicates)].join(', ')}\n`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkEmployee2Detailed();
