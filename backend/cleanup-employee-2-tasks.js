import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function cleanupEmployee2Tasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Find all tasks for employee 2
    const allTasks = await WorkerTaskAssignment.find({ employeeId: 2 })
      .sort({ id: 1 });

    console.log('📋 ALL TASKS FOR EMPLOYEE 2:');
    console.log('==========================================');
    allTasks.forEach(task => {
      const statusEmoji = task.status === 'in_progress' ? '🟢' : 
                         task.status === 'paused' ? '🟠' : 
                         task.status === 'completed' ? '✅' : '🔵';
      const priorityEmoji = task.priority === 'high' ? '🔴' : 
                           task.priority === 'medium' ? '🟡' : '🟢';
      console.log(`${statusEmoji} ${priorityEmoji} Task ${task.id}: ${task.taskName || 'Unnamed'}`);
      console.log(`   Status: ${task.status} | Date: ${task.date} | ProjectId: ${task.projectId}`);
      console.log(`   TaskId: ${task.taskId || 'null'}\n`);
    });

    console.log(`\n📊 Total tasks found: ${allTasks.length}\n`);

    // Find tasks that are NOT completed
    const incompleteTasks = allTasks.filter(task => task.status !== 'completed');
    console.log(`📋 INCOMPLETE TASKS: ${incompleteTasks.length}`);
    incompleteTasks.forEach(task => {
      console.log(`   - Task ${task.id}: ${task.taskName || 'Unnamed'} (Status: ${task.status}, Date: ${task.date})`);
    });

    // Find tasks for today
    const todayTasks = allTasks.filter(task => task.date === todayStr);
    console.log(`\n📅 TASKS FOR TODAY (${todayStr}): ${todayTasks.length}`);
    todayTasks.forEach(task => {
      console.log(`   - Task ${task.id}: ${task.taskName || 'Unnamed'} (Status: ${task.status}, ProjectId: ${task.projectId})`);
    });

    // Ask user what to do
    console.log('\n🔧 CLEANUP OPTIONS:');
    console.log('==========================================');
    console.log('1. Keep only the 2 newest tasks (from add-two-tasks-employee-2.js)');
    console.log('2. Delete all incomplete tasks that are NOT for today');
    console.log('3. Delete ALL tasks and start fresh');
    console.log('4. Keep all tasks (no cleanup)');
    console.log('\n💡 RECOMMENDATION: Option 1 - Keep only the 2 newest tasks\n');

    // For now, let's identify which tasks to keep
    const sortedByIdDesc = [...allTasks].sort((a, b) => b.id - a.id);
    const twoNewestTasks = sortedByIdDesc.slice(0, 2);
    
    console.log('📌 TWO NEWEST TASKS (would be kept with Option 1):');
    twoNewestTasks.forEach(task => {
      console.log(`   ✅ Task ${task.id}: ${task.taskName || 'Unnamed'}`);
      console.log(`      Status: ${task.status} | Date: ${task.date} | ProjectId: ${task.projectId}`);
    });

    const tasksToDelete = allTasks.filter(task => 
      !twoNewestTasks.find(t => t.id === task.id)
    );

    if (tasksToDelete.length > 0) {
      console.log(`\n🗑️  TASKS THAT WOULD BE DELETED (${tasksToDelete.length}):`);
      tasksToDelete.forEach(task => {
        console.log(`   ❌ Task ${task.id}: ${task.taskName || 'Unnamed'}`);
        console.log(`      Status: ${task.status} | Date: ${task.date} | ProjectId: ${task.projectId}`);
      });

      console.log('\n⚠️  TO PERFORM CLEANUP, uncomment the deletion code below and run again.');
      console.log('⚠️  This is a DRY RUN - no changes were made.\n');

      // UNCOMMENT THE LINES BELOW TO ACTUALLY DELETE THE TASKS
      /*
      console.log('\n🔄 Deleting old tasks...');
      for (const task of tasksToDelete) {
        await WorkerTaskAssignment.deleteOne({ id: task.id });
        console.log(`   ✅ Deleted Task ${task.id}`);
      }
      console.log('\n✅ CLEANUP COMPLETE!');
      
      // Verify remaining tasks
      const remainingTasks = await WorkerTaskAssignment.find({ employeeId: 2 })
        .sort({ id: 1 });
      console.log(`\n📋 REMAINING TASKS: ${remainingTasks.length}`);
      remainingTasks.forEach(task => {
        console.log(`   ✅ Task ${task.id}: ${task.taskName || 'Unnamed'}`);
      });
      */
    } else {
      console.log('\n✅ No tasks to delete. Employee 2 has only 2 tasks.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

cleanupEmployee2Tasks();
