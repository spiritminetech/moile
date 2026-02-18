import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { 
  strict: false, 
  collection: 'workerTaskAssignment'
});

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

async function debugAssignmentIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const today = "2026-02-16";
    const assignments = await WorkerTaskAssignment.find({
      projectId: 1002,
      date: today
    });
    
    console.log(`Found ${assignments.length} assignments\n`);
    
    assignments.forEach((assignment, index) => {
      console.log(`Assignment #${index + 1}:`);
      console.log(`  _id (MongoDB): ${assignment._id}`);
      console.log(`  id (numeric): ${assignment.id}`);
      console.log(`  typeof id: ${typeof assignment.id}`);
      console.log(`  employeeId: ${assignment.employeeId}`);
      console.log(`  taskId: ${assignment.taskId}`);
      console.log('');
    });
    
    // Test the map
    console.log('Testing .map(a => a.id):');
    const ids = assignments.map(a => a.id);
    console.log(`  Result: [${ids.join(', ')}]`);
    console.log(`  Types: [${ids.map(id => typeof id).join(', ')}]`);
    console.log('');
    
    // Now test if these IDs match progress records
    const WorkerTaskProgressSchema = new mongoose.Schema({}, { 
      strict: false, 
      collection: 'workerTaskProgress'
    });
    const WorkerTaskProgress = mongoose.model('WorkerTaskProgress', WorkerTaskProgressSchema);
    
    console.log('Testing progress query with these IDs:');
    const progresses = await WorkerTaskProgress.find({
      workerTaskAssignmentId: { $in: ids }
    });
    
    console.log(`  Found ${progresses.length} progress records`);
    
    if (progresses.length > 0) {
      console.log('\n✅ Progress records found!');
      progresses.forEach(p => {
        console.log(`  - Progress ${p.id}: assignmentId=${p.workerTaskAssignmentId}, status=${p.status}`);
      });
    } else {
      console.log('\n❌ No progress records found');
      console.log('\nChecking what workerTaskAssignmentId values exist:');
      const allProgress = await WorkerTaskProgress.find({}).limit(10);
      allProgress.forEach(p => {
        console.log(`  - Progress ${p.id}: workerTaskAssignmentId=${p.workerTaskAssignmentId} (type: ${typeof p.workerTaskAssignmentId})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

debugAssignmentIds();
