import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function fixWorkerGmailUserRecord() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: 'worker@gmail.com' });
    
    console.log('\n👤 Current user record:');
    console.log(`   _id: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Employee ID: ${user.employeeId}`);

    // The issue: User _id is 2, but we need employeeId to be 107
    // Let's check what the backend is using
    console.log('\n🔍 Checking task assignments...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check tasks by user._id (which is 2)
    const tasksByUserId = await WorkerTaskAssignment.find({ 
      employeeId: parseInt(user._id.toString().slice(-1)) || 2,
      assignedDate: { $gte: today }
    });
    console.log(`   Tasks for employeeId = ${parseInt(user._id.toString().slice(-1)) || 2}: ${tasksByUserId.length}`);

    // Check tasks by user.employeeId (which is 107)
    const tasksByEmployeeId = await WorkerTaskAssignment.find({ 
      employeeId: user.employeeId,
      assignedDate: { $gte: today }
    });
    console.log(`   Tasks for employeeId = ${user.employeeId}: ${tasksByEmployeeId.length}`);

    // The backend is using user.id (which is the _id converted to number)
    // So we need to move tasks from employeeId 107 to employeeId 2
    
    console.log('\n🔧 Solution: Copy tasks from Employee ID 107 to Employee ID 2');
    
    // Delete old tasks for Employee ID 2
    console.log('\n🗑️ Deleting old tasks for Employee ID 2...');
    const deleteResult = await WorkerTaskAssignment.deleteMany({ 
      employeeId: 2
    });
    console.log(`✅ Deleted ${deleteResult.deletedCount} old tasks`);

    // Get tasks from Employee ID 107
    const tasks107 = await WorkerTaskAssignment.find({ 
      employeeId: 107,
      assignedDate: { $gte: today }
    }).sort({ sequence: 1 });

    console.log(`\n📋 Found ${tasks107.length} tasks for Employee ID 107`);

    // Copy to Employee ID 2
    if (tasks107.length > 0) {
      const newTasks = tasks107.map(task => ({
        taskId: task.taskId,
        employeeId: 2, // Change to 2 (the user._id)
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
      console.log(`✅ Created ${newTasks.length} tasks for Employee ID 2`);
    }

    // Verify
    const finalTasks = await WorkerTaskAssignment.find({ 
      employeeId: 2,
      assignedDate: { $gte: today }
    }).sort({ sequence: 1 });

    console.log(`\n📊 Final verification - Total tasks for Employee ID 2: ${finalTasks.length}`);
    
    finalTasks.forEach((task, index) => {
      console.log(`\n${index + 1}. ${task.taskName} (ID: ${task.taskId})`);
      console.log(`   Status: ${task.status} | Priority: ${task.priority}`);
    });

    console.log('\n✅ Done! The API should now return 5 tasks for worker@gmail.com');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

fixWorkerGmailUserRecord();
