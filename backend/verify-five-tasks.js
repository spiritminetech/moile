import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function verifyFiveTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await WorkerTaskAssignment.find({ 
      employeeId: 2,
      assignedDate: { $gte: today }
    }).sort({ sequence: 1 });

    console.log(`\n📊 Total tasks for Ravi (Employee ID: 2): ${tasks.length}`);
    console.log('\n' + '='.repeat(80));

    tasks.forEach((task, index) => {
      console.log(`\n🔹 Task ${index + 1}:`);
      console.log(`   Task ID: ${task.taskId}`);
      console.log(`   Name: ${task.taskName}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Priority: ${task.priority}`);
      console.log(`   Sequence: ${task.sequence}`);
      console.log(`   Location: ${task.location}`);
      console.log(`   Estimated Hours: ${task.estimatedHours}`);
      console.log(`   Dependencies: ${task.dependencies?.join(', ') || 'None'}`);
      console.log(`   Tools: ${task.toolsRequired?.slice(0, 3).join(', ') || 'None'}${task.toolsRequired?.length > 3 ? '...' : ''}`);
      console.log(`   Materials: ${task.materialsRequired?.slice(0, 3).join(', ') || 'None'}${task.materialsRequired?.length > 3 ? '...' : ''}`);
      console.log(`   Daily Target: ${task.dailyTarget?.targetQuantity || 0} ${task.dailyTarget?.targetUnit || ''}`);
      console.log(`   Supervisor: ${task.supervisorName} (${task.supervisorEmail})`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n📈 Task Summary:');
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

verifyFiveTasks();
