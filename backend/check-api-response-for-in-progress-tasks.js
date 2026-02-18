// Check what the getTodaysTasks API actually returns
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

async function checkAPIResponse() {
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

    console.log('👤 Checking API response for Employee ID:', employee.id);
    console.log('');

    // Get today's date range (same logic as API)
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    console.log('📅 Date Range (same as API):');
    console.log(`  Start: ${startOfToday.toISOString()}`);
    console.log(`  End: ${endOfToday.toISOString()}`);
    console.log('');

    // Query exactly like the API does
    const tasks = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: { $gte: startOfToday, $lt: endOfToday }
    }).sort({ sequence: 1 });

    console.log('📋 API WOULD RETURN:');
    console.log('='.repeat(80));
    console.log(`Total Tasks: ${tasks.length}`);
    console.log('');

    if (tasks.length === 0) {
      console.log('❌ No tasks found for today');
      console.log('');
      console.log('This means the API returns empty array.');
      console.log('But your mobile app shows 10 tasks!');
      console.log('');
      console.log('💡 CONCLUSION: Mobile app is showing CACHED data');
    } else {
      // Count by status
      const statusCounts = {
        pending: 0,
        in_progress: 0,
        paused: 0,
        completed: 0
      };

      const inProgressTasks = [];

      tasks.forEach(task => {
        const status = task.status;
        if (statusCounts[status] !== undefined) {
          statusCounts[status]++;
        }
        
        if (status === 'in_progress') {
          inProgressTasks.push(task);
        }
      });

      console.log('📊 STATUS BREAKDOWN:');
      console.log(`  Pending: ${statusCounts.pending}`);
      console.log(`  In Progress: ${statusCounts.in_progress} ${statusCounts.in_progress > 1 ? '❌ PROBLEM!' : statusCounts.in_progress === 1 ? '✅' : ''}`);
      console.log(`  Paused: ${statusCounts.paused}`);
      console.log(`  Completed: ${statusCounts.completed}`);
      console.log('');

      if (inProgressTasks.length > 0) {
        console.log('🔴 TASKS WITH "in_progress" STATUS:');
        console.log('='.repeat(80));
        inProgressTasks.forEach((task, index) => {
          console.log(`\nTask ${index + 1}:`);
          console.log(`  Assignment ID: ${task.assignmentId || task.id}`);
          console.log(`  Task Name: ${task.taskName}`);
          console.log(`  Status: ${task.status}`);
          console.log(`  Started At: ${task.startedAt}`);
          console.log(`  Employee ID: ${task.employeeId}`);
        });
        console.log('='.repeat(80));
        console.log('');

        if (inProgressTasks.length > 1) {
          console.log('❌ PROBLEM CONFIRMED IN DATABASE!');
          console.log('');
          console.log('The database DOES have multiple "in_progress" tasks.');
          console.log('The earlier check might have looked at wrong employee ID.');
          console.log('');
          console.log('🔧 FIX: Run the fix script to pause older tasks');
        }
      } else {
        console.log('✅ No "in_progress" tasks in database');
        console.log('');
        console.log('But mobile app shows 2 "Continue Working" buttons!');
        console.log('');
        console.log('💡 CONCLUSION: Mobile app cache issue');
      }
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('RECOMMENDATION:');
    console.log('='.repeat(80));
    if (tasks.length === 0) {
      console.log('1. Mobile app is showing cached data');
      console.log('2. Clear app cache or pull to refresh');
      console.log('3. If that doesn\'t work, check if API endpoint is correct');
    } else {
      const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
      if (inProgressCount > 1) {
        console.log('1. Database has multiple "in_progress" tasks');
        console.log('2. Run: node backend/fix-multiple-active-tasks.js');
        console.log('3. Then restart backend server');
        console.log('4. Then refresh mobile app');
      } else if (inProgressCount === 0) {
        console.log('1. Database is clean');
        console.log('2. Mobile app showing cached data');
        console.log('3. Pull to refresh in mobile app');
      } else {
        console.log('1. Database has exactly ONE "in_progress" task (correct)');
        console.log('2. Mobile app might be showing old cached data');
        console.log('3. Pull to refresh in mobile app');
      }
    }
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
  }
}

checkAPIResponse();
