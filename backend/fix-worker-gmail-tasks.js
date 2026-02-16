import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function fixWorkerGmailTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user with worker@gmail.com
    const user = await User.findOne({ email: 'worker@gmail.com' });
    
    console.log('\n👤 User: worker@gmail.com');
    console.log(`   Employee ID: ${user.employeeId}`);

    // Find employee by employeeId field (not _id)
    const employee = await Employee.findOne({ employeeId: user.employeeId });

    if (employee) {
      console.log('\n👷 Employee found:');
      console.log(`   Employee ID: ${employee.employeeId}`);
      console.log(`   Name: ${employee.name}`);
    }

    // Check existing tasks for Employee ID 107
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingTasks = await WorkerTaskAssignment.find({ 
      employeeId: 107,
      assignedDate: { $gte: today }
    });

    console.log(`\n📊 Existing tasks for Employee ID 107: ${existingTasks.length}`);

    // Check tasks for Employee ID 2
    const raviTasks = await WorkerTaskAssignment.find({ 
      employeeId: 2,
      assignedDate: { $gte: today }
    });

    console.log(`📊 Existing tasks for Employee ID 2: ${raviTasks.length}`);

    if (raviTasks.length > 0 && existingTasks.length === 0) {
      console.log('\n🔧 Copying tasks from Employee ID 2 to Employee ID 107...');

      // Copy all 5 tasks to Employee ID 107
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
    } else if (existingTasks.length > 0) {
      console.log('\n✅ Tasks already exist for Employee ID 107');
    }

    // Final verification
    const finalTasks = await WorkerTaskAssignment.find({ 
      employeeId: 107,
      assignedDate: { $gte: today }
    }).sort({ sequence: 1 });

    console.log(`\n📋 Final task count for Employee ID 107: ${finalTasks.length}`);
    
    finalTasks.forEach((task, index) => {
      console.log(`\n${index + 1}. ${task.taskName} (ID: ${task.taskId})`);
      console.log(`   Status: ${task.status} | Priority: ${task.priority}`);
      console.log(`   Target: ${task.dailyTarget?.targetQuantity || 0} ${task.dailyTarget?.targetUnit || ''}`);
    });

    console.log('\n✅ Done! Login with worker@gmail.com to see the tasks.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

fixWorkerGmailTasks();
