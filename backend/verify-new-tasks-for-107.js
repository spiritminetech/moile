// Verify new tasks for employee 107
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function verifyTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all tasks for employee 107
    const allTasks = await WorkerTaskAssignment.find({ employeeId: 107 }).sort({ assignmentId: -1 });
    
    console.log(`📊 Total tasks for employee 107: ${allTasks.length}\n`);
    
    allTasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.taskName || 'Unnamed Task'}`);
      console.log(`   Assignment ID: ${task.assignmentId}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Assigned Date: ${task.assignedDate}`);
      console.log(`   Created At: ${task.createdAt}`);
      console.log('---');
    });

    // Check today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`\n📅 Today's date (midnight): ${today.toISOString()}`);
    
    // Find tasks for today
    const todayTasks = await WorkerTaskAssignment.find({
      employeeId: 107,
      assignedDate: { $gte: today }
    }).sort({ assignmentId: -1 });
    
    console.log(`\n📊 Tasks assigned for today or later: ${todayTasks.length}`);
    todayTasks.forEach((task) => {
      console.log(`  - ${task.taskName} (ID: ${task.assignmentId})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

verifyTasks();
