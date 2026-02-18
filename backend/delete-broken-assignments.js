import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function deleteBrokenAssignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = new Date().toISOString().split('T')[0];

    // Find all assignments with null taskId for Employee 2
    const brokenAssignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: today,
      taskId: null
    }).select('id taskId status priority');

    console.log(`🔍 Found ${brokenAssignments.length} broken assignments (taskId: null):\n`);
    
    if (brokenAssignments.length === 0) {
      console.log('✅ No broken assignments found. Database is clean!');
      return;
    }

    brokenAssignments.forEach(assignment => {
      console.log(`  ❌ Assignment ID: ${assignment.id}`);
      console.log(`     Task ID: ${assignment.taskId}`);
      console.log(`     Status: ${assignment.status}`);
      console.log(`     Priority: ${assignment.priority}\n`);
    });

    // Delete the broken assignments
    const result = await WorkerTaskAssignment.deleteMany({
      employeeId: 2,
      date: today,
      taskId: null
    });

    console.log('='.repeat(60));
    console.log(`✅ DELETED ${result.deletedCount} broken assignments`);
    console.log('='.repeat(60));

    // Verify remaining assignments
    const remainingAssignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: today
    }).select('id taskId status priority');

    console.log(`\n📋 Remaining assignments for Employee 2 on ${today}:`);
    console.log(`   Total: ${remainingAssignments.length}\n`);

    // Count by status
    const statusCounts = remainingAssignments.reduce((acc, assignment) => {
      acc[assignment.status] = (acc[assignment.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const emoji = status === 'in_progress' ? '🟢' : 
                   status === 'paused' ? '🟠' : 
                   status === 'completed' ? '✅' : '🔵';
      console.log(`   ${emoji} ${status}: ${count}`);
    });

    // Verify all have valid taskId
    const stillBroken = remainingAssignments.filter(a => !a.taskId);
    if (stillBroken.length > 0) {
      console.log(`\n⚠️ WARNING: ${stillBroken.length} assignments still have null taskId!`);
    } else {
      console.log('\n✅ All remaining assignments have valid taskId');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ CLEANUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('🔄 NEXT STEPS:');
    console.log('   1. Restart the backend server');
    console.log('   2. Clear mobile app cache completely');
    console.log('   3. Reopen mobile app and pull to refresh');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

deleteBrokenAssignments();
