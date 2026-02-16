import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkAndStartTask() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const assignmentsCollection = db.collection('workerTaskAssignment');
    const tasksCollection = db.collection('tasks');

    // Check current assignments for employee 2 on 2026-02-15
    console.log('📊 Current Task Assignments for Employee 2 (2026-02-15):\n');
    
    const assignments = await assignmentsCollection.find({
      employeeId: 2,
      date: '2026-02-15'
    }).sort({ id: 1 }).toArray();

    if (assignments.length === 0) {
      console.log('   ❌ No assignments found!');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`   Found ${assignments.length} assignments:\n`);

    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];
      const task = await tasksCollection.findOne({ id: assignment.taskId });
      
      console.log(`   ${i + 1}. ${task?.taskName || 'Unnamed'}`);
      console.log(`      Assignment ID: ${assignment.id}`);
      console.log(`      Task ID: ${assignment.taskId}`);
      console.log(`      Status: ${assignment.status}`);
      console.log(`      Project ID: ${assignment.projectId}`);
      console.log(`      Supervisor ID: ${assignment.supervisorId}`);
      
      if (assignment.startTime) {
        console.log(`      Started: ${assignment.startTime}`);
      }
      if (assignment.endTime) {
        console.log(`      Ended: ${assignment.endTime}`);
      }
      console.log('');
    }

    // Ask which task to start
    console.log('='.repeat(60));
    console.log('\n💡 To start a task, you can:');
    console.log('\n1. Start first queued task:');
    console.log('   node backend/start-first-queued-task.js');
    console.log('\n2. Start specific task by assignment ID:');
    console.log('   node backend/start-task-by-id.js <assignmentId>');
    console.log('\n3. View task details:');
    console.log('   Assignment IDs:', assignments.map(a => a.id).join(', '));

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkAndStartTask();
