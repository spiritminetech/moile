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

async function testPriorityUpdate() {
  try {
    await connectDB();

    const assignmentId = '698749e6773df0f6f47f5f14';
    
    console.log(`\n🧪 Testing priority update for assignment: ${assignmentId}\n`);

    // Find the assignment
    const assignment = await WorkerTaskAssignment.findById(assignmentId);
    
    if (!assignment) {
      console.log('❌ Assignment not found');
      return;
    }

    console.log('Current assignment state:');
    console.log(`   Priority: ${assignment.priority}`);
    console.log(`   Status: ${assignment.status}`);
    console.log(`   Instructions: ${assignment.instructions || 'none'}`);
    console.log(`   Estimated Hours: ${assignment.estimatedHours || 'not set'}`);

    // Test different priority values
    const testCases = [
      { priority: 'high', instructions: 'Urgent task', estimatedHours: 6 },
      { priority: 'critical', instructions: 'Critical priority', estimatedHours: 4 },
      { priority: 'low', instructions: 'Low priority', estimatedHours: 10 },
      { priority: 'medium', instructions: 'Normal priority', estimatedHours: 8 },
      { priority: 'invalid', instructions: 'This should fail', estimatedHours: 8 } // Invalid value
    ];

    for (const testCase of testCases) {
      console.log(`\n📝 Test: Setting priority to "${testCase.priority}"...`);
      
      try {
        assignment.priority = testCase.priority;
        assignment.instructions = testCase.instructions;
        assignment.estimatedHours = testCase.estimatedHours;
        assignment.updatedAt = new Date();
        
        await assignment.save();
        
        console.log(`   ✅ Success! Priority updated to: ${assignment.priority}`);
        
        // Verify
        const verified = await WorkerTaskAssignment.findById(assignmentId).lean();
        console.log(`   Verified in DB: ${verified.priority}`);
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        if (error.name === 'ValidationError') {
          console.log(`   Validation errors:`, error.errors);
        }
      }
    }

    // Final state
    console.log('\n📊 Final assignment state:');
    const final = await WorkerTaskAssignment.findById(assignmentId).lean();
    console.log(`   Priority: ${final.priority}`);
    console.log(`   Instructions: ${final.instructions || 'none'}`);
    console.log(`   Estimated Hours: ${final.estimatedHours || 'not set'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testPriorityUpdate();
