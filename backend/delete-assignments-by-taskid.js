import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function deleteAssignmentsByTaskId() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workerTaskAssignment' }));

    // Find assignments with the old taskIds
    console.log('🔍 Finding assignments with taskId: 84394, 84395, 3...');
    const oldAssignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      taskId: { $in: [84394, 84395, 3] }
    }).lean();
    
    console.log(`   Found ${oldAssignments.length} assignments\n`);
    oldAssignments.forEach(assignment => {
      console.log(`   - Assignment ID: ${assignment.id}, TaskID: ${assignment.taskId}, Date: ${assignment.date}, Status: ${assignment.status}`);
    });

    if (oldAssignments.length > 0) {
      console.log('\n🗑️ Deleting old assignments...');
      const deleteResult = await WorkerTaskAssignment.deleteMany({
        employeeId: 2,
        taskId: { $in: [84394, 84395, 3] }
      });
      console.log(`✅ Deleted ${deleteResult.deletedCount} assignments\n`);
    }

    // Check remaining assignments for today
    console.log('📊 Checking remaining assignments for 2026-02-15...');
    const remainingAssignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: '2026-02-15'
    }).lean();
    
    console.log(`   Found ${remainingAssignments.length} assignments\n`);
    remainingAssignments.forEach((assignment, index) => {
      console.log(`   ${index + 1}. TaskID: ${assignment.taskId}, Status: ${assignment.status}, Assignment ID: ${assignment.id}`);
    });

    // Now check if we have the 5 new tasks (7033-7037) in workertaskassignments collection
    console.log('\n📊 Checking for new tasks (7033-7037) in workertaskassignments...');
    const WorkerTaskAssignments = mongoose.model('WorkerTaskAssignments', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
    const newTasks = await WorkerTaskAssignments.find({
      employeeId: 2
    }).lean();
    
    console.log(`   Found ${newTasks.length} tasks in workertaskassignments collection`);
    if (newTasks.length > 0) {
      console.log('\n   These need to be moved to workerTaskAssignment collection!');
      newTasks.forEach((task, index) => {
        console.log(`   ${index + 1}. ${task.taskName || 'Unnamed'} (Status: ${task.status})`);
      });
    }

    console.log('\n🎉 Done! Restart backend to see changes.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteAssignmentsByTaskId();
