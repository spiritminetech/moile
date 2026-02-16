import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { 
  strict: false, 
  collection: 'workertaskassignments' 
});
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

async function checkTodaysAssignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'construction_erp'
    });

    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(80));
    console.log('📋 CHECKING ALL WORKERTASKASSIGNMENTS IN DATABASE');
    console.log('='.repeat(80));

    // Get ALL assignments (no filters)
    const allAssignments = await WorkerTaskAssignment.find({}).lean();
    
    console.log(`\n📊 Total assignments in database: ${allAssignments.length}\n`);

    if (allAssignments.length === 0) {
      console.log('❌ NO ASSIGNMENTS FOUND IN DATABASE!');
      console.log('   This explains why backend might be serving cached data.\n');
    } else {
      console.log('📝 Assignment Details:\n');
      allAssignments.forEach((assignment, index) => {
        console.log(`${index + 1}. Assignment Details:`);
        console.log(`   _id: ${assignment._id}`);
        console.log(`   id: ${assignment.id || 'UNDEFINED'}`);
        console.log(`   taskId: ${assignment.taskId || 'UNDEFINED'}`);
        console.log(`   taskName: ${assignment.taskName || 'N/A'}`);
        console.log(`   employeeId: ${assignment.employeeId || 'UNDEFINED'}`);
        console.log(`   projectId: ${assignment.projectId || 'UNDEFINED'}`);
        console.log(`   status: ${assignment.status || 'N/A'}`);
        console.log(`   date: ${assignment.date || 'N/A'}`);
        console.log(`   sequence: ${assignment.sequence || 'N/A'}`);
        console.log(`   supervisorId: ${assignment.supervisorId || 'N/A'}`);
        console.log('');
      });

      // Check for in_progress tasks
      const inProgressTasks = allAssignments.filter(a => a.status === 'in_progress');
      console.log(`\n🔍 Tasks with status 'in_progress': ${inProgressTasks.length}`);
      if (inProgressTasks.length > 0) {
        inProgressTasks.forEach((task, i) => {
          console.log(`   ${i+1}. ID: ${task.id}, TaskName: ${task.taskName}, EmployeeId: ${task.employeeId}`);
        });
      }

      // Check for tasks with undefined IDs
      const undefinedIdTasks = allAssignments.filter(a => !a.id || a.id === undefined);
      console.log(`\n⚠️  Tasks with undefined 'id' field: ${undefinedIdTasks.length}`);
      if (undefinedIdTasks.length > 0) {
        undefinedIdTasks.forEach((task, i) => {
          console.log(`   ${i+1}. _id: ${task._id}, TaskName: ${task.taskName}, Status: ${task.status}`);
        });
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('🔍 CHECKING FOR EMPLOYEE ID 107 SPECIFICALLY');
    console.log('='.repeat(80));

    const employee107Tasks = await WorkerTaskAssignment.find({ 
      employeeId: 107 
    }).lean();

    console.log(`\n📊 Tasks for Employee 107: ${employee107Tasks.length}\n`);
    
    if (employee107Tasks.length > 0) {
      employee107Tasks.forEach((task, i) => {
        console.log(`${i+1}. ${task.taskName || 'Unnamed'}`);
        console.log(`   ID: ${task.id}, Status: ${task.status}, Date: ${task.date}`);
        console.log('');
      });
    } else {
      console.log('❌ NO TASKS FOUND FOR EMPLOYEE 107');
    }

    console.log('\n' + '='.repeat(80));
    console.log('💡 DIAGNOSIS');
    console.log('='.repeat(80));
    
    const inProgressTasks = allAssignments.filter(a => a.status === 'in_progress');
    const undefinedIdTasks = allAssignments.filter(a => !a.id || a.id === undefined);
    
    if (allAssignments.length === 0) {
      console.log('\n❌ DATABASE IS EMPTY');
      console.log('   The backend is likely serving cached responses from memory.');
      console.log('   This happens when:');
      console.log('   1. Backend loaded data into memory when it started');
      console.log('   2. Database was cleared/modified');
      console.log('   3. Backend was not restarted properly');
      console.log('\n✅ SOLUTION:');
      console.log('   1. HARD STOP the backend (Ctrl+C or kill process)');
      console.log('   2. Wait 5 seconds');
      console.log('   3. Start backend again: npm start');
      console.log('   4. Mobile app: Pull to refresh on Today\'s Tasks screen');
    } else if (inProgressTasks.length > 1) {
      console.log('\n⚠️  MULTIPLE IN-PROGRESS TASKS FOUND IN DATABASE');
      console.log('   This violates the "one active task" rule.');
      console.log('   Run: node backend/fix-multiple-active-tasks.js');
    } else if (undefinedIdTasks.length > 0) {
      console.log('\n⚠️  TASKS WITH UNDEFINED IDs FOUND');
      console.log('   These tasks have invalid data and should be cleaned up.');
    } else {
      console.log('\n✅ DATABASE LOOKS CLEAN');
      console.log('   If mobile app still shows wrong data:');
      console.log('   1. Restart backend completely');
      console.log('   2. Clear mobile app cache (logout/login)');
      console.log('   3. Pull to refresh on Today\'s Tasks screen');
    }

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

checkTodaysAssignments();
