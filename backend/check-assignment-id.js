import mongoose from 'mongoose';
import dotenv from 'dotenv';
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

async function checkAssignmentId() {
  try {
    await connectDB();

    const assignmentId = '698749e6773df0f6f47f5f14';
    
    console.log(`\n🔍 Checking assignment ID: ${assignmentId}\n`);

    // Check if it's a valid ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(assignmentId);
    console.log(`Valid ObjectId format: ${isValidObjectId ? '✅' : '❌'}`);

    if (!isValidObjectId) {
      console.log('❌ Invalid ObjectId format');
      return;
    }

    // Try to find the assignment
    const assignment = await WorkerTaskAssignment.findById(assignmentId).lean();

    if (assignment) {
      console.log('✅ Assignment found!');
      console.log('\nAssignment details:');
      console.log(`   _id: ${assignment._id}`);
      console.log(`   id: ${assignment.id}`);
      console.log(`   taskId: ${assignment.taskId}`);
      console.log(`   employeeId: ${assignment.employeeId}`);
      console.log(`   projectId: ${assignment.projectId}`);
      console.log(`   status: ${assignment.status}`);
      console.log(`   priority: ${assignment.priority || 'not set'}`);
      console.log(`   date: ${assignment.date}`);
      console.log(`   sequence: ${assignment.sequence}`);
    } else {
      console.log('❌ Assignment not found');
      
      // Check if any assignments exist
      const count = await WorkerTaskAssignment.countDocuments();
      console.log(`\nTotal assignments in database: ${count}`);
      
      if (count > 0) {
        console.log('\nSample assignment IDs:');
        const samples = await WorkerTaskAssignment.find().limit(5).lean();
        samples.forEach(a => {
          console.log(`   ${a._id}`);
        });
      }
    }

    // Check the schema for priority field
    console.log('\n📋 Checking WorkerTaskAssignment schema...');
    const schema = WorkerTaskAssignment.schema;
    const priorityPath = schema.path('priority');
    
    if (priorityPath) {
      console.log('Priority field exists in schema');
      console.log(`   Type: ${priorityPath.instance}`);
      if (priorityPath.enumValues && priorityPath.enumValues.length > 0) {
        console.log(`   Enum values: ${priorityPath.enumValues.join(', ')}`);
      } else {
        console.log('   No enum restriction');
      }
    } else {
      console.log('⚠️  Priority field not defined in schema');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkAssignmentId();
