// Add supervisor to worker task assignments
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));

async function addSupervisorToTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all worker task assignments for project 1003
    const tasks = await WorkerTaskAssignment.find({ 
      projectId: 1003 
    }).lean();

    console.log(`📋 Found ${tasks.length} tasks for project 1003\n`);

    // Find a supervisor for this project
    // Let's use supervisor with ID 4 (supervisor@gmail.com)
    const supervisor = await Employee.findOne({ 
      id: 4,
      status: 'ACTIVE'
    }).lean();

    if (!supervisor) {
      console.log('❌ No supervisor found with ID 4');
      console.log('\n🔍 Looking for any supervisor...');
      
      const anySupervisor = await Employee.findOne({ 
        jobTitle: { $regex: /supervisor/i },
        status: 'ACTIVE'
      }).lean();
      
      if (anySupervisor) {
        console.log('✅ Found supervisor:', anySupervisor.fullName, '(ID:', anySupervisor.id, ')');
        await updateTasks(tasks, anySupervisor.id);
      } else {
        console.log('❌ No supervisors found in database');
      }
    } else {
      console.log('✅ Found supervisor:', supervisor.fullName);
      console.log('   Employee ID:', supervisor.id);
      console.log('   Phone:', supervisor.phone || 'N/A');
      console.log('   Email:', supervisor.email || 'N/A');
      console.log('');
      
      await updateTasks(tasks, supervisor.id);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

async function updateTasks(tasks, supervisorId) {
  console.log(`🔄 Updating ${tasks.length} tasks with supervisorId: ${supervisorId}\n`);
  
  for (const task of tasks) {
    console.log(`Updating task: ${task.taskName} (Assignment ID: ${task.id})`);
    
    await WorkerTaskAssignment.updateOne(
      { id: task.id },
      { 
        $set: { 
          supervisorId: supervisorId,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('  ✅ Updated');
  }
  
  console.log('\n✅ All tasks updated successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your backend server');
  console.log('2. Refresh the mobile app');
  console.log('3. Supervisor information should now be visible');
}

addSupervisorToTasks();
