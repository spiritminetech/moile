import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function startFirstTask() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const assignmentsCollection = db.collection('workerTaskAssignment');
    const tasksCollection = db.collection('tasks');

    // Find first queued task
    console.log('🔍 Finding first queued task...\n');
    
    const firstQueuedTask = await assignmentsCollection.findOne({
      employeeId: 2,
      date: '2026-02-15',
      status: 'queued'
    }, { sort: { id: 1 } });

    if (!firstQueuedTask) {
      console.log('   ❌ No queued tasks found!');
      await mongoose.connection.close();
      process.exit(0);
    }

    const task = await tasksCollection.findOne({ id: firstQueuedTask.taskId });
    
    console.log('📋 Task to start:');
    console.log(`   Name: ${task?.taskName || 'Unnamed'}`);
    console.log(`   Assignment ID: ${firstQueuedTask.id}`);
    console.log(`   Task ID: ${firstQueuedTask.taskId}`);
    console.log(`   Current Status: ${firstQueuedTask.status}\n`);

    // Update status to in_progress
    const now = new Date();
    const updateResult = await assignmentsCollection.updateOne(
      { id: firstQueuedTask.id },
      {
        $set: {
          status: 'in_progress',
          startTime: now,
          updatedAt: now
        }
      }
    );

    if (updateResult.modifiedCount > 0) {
      console.log('✅ Task started successfully!\n');
      console.log('   Status: queued → in_progress');
      console.log(`   Start Time: ${now.toLocaleString()}\n`);

      // Verify the update
      const updatedTask = await assignmentsCollection.findOne({ id: firstQueuedTask.id });
      console.log('📊 Updated task details:');
      console.log(`   Status: ${updatedTask.status}`);
      console.log(`   Start Time: ${updatedTask.startTime}`);
      console.log(`   Updated At: ${updatedTask.updatedAt}\n`);

      // Show all tasks status
      console.log('📋 All tasks status:');
      const allTasks = await assignmentsCollection.find({
        employeeId: 2,
        date: '2026-02-15'
      }).sort({ id: 1 }).toArray();

      for (let i = 0; i < allTasks.length; i++) {
        const assignment = allTasks[i];
        const taskDoc = await tasksCollection.findOne({ id: assignment.taskId });
        const statusIcon = assignment.status === 'in_progress' ? '▶️' : 
                          assignment.status === 'completed' ? '✅' : '⏸️';
        console.log(`   ${statusIcon} ${taskDoc?.taskName || 'Unnamed'} (${assignment.status})`);
      }

      console.log('\n🎉 Done! Restart backend and check mobile app.');
    } else {
      console.log('❌ Failed to update task status');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

startFirstTask();
