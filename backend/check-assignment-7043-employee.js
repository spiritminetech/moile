import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { 
  strict: false, 
  collection: 'workertaskassignments' 
});
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

async function checkAssignment7043() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'construction_erp'
    });

    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(80));
    console.log('🔍 CHECKING ASSIGNMENT 7043 - "Paint Interior Walls"');
    console.log('='.repeat(80));

    // Search for assignment with id 7043
    const assignment = await WorkerTaskAssignment.findOne({ id: 7043 }).lean();

    if (!assignment) {
      console.log('\n❌ Assignment 7043 NOT FOUND in database');
      console.log('\n💡 This confirms the mobile app is showing CACHED/STALE data');
      console.log('   The task "Paint Interior Walls" (ID: 7043) does not exist in the database.');
      console.log('\n✅ SOLUTION:');
      console.log('   1. Mobile app: Logout completely');
      console.log('   2. Close the app');
      console.log('   3. Reopen and login again');
      console.log('   4. This will clear all cached task data');
    } else {
      console.log('\n✅ Assignment 7043 FOUND in database\n');
      console.log('📋 Assignment Details:');
      console.log('   _id:', assignment._id);
      console.log('   id:', assignment.id);
      console.log('   taskId:', assignment.taskId);
      console.log('   taskName:', assignment.taskName);
      console.log('   employeeId:', assignment.employeeId);
      console.log('   projectId:', assignment.projectId);
      console.log('   status:', assignment.status);
      console.log('   date:', assignment.date);
      console.log('   sequence:', assignment.sequence);
      console.log('   supervisorId:', assignment.supervisorId || 'N/A');
      
      console.log('\n👤 EMPLOYEE INFORMATION:');
      console.log(`   This task is assigned to: Employee ID ${assignment.employeeId}`);
      
      if (assignment.employeeId === 2) {
        console.log('   Employee Name: Ravi Smith (your current login)');
      } else if (assignment.employeeId === 107) {
        console.log('   Employee Name: Different employee (not your current login)');
      } else {
        console.log(`   Employee Name: Unknown (ID: ${assignment.employeeId})`);
      }
    }

    // Also check all assignments to see what exists
    console.log('\n' + '='.repeat(80));
    console.log('📊 ALL ASSIGNMENTS IN DATABASE');
    console.log('='.repeat(80));

    const allAssignments = await WorkerTaskAssignment.find({}).lean();
    console.log(`\nTotal assignments: ${allAssignments.length}\n`);

    if (allAssignments.length > 0) {
      allAssignments.forEach((a, i) => {
        console.log(`${i + 1}. ${a.taskName || 'Unnamed'}`);
        console.log(`   ID: ${a.id || 'undefined'}, Employee: ${a.employeeId}, Status: ${a.status}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('💡 DIAGNOSIS');
    console.log('='.repeat(80));
    
    if (!assignment) {
      console.log('\n❌ MOBILE APP IS SHOWING OLD CACHED DATA');
      console.log('   Assignment 7043 does not exist in the database.');
      console.log('   The mobile app cached this data from a previous session.');
      console.log('\n✅ FIX:');
      console.log('   1. Logout from mobile app');
      console.log('   2. Force close the app (swipe away from recent apps)');
      console.log('   3. Reopen and login');
      console.log('   4. Pull to refresh on Today\'s Tasks screen');
    } else {
      console.log('\n✅ Assignment exists in database');
      console.log(`   Assigned to Employee ID: ${assignment.employeeId}`);
      console.log(`   Current status: ${assignment.status}`);
    }

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

checkAssignment7043();
