import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignmentSchema = new mongoose.Schema({
  id: Number,
  employeeId: Number,
  projectId: Number,
  taskId: Number,
  date: Date,
  status: String,
  priority: String,
  sequence: Number,
  dailyTarget: Object,
  timeEstimate: Object
}, { collection: 'workertaskassignments' });

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

async function checkAssignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const assignments = await WorkerTaskAssignment.find().limit(5).sort({ id: -1 });
    
    console.log(`📋 Found ${assignments.length} recent assignments:\n`);
    
    assignments.forEach(a => {
      console.log(`ID: ${a.id}`);
      console.log(`  Employee: ${a.employeeId}`);
      console.log(`  Project: ${a.projectId}`);
      console.log(`  Task: ${a.taskId}`);
      console.log(`  Date: ${a.date}`);
      console.log(`  Status: ${a.status}`);
      console.log(`  Priority: ${a.priority || 'not set'}`);
      console.log(`  Daily Target: ${a.dailyTarget ? JSON.stringify(a.dailyTarget) : 'not set'}`);
      console.log('');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAssignments();
