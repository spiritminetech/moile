// Check which tasks are currently active
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/constructionERP';

async function checkActiveTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the employee
    const employee = await Employee.findOne({ 
      email: 'worker.gmail@example.com' 
    });

    if (!employee) {
      console.log('❌ Employee not found');
      return;
    }

    console.log('📋 Employee:', employee.fullName, '(ID:', employee.id, ')');

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Find ALL tasks for today
    const allTasks = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    }).sort({ sequence: 1 });

    console.log('\n📊 ALL TASKS FOR TODAY:', allTasks.length);
    console.log('='.repeat(80));
    
    allTasks.forEach((task, index) => {
      const statusIcon = task.status === 'in_progress' ? '▶️' : 
                        task.status === 'queued' ? '⏸️' : 
                        task.status === 'completed' ? '✅' : '⏹️';
      
      console.log(`${index + 1}. ${statusIcon} ${task.taskName}`);
      console.log(`   ID: ${task.id}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Sequence: ${task.sequence}`);
      if (task.startTime) {
        console.log(`   Started: ${task.startTime.toLocaleString()}`);
      }
      console.log('');
    });

    // Count by status
    const statusCounts = {
      pending: allTasks.filter(t => t.status === 'pending').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      queued: allTasks.filter(t => t.status === 'queued').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      blocked: allTasks.filter(t => t.status === 'blocked').length,
      cancelled: allTasks.filter(t => t.status === 'cancelled').length,
    };

    console.log('📈 STATUS SUMMARY:');
    console.log('='.repeat(80));
    Object.entries(statusCounts).forEach(([status, count]) => {
      if (count > 0) {
        console.log(`   ${status}: ${count}`);
      }
    });

    // Check for multiple in_progress tasks
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress');
    
    if (inProgressTasks.length > 1) {
      console.log('\n⚠️ WARNING: Multiple tasks in progress!');
      console.log('   This violates the "only one task active" rule');
      console.log('   Tasks:');
      inProgressTasks.forEach(t => {
        console.log(`   - ${t.taskName} (ID: ${t.id})`);
      });
    } else if (inProgressTasks.length === 1) {
      console.log('\n✅ Correct: Only one task in progress');
      console.log(`   Active task: ${inProgressTasks[0].taskName} (ID: ${inProgressTasks[0].id})`);
    } else {
      console.log('\n✅ No tasks currently in progress');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkActiveTasks();
