import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function checkEmployee2TodayTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📅 EMPLOYEE 2 TASK ASSIGNMENTS FOR TODAY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Date: ${todayStr}`);
    console.log(`Employee ID: 2`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Find all tasks for employee 2 today
    const todayTasks = await WorkerTaskAssignment.find({ 
      employeeId: 2,
      date: todayStr
    }).sort({ id: 1 });

    console.log(`📊 TOTAL TASKS FOUND: ${todayTasks.length}\n`);

    if (todayTasks.length === 0) {
      console.log('❌ No tasks assigned for today!');
      console.log('💡 Run add-two-new-tasks-today.js to create tasks.\n');
    } else {
      console.log('┌─────────────────────────────────────────────────────────┐');
      console.log('│                    TASK DETAILS                         │');
      console.log('└─────────────────────────────────────────────────────────┘\n');

      todayTasks.forEach((task, index) => {
        const statusEmoji = task.status === 'in_progress' ? '🟢' : 
                           task.status === 'paused' ? '🟠' : 
                           task.status === 'completed' ? '✅' : '🔵';
        const priorityEmoji = task.priority === 'high' ? '🔴' : 
                             task.priority === 'medium' ? '🟡' : '🟢';
        
        console.log(`${index + 1}. ${statusEmoji} ${priorityEmoji} ${task.taskName || 'Unnamed Task'}`);
        console.log('   ─────────────────────────────────────────────────────');
        console.log(`   📋 WorkerTaskAssignment ID: ${task.id}`);
        console.log(`   🎯 Task ID: ${task.taskId || 'NULL ⚠️'}`);
        console.log(`   🏗️  Project ID: ${task.projectId}`);
        console.log(`   📊 Status: ${task.status}`);
        console.log(`   ⚡ Priority: ${task.priority || 'N/A'}`);
        console.log(`   📅 Date: ${task.date}`);
        console.log(`   📝 Description: ${task.description || 'N/A'}`);
        console.log(`   🔧 Nature of Work: ${task.natureOfWork || 'N/A'}`);
        console.log('');
      });

      console.log('═══════════════════════════════════════════════════════════');
      console.log('📊 SUMMARY TABLE');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('Assignment ID | Task ID  | Project ID | Status       | Priority');
      console.log('─────────────────────────────────────────────────────────────');
      
      todayTasks.forEach(task => {
        const assignmentId = String(task.id).padEnd(13);
        const taskId = String(task.taskId || 'NULL').padEnd(8);
        const projectId = String(task.projectId).padEnd(10);
        const status = String(task.status).padEnd(12);
        const priority = String(task.priority || 'N/A').padEnd(8);
        console.log(`${assignmentId} | ${taskId} | ${projectId} | ${status} | ${priority}`);
      });
      
      console.log('═══════════════════════════════════════════════════════════\n');

      // Check for any issues
      const invalidTasks = todayTasks.filter(task => !task.taskId);
      if (invalidTasks.length > 0) {
        console.log('⚠️  WARNING: Found tasks with NULL taskId:');
        invalidTasks.forEach(task => {
          console.log(`   - Assignment ID ${task.id}: ProjectId ${task.projectId}`);
        });
        console.log('   💡 These tasks may cause issues. Consider deleting them.\n');
      }

      // Group by project
      const projectGroups = {};
      todayTasks.forEach(task => {
        if (!projectGroups[task.projectId]) {
          projectGroups[task.projectId] = [];
        }
        projectGroups[task.projectId].push(task);
      });

      console.log('📊 TASKS BY PROJECT:');
      console.log('═══════════════════════════════════════════════════════════');
      Object.keys(projectGroups).forEach(projectId => {
        const tasks = projectGroups[projectId];
        console.log(`\n🏗️  Project ID: ${projectId} (${tasks.length} task${tasks.length > 1 ? 's' : ''})`);
        tasks.forEach(task => {
          console.log(`   - Assignment ${task.id}: ${task.taskName || 'Unnamed'} (${task.status})`);
        });
      });
      console.log('\n═══════════════════════════════════════════════════════════');

      // Clock-in compatibility check
      console.log('\n🔐 CLOCK-IN COMPATIBILITY:');
      console.log('═══════════════════════════════════════════════════════════');
      const validTasks = todayTasks.filter(task => task.taskId);
      if (validTasks.length > 0) {
        console.log('✅ Clock-in will work for these projects:');
        const validProjects = [...new Set(validTasks.map(t => t.projectId))];
        validProjects.forEach(projectId => {
          const projectTasks = validTasks.filter(t => t.projectId === projectId);
          console.log(`   - Project ${projectId}: ${projectTasks.length} valid task${projectTasks.length > 1 ? 's' : ''}`);
        });
      } else {
        console.log('❌ No valid tasks for clock-in (all have NULL taskId)');
      }
      console.log('═══════════════════════════════════════════════════════════\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

checkEmployee2TodayTasks();
