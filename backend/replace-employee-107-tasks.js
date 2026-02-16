import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function replaceEmployee107Tasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Delete all existing tasks for Employee ID 107
    console.log('\n🗑️ Deleting old tasks for Employee ID 107...');
    const deleteResult = await WorkerTaskAssignment.deleteMany({ 
      employeeId: 107
    });
    console.log(`✅ Deleted ${deleteResult.deletedCount} old tasks`);

    // Get tasks from Employee ID 2
    const raviTasks = await WorkerTaskAssignment.find({ 
      employeeId: 2,
      assignedDate: { $gte: today }
    }).sort({ sequence: 1 });

    console.log(`\n📋 Found ${raviTasks.length} tasks from Employee ID 2`);

    // Create new tasks for Employee ID 107
    console.log('\n📝 Creating 5 tasks for Employee ID 107...');

    const newTasks = raviTasks.map(task => ({
      taskId: task.taskId,
      employeeId: 107, // Change to 107
      projectId: task.projectId,
      assignedDate: task.assignedDate,
      status: task.status,
      priority: task.priority,
      taskName: task.taskName,
      description: task.description,
      location: task.location,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      startTime: task.startTime,
      endTime: task.endTime,
      notes: task.notes,
      supervisorId: task.supervisorId,
      supervisorName: task.supervisorName,
      supervisorEmail: task.supervisorEmail,
      supervisorPhone: task.supervisorPhone,
      supervisorInstructions: task.supervisorInstructions,
      sequence: task.sequence,
      dependencies: task.dependencies,
      toolsRequired: task.toolsRequired,
      materialsRequired: task.materialsRequired,
      safetyRequirements: task.safetyRequirements,
      dailyTarget: task.dailyTarget
    }));

    await WorkerTaskAssignment.insertMany(newTasks);
    console.log(`✅ Created ${newTasks.length} tasks for Employee ID 107`);

    // Verify
    const finalTasks = await WorkerTaskAssignment.find({ 
      employeeId: 107,
      assignedDate: { $gte: today }
    }).sort({ sequence: 1 });

    console.log(`\n📊 Final verification - Total tasks: ${finalTasks.length}`);
    console.log('\n' + '='.repeat(80));
    
    finalTasks.forEach((task, index) => {
      console.log(`\n${index + 1}. ${task.taskName} (ID: ${task.taskId})`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Priority: ${task.priority}`);
      console.log(`   Sequence: ${task.sequence}`);
      console.log(`   Location: ${task.location}`);
      console.log(`   Estimated Hours: ${task.estimatedHours}`);
      console.log(`   Daily Target: ${task.dailyTarget?.targetQuantity || 0} ${task.dailyTarget?.targetUnit || ''}`);
      console.log(`   Supervisor: ${task.supervisorName}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ All done! Now login with:');
    console.log('   Email: worker@gmail.com');
    console.log('   Password: password123');
    console.log('\n📱 You should see 5 tasks in the Today\'s Tasks screen!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

replaceEmployee107Tasks();
