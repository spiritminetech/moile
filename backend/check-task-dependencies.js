// Check task dependencies for Employee ID 2
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkTaskDependencies() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const assignmentsCollection = db.collection('workerTaskAssignment');

    // Get all tasks for Employee ID 2 on today's date
    const today = new Date('2026-02-15');
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const tasks = await assignmentsCollection.find({
      employeeId: 2,
      assignedDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ sequence: 1 }).toArray();

    console.log(`\n📋 Found ${tasks.length} tasks for Employee ID 2 on 2026-02-15:\n`);

    tasks.forEach((task, index) => {
      console.log(`\n${index + 1}. Task: ${task.taskName}`);
      console.log(`   Assignment ID: ${task.assignmentId}`);
      console.log(`   Task ID: ${task.taskId}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Sequence: ${task.sequence}`);
      console.log(`   Dependencies: ${task.dependencies && task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None'}`);
      
      // Check if dependencies are met
      if (task.dependencies && task.dependencies.length > 0) {
        console.log(`\n   🔍 Checking dependencies:`);
        task.dependencies.forEach(depId => {
          const depTask = tasks.find(t => t.assignmentId === depId);
          if (depTask) {
            const isMet = depTask.status === 'completed';
            console.log(`      - Task #${depId} (${depTask.taskName}): ${depTask.status} ${isMet ? '✅' : '❌'}`);
          } else {
            console.log(`      - Task #${depId}: NOT FOUND ❌`);
          }
        });
        
        const allDependenciesMet = task.dependencies.every(depId => {
          const depTask = tasks.find(t => t.assignmentId === depId);
          return depTask && depTask.status === 'completed';
        });
        
        console.log(`   Can Start: ${allDependenciesMet ? '✅ YES' : '❌ NO (dependencies not met)'}`);
      } else {
        console.log(`   Can Start: ✅ YES (no dependencies)`);
      }
    });

    console.log('\n\n📊 SUMMARY:');
    console.log('─'.repeat(60));
    
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    
    console.log(`Total Tasks: ${tasks.length}`);
    console.log(`Pending: ${pendingTasks.length}`);
    console.log(`In Progress: ${inProgressTasks.length}`);
    console.log(`Completed: ${completedTasks.length}`);
    
    console.log('\n🎯 TASKS THAT CAN BE STARTED:');
    console.log('─'.repeat(60));
    
    const startableTasks = tasks.filter(task => {
      if (task.status !== 'pending') return false;
      if (!task.dependencies || task.dependencies.length === 0) return true;
      
      return task.dependencies.every(depId => {
        const depTask = tasks.find(t => t.assignmentId === depId);
        return depTask && depTask.status === 'completed';
      });
    });
    
    if (startableTasks.length > 0) {
      startableTasks.forEach(task => {
        console.log(`✅ ${task.taskName} (Assignment ID: ${task.assignmentId})`);
      });
    } else {
      console.log('❌ NO TASKS CAN BE STARTED');
      console.log('\nREASON: All pending tasks have unmet dependencies');
      console.log('\nTO FIX: Complete the dependency tasks first, or remove dependencies');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkTaskDependencies();
