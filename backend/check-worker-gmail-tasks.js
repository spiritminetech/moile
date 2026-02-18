// Check tasks for worker@gmail.com
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkWorkerTasks() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const tasksCollection = db.collection('workertaskassignments');
    const employeesCollection = db.collection('employees');
    const usersCollection = db.collection('users');

    // Find worker@gmail.com user
    console.log('=== FINDING WORKER ===');
    const user = await usersCollection.findOne({ email: 'worker@gmail.com' });
    
    if (!user) {
      console.log('❌ worker@gmail.com not found');
      return;
    }

    console.log(`✅ Found user: ${user.email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Employee ID: ${user.employeeId}\n`);

    // Find employee record
    const employee = await employeesCollection.findOne({ id: user.employeeId });
    
    if (employee) {
      console.log(`✅ Employee: ${employee.fullName}`);
      console.log(`   Employee ID: ${employee.id}\n`);
    }

    // Find all tasks for this employee
    console.log('=== TASKS FOR THIS WORKER ===\n');
    const tasks = await tasksCollection.find({ 
      employeeId: user.employeeId 
    }).sort({ createdAt: -1 }).toArray();

    console.log(`Found ${tasks.length} total tasks\n`);

    if (tasks.length === 0) {
      console.log('❌ No tasks found for this worker');
      return;
    }

    // Show all tasks
    tasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.taskName || 'Unnamed Task'}`);
      console.log(`   Assignment ID: ${task.id}`);
      console.log(`   Project ID: ${task.projectId}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Supervisor ID: ${task.supervisorId || 'NOT SET ❌'}`);
      console.log(`   Created: ${task.createdAt}`);
      console.log('');
    });

    // Check for tasks without supervisor
    const tasksWithoutSupervisor = tasks.filter(t => !t.supervisorId);
    
    if (tasksWithoutSupervisor.length > 0) {
      console.log(`\n⚠️  ${tasksWithoutSupervisor.length} tasks missing supervisor\n`);
      
      // Find supervisor
      const supervisor = await employeesCollection.findOne({ 
        id: 4,
        status: 'ACTIVE'
      });

      if (supervisor) {
        console.log(`🔄 Updating with supervisor: ${supervisor.fullName} (ID: ${supervisor.id})\n`);
        
        const taskIds = tasksWithoutSupervisor.map(t => t.id);
        
        const result = await tasksCollection.updateMany(
          { id: { $in: taskIds } },
          { 
            $set: { 
              supervisorId: 4,
              updatedAt: new Date()
            } 
          }
        );

        console.log(`✅ Updated ${result.modifiedCount} tasks\n`);
        
        console.log('=== UPDATED TASKS ===\n');
        tasksWithoutSupervisor.forEach(task => {
          console.log(`✅ ${task.taskName} - Now has supervisor ID: 4`);
        });
      }
    } else {
      console.log('✅ All tasks already have supervisor assigned');
    }

    console.log('\n📝 NEXT STEPS:');
    console.log('1. Restart your backend server');
    console.log('2. Refresh the mobile app');
    console.log('3. Check if supervisor info appears');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkWorkerTasks();
