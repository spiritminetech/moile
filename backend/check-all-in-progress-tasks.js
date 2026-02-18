// Check ALL tasks with in_progress status
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

async function checkAllInProgressTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find ALL tasks with in_progress status
    const inProgressTasks = await WorkerTaskAssignment.find({ 
      status: 'in_progress' 
    }).sort({ startedAt: -1 });

    console.log('🔍 ALL TASKS WITH STATUS "in_progress":');
    console.log('='.repeat(80));
    
    if (inProgressTasks.length === 0) {
      console.log('✅ No tasks with "in_progress" status found');
      console.log('');
      console.log('This means either:');
      console.log('  1. The issue was already fixed');
      console.log('  2. The tasks are stored with different field names');
      console.log('  3. The mobile app is showing cached data');
    } else {
      console.log(`Found ${inProgressTasks.length} task(s) with "in_progress" status:\n`);
      
      inProgressTasks.forEach((task, index) => {
        console.log(`Task ${index + 1}:`);
        console.log(`  _id: ${task._id}`);
        console.log(`  id: ${task.id}`);
        console.log(`  assignmentId: ${task.assignmentId}`);
        console.log(`  taskName: ${task.taskName}`);
        console.log(`  status: ${task.status}`);
        console.log(`  employeeId: ${task.employeeId}`);
        console.log(`  startedAt: ${task.startedAt}`);
        console.log('');
      });

      // Group by employee
      const byEmployee = {};
      inProgressTasks.forEach(task => {
        const empId = task.employeeId;
        if (!byEmployee[empId]) {
          byEmployee[empId] = [];
        }
        byEmployee[empId].push(task);
      });

      console.log('='.repeat(80));
      console.log('📊 GROUPED BY EMPLOYEE:');
      console.log('='.repeat(80));
      
      Object.keys(byEmployee).forEach(empId => {
        const tasks = byEmployee[empId];
        console.log(`\nEmployee ID: ${empId}`);
        console.log(`  Active Tasks: ${tasks.length}`);
        
        if (tasks.length > 1) {
          console.log(`  ❌ PROBLEM: Multiple active tasks!`);
          tasks.forEach((task, idx) => {
            console.log(`     ${idx + 1}. ${task.taskName} (Assignment ${task.assignmentId || task.id})`);
          });
        } else {
          console.log(`  ✅ OK: Only one active task`);
        }
      });
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
  }
}

checkAllInProgressTasks();
