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

const reassignTasks = async () => {
  try {
    console.log('\n🔄 Reassigning Tasks to Correct Employee ID...\n');

    const today = new Date().toISOString().split('T')[0];
    console.log(`Date: ${today}\n`);

    // Find tasks assigned to Employee ID 27 today
    const wrongAssignments = await WorkerTaskAssignment.find({
      employeeId: 27,
      date: today
    });

    console.log(`Found ${wrongAssignments.length} assignments for Employee ID 27\n`);

    if (wrongAssignments.length === 0) {
      console.log('⚠️  No assignments found to reassign');
      return;
    }

    // Update each assignment to Employee ID 2
    for (const assignment of wrongAssignments) {
      console.log(`Reassigning Assignment ${assignment.id}:`);
      console.log(`  Task ID: ${assignment.taskId}`);
      console.log(`  From Employee ID: 27 → To Employee ID: 2`);
      
      assignment.employeeId = 2;
      await assignment.save();
      
      console.log(`  ✅ Updated\n`);
    }

    // Verify the change
    console.log('📊 Verification:');
    const newAssignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: today
    }).lean();

    console.log(`  Total assignments for Employee ID 2 today: ${newAssignments.length}`);
    newAssignments.forEach(a => {
      console.log(`    - Assignment ${a.id}: Task ${a.taskId} (${a.status})`);
    });

    console.log('\n✅ Tasks reassigned successfully!');
    console.log('\n📱 Now refresh the mobile app to see both tasks.');

  } catch (error) {
    console.error('❌ Error reassigning tasks:', error);
  }
};

const main = async () => {
  await connectDB();
  await reassignTasks();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script execution error:', error);
  process.exit(1);
});
