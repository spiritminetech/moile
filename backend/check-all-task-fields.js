// Check all task fields
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function checkAllTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all tasks for employee 107
    const tasks = await WorkerTaskAssignment.find({ employeeId: 107 }).sort({ _id: -1 });
    
    console.log(`📊 Total tasks: ${tasks.length}\n`);
    
    tasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.taskName || 'Unnamed'}`);
      console.log(`   _id: ${task._id}`);
      console.log(`   assignmentId: ${task.assignmentId}`);
      console.log(`   employeeId: ${task.employeeId}`);
      console.log(`   date: ${task.date}`);
      console.log(`   assignedDate: ${task.assignedDate}`);
      console.log(`   status: ${task.status}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkAllTasks();
