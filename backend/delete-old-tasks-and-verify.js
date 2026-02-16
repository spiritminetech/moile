import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function deleteOldTasksAndVerify() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Delete the 3 old tasks
    console.log('\n🗑️ Deleting old tasks (IDs: 84394, 84395, 3)...');
    const deleteResult = await WorkerTaskAssignment.deleteMany({
      employeeId: 2,
      taskId: { $in: [84394, 84395, 3] }
    });
    console.log(`✅ Deleted ${deleteResult.deletedCount} old tasks`);

    // Check what tasks exist for employeeId: 2
    console.log('\n📊 Checking all tasks for employeeId: 2...');
    const allTasksFor2 = await WorkerTaskAssignment.find({ employeeId: 2 });
    console.log(`   Found ${allTasksFor2.length} tasks`);
    allTasksFor2.forEach(t => {
      console.log(`   - ${t.taskName || 'Unnamed'} (ID: ${t.taskId}, Date: ${t.date})`);
    });

    // Check if the 5 new tasks exist with different employee ID
    console.log('\n📊 Checking for tasks with IDs 7033-7037...');
    const newTasks = await WorkerTaskAssignment.find({
      taskId: { $in: [7033, 7034, 7035, 7036, 7037] }
    });
    console.log(`   Found ${newTasks.length} tasks`);
    newTasks.forEach(t => {
      console.log(`   - ${t.taskName} (ID: ${t.taskId}, EmployeeID: ${t.employeeId}, Date: ${t.date})`);
    });

    if (newTasks.length > 0) {
      console.log('\n🔧 Updating employee ID from', newTasks[0].employeeId, 'to 2...');
      await WorkerTaskAssignment.updateMany(
        { taskId: { $in: [7033, 7034, 7035, 7036, 7037] } },
        { $set: { employeeId: 2 } }
      );
      console.log('✅ Updated employee IDs');
    }

    // Final verification
    console.log('\n📊 Final check for employeeId: 2, date:', today);
    const finalTasks = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: today
    }).sort({ sequence: 1 });

    console.log(`\n✅ Total tasks: ${finalTasks.length}`);
    finalTasks.forEach((t, i) => {
      console.log(`   ${i+1}. ${t.taskName || 'Unnamed'} (ID: ${t.taskId}, Status: ${t.status})`);
    });

    console.log('\n🎉 Done! Refresh the mobile app to see the tasks.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

deleteOldTasksAndVerify();
