// Check ALL tasks for Employee ID 2 (any date)
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkAllTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const assignmentsCollection = db.collection('workerTaskAssignment');

    // Get ALL tasks for Employee ID 2
    const tasks = await assignmentsCollection.find({
      employeeId: 2
    }).sort({ assignedDate: -1, sequence: 1 }).toArray();

    console.log(`\n📋 Found ${tasks.length} total tasks for Employee ID 2:\n`);

    if (tasks.length === 0) {
      console.log('❌ NO TASKS FOUND for Employee ID 2');
      console.log('\nThis is why the button is disabled!');
      console.log('\nSOLUTION: Run the task creation script again:');
      console.log('  node aggressive-clean-and-create.js');
      return;
    }

    // Group by date
    const tasksByDate = {};
    tasks.forEach(task => {
      const dateStr = task.assignedDate ? new Date(task.assignedDate).toISOString().split('T')[0] : 'No Date';
      if (!tasksByDate[dateStr]) {
        tasksByDate[dateStr] = [];
      }
      tasksByDate[dateStr].push(task);
    });

    Object.keys(tasksByDate).sort().reverse().forEach(dateStr => {
      console.log(`\n📅 Date: ${dateStr}`);
      console.log('─'.repeat(60));
      
      tasksByDate[dateStr].forEach((task, index) => {
        console.log(`\n${index + 1}. ${task.taskName}`);
        console.log(`   Assignment ID: ${task.assignmentId}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Sequence: ${task.sequence}`);
        console.log(`   Dependencies: ${task.dependencies && task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None'}`);
      });
    });

    console.log('\n\n🎯 CURRENT DATE CHECK:');
    console.log('─'.repeat(60));
    console.log(`Today should be: 2026-02-15`);
    
    const todayTasks = tasks.filter(t => {
      if (!t.assignedDate) return false;
      const taskDate = new Date(t.assignedDate).toISOString().split('T')[0];
      return taskDate === '2026-02-15';
    });
    
    console.log(`Tasks for 2026-02-15: ${todayTasks.length}`);
    
    if (todayTasks.length === 0) {
      console.log('\n❌ NO TASKS FOR TODAY (2026-02-15)');
      console.log('\nThis is why you see no tasks in the mobile app!');
      console.log('\nSOLUTION: Create tasks for today:');
      console.log('  node aggressive-clean-and-create.js');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkAllTasks();
