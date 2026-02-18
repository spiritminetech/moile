// Diagnose why multiple "Continue Working" buttons appear
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Import models
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));

async function diagnoseIssue() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the worker user
    const workerUser = await User.findOne({ email: 'worker@gmail.com' });
    if (!workerUser) {
      console.log('❌ Worker user not found');
      return;
    }

    const employee = await Employee.findOne({ id: workerUser.employeeId });
    if (!employee) {
      console.log('❌ Employee not found');
      return;
    }

    console.log('👤 Testing for Employee ID:', employee.id);
    console.log('');

    // Get today's date range
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    console.log('📅 Date Range:');
    console.log(`  Start: ${startOfToday.toISOString()}`);
    console.log(`  End: ${endOfToday.toISOString()}`);
    console.log('');

    // Find today's tasks
    const todaysTasks = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: { $gte: startOfToday, $lt: endOfToday }
    }).sort({ sequence: 1 });

    console.log('📋 TODAY\'S TASKS:');
    console.log('='.repeat(80));
    
    if (todaysTasks.length === 0) {
      console.log('❌ No tasks found for today');
      console.log('');
      console.log('💡 This might be why you see the issue:');
      console.log('   - Tasks might be assigned for a different date');
      console.log('   - Or tasks might be using a different employeeId');
      console.log('');
      
      // Check for ANY tasks for this employee
      const anyTasks = await WorkerTaskAssignment.find({ 
        employeeId: employee.id 
      }).sort({ date: -1 }).limit(10);
      
      if (anyTasks.length > 0) {
        console.log('📋 RECENT TASKS (any date):');
        console.log('='.repeat(80));
        anyTasks.forEach((task, index) => {
          console.log(`\nTask ${index + 1}:`);
          console.log(`  Assignment ID: ${task.id}`);
          console.log(`  Task Name: ${task.taskName}`);
          console.log(`  Status: ${task.status}`);
          console.log(`  Date: ${task.date}`);
          console.log(`  Sequence: ${task.sequence}`);
        });
      }
    } else {
      todaysTasks.forEach((task, index) => {
        console.log(`\nTask ${index + 1}:`);
        console.log(`  Assignment ID: ${task.id}`);
        console.log(`  Task Name: ${task.taskName}`);
        console.log(`  Status: ${task.status} ${task.status === 'in_progress' ? '🔴 ACTIVE' : ''}`);
        console.log(`  Sequence: ${task.sequence}`);
        console.log(`  Start Time: ${task.startTime || 'Not started'}`);
        console.log(`  Pause Time: ${task.pauseTime || 'Not paused'}`);
      });
      console.log('='.repeat(80));
      console.log('');

      // Count by status
      const statusCounts = {
        pending: todaysTasks.filter(t => t.status === 'pending').length,
        in_progress: todaysTasks.filter(t => t.status === 'in_progress').length,
        paused: todaysTasks.filter(t => t.status === 'paused').length,
        completed: todaysTasks.filter(t => t.status === 'completed').length
      };

      console.log('📊 STATUS BREAKDOWN:');
      console.log('='.repeat(80));
      console.log(`  Pending: ${statusCounts.pending}`);
      console.log(`  In Progress: ${statusCounts.in_progress} ${statusCounts.in_progress > 1 ? '❌ PROBLEM!' : statusCounts.in_progress === 1 ? '✅' : ''}`);
      console.log(`  Paused: ${statusCounts.paused}`);
      console.log(`  Completed: ${statusCounts.completed}`);
      console.log('='.repeat(80));
      console.log('');

      if (statusCounts.in_progress > 1) {
        console.log('🔴 PROBLEM IDENTIFIED:');
        console.log('='.repeat(80));
        console.log(`❌ ${statusCounts.in_progress} tasks have status "in_progress"`);
        console.log('   Only ONE task should be active at a time!');
        console.log('');
        console.log('🔧 ROOT CAUSE:');
        console.log('   The backend validation is working, but somehow multiple tasks');
        console.log('   ended up with "in_progress" status. This could happen if:');
        console.log('   1. Tasks were manually updated in database');
        console.log('   2. A race condition occurred');
        console.log('   3. The pause logic didn\'t execute properly');
        console.log('='.repeat(80));
        console.log('');
      }
    }

    // Check the TaskCard logic
    console.log('🎨 FRONTEND BUTTON LOGIC:');
    console.log('='.repeat(80));
    console.log('The TaskCard shows "Continue Working" button when:');
    console.log('  - task.status === "in_progress" OR');
    console.log('  - task.status === "paused"');
    console.log('');
    console.log('If you see TWO "Continue Working" buttons, it means:');
    console.log('  - TWO tasks have status "in_progress" OR "paused"');
    console.log('='.repeat(80));
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

diagnoseIssue();
