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

async function debugQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const assignmentId = 2;
    console.log(`🔍 Searching for assignment with id: ${assignmentId}`);
    console.log(`   Type: ${typeof assignmentId}\n`);

    const assignment = await WorkerTaskAssignment.findOne({ id: assignmentId });
    
    if (assignment) {
      console.log('✅ Assignment found:');
      console.log(JSON.stringify(assignment, null, 2));
    } else {
      console.log('❌ Assignment not found');
      
      // Try to find all assignments to see what's there
      const all = await WorkerTaskAssignment.find({ id: { $exists: true } }).limit(10);
      console.log(`\n📋 Found ${all.length} assignments with id field:`);
      all.forEach(a => {
        console.log(`  ID: ${a.id} (type: ${typeof a.id})`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

debugQuery();
