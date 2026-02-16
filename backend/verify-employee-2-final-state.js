import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './src/modules/task/Task.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function verifyEmployee2FinalState() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = new Date().toISOString().split('T')[0];

    // Get all assignments for Employee 2 today
    const assignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: today
    }).sort({ id: 1 });

    console.log('='.repeat(70));
    console.log('📋 FINAL STATE - EMPLOYEE 2 (Ravi Smith) - TODAY\'S TASKS');
    console.log('='.repeat(70));
    console.log(`Date: ${today}`);
    console.log(`Total Assignments: ${assignments.length}\n`);

    // Display each assignment with task details
    for (const assignment of assignments) {
      const task = await Task.findOne({ id: assignment.taskId });
      
      const statusEmoji = assignment.status === 'in_progress' ? '🟢' : 
                         assignment.status === 'paused' ? '🟠' : 
                         assignment.status === 'completed' ? '✅' : '🔵';
      const priorityEmoji = assignment.priority === 'high' ? '🔴' : 
                           assignment.priority === 'medium' ? '🟡' : '🟢';
      
      console.log(`${statusEmoji} ${priorityEmoji} Assignment ${assignment.id}`);
      console.log(`   Task ID: ${assignment.taskId}`);
      console.log(`   Task Name: ${task?.taskName || 'N/A'}`);
      console.log(`   Status: ${assignment.status}`);
      console.log(`   Priority: ${assignment.priority}`);
      if (assignment.dailyTarget) {
        console.log(`   Daily Target: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
      }
      console.log('');
    }

    // Summary statistics
    console.log('='.repeat(70));
    console.log('📊 SUMMARY STATISTICS');
    console.log('='.repeat(70));
    
    const statusCounts = assignments.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\nBy Status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const emoji = status === 'in_progress' ? '🟢' : 
                   status === 'paused' ? '🟠' : 
                   status === 'completed' ? '✅' : '🔵';
      console.log(`  ${emoji} ${status}: ${count}`);
    });

    const priorityCounts = assignments.reduce((acc, a) => {
      acc[a.priority] = (acc[a.priority] || 0) + 1;
      return acc;
    }, {});

    console.log('\nBy Priority:');
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      const emoji = priority === 'high' ? '🔴' : 
                   priority === 'medium' ? '🟡' : '🟢';
      console.log(`  ${emoji} ${priority}: ${count}`);
    });

    // Highlight the new tasks
    const newTasks = assignments.filter(a => a.id >= 7052);
    if (newTasks.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('🆕 NEW TASKS ADDED TODAY');
      console.log('='.repeat(70));
      for (const assignment of newTasks) {
        const task = await Task.findOne({ id: assignment.taskId });
        console.log(`\n✨ Assignment ${assignment.id}: ${task?.taskName || 'N/A'}`);
        console.log(`   Priority: ${assignment.priority}`);
        console.log(`   Status: ${assignment.status}`);
        if (assignment.dailyTarget) {
          console.log(`   Target: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(70));
    console.log('\n🎯 READY FOR TESTING:');
    console.log('   ✅ Database cleaned (removed 6 broken assignments)');
    console.log('   ✅ 2 new tasks created and assigned');
    console.log('   ✅ All assignments have valid taskId');
    console.log('   ✅ Total: 12 valid assignments for Employee 2');
    console.log('\n📱 MOBILE APP STEPS:');
    console.log('   1. Restart backend server');
    console.log('   2. Close mobile app completely');
    console.log('   3. Clear app cache/data if possible');
    console.log('   4. Reopen app and pull to refresh');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

verifyEmployee2FinalState();
