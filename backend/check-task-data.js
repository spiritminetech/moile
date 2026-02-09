import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './src/modules/task/Task.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkTaskData = async () => {
  try {
    console.log('\n📋 Checking Task Data...\n');

    // Get all tasks
    const tasks = await Task.find().sort({ id: 1 }).lean();
    console.log(`Total tasks in database: ${tasks.length}\n`);

    if (tasks.length > 0) {
      console.log('Sample tasks:');
      tasks.slice(0, 10).forEach(task => {
        console.log(`  ID: ${task.id}, Name: ${task.taskName}, Project: ${task.projectId}`);
      });

      console.log('\nTask ID range:');
      const taskIds = tasks.map(t => t.id);
      console.log(`  Min: ${Math.min(...taskIds)}`);
      console.log(`  Max: ${Math.max(...taskIds)}`);
    }

    // Get sample assignments
    console.log('\n📋 Checking Task Assignments...\n');
    const assignments = await WorkerTaskAssignment.find().limit(10).lean();
    console.log(`Sample assignments: ${assignments.length}\n`);

    if (assignments.length > 0) {
      console.log('Task IDs referenced in assignments:');
      const assignmentTaskIds = [...new Set(assignments.map(a => a.taskId))];
      assignmentTaskIds.forEach(taskId => {
        const taskExists = tasks.some(t => t.id === taskId);
        console.log(`  Task ID ${taskId}: ${taskExists ? '✅ Exists' : '❌ Missing'}`);
      });
    }

    // Check if there's a mismatch
    const assignmentTaskIds = [...new Set(assignments.map(a => a.taskId))];
    const existingTaskIds = new Set(tasks.map(t => t.id));
    const missingTaskIds = assignmentTaskIds.filter(id => !existingTaskIds.has(id));

    if (missingTaskIds.length > 0) {
      console.log('\n⚠️  Missing Tasks:');
      console.log(`   ${missingTaskIds.length} task IDs are referenced in assignments but don\'t exist in Task collection`);
      console.log('   Missing IDs:', missingTaskIds.slice(0, 20));
      console.log('\n💡 Solution: Create these tasks or update assignments to reference existing tasks');
    } else {
      console.log('\n✅ All assignment task IDs exist in Task collection');
    }

  } catch (error) {
    console.error('❌ Error checking task data:', error);
  }
};

const main = async () => {
  await connectDB();
  await checkTaskData();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script execution error:', error);
  process.exit(1);
});
