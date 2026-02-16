// Quick check of tasks
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    const tasks = await db.collection('workerTaskAssignment').find({
      employeeId: 2
    }).toArray();

    console.log(`Found ${tasks.length} tasks for Employee ID: 2\n`);

    tasks.forEach(task => {
      console.log('─'.repeat(60));
      console.log('Task:', task.taskName);
      console.log('Assignment ID:', task.assignmentId);
      console.log('Assignment Date:', task.assignmentDate);
      console.log('Project ID:', task.projectId);
      console.log('Status:', task.status);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
  }
}

checkTasks();
