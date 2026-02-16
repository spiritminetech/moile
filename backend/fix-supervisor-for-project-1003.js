// Fix supervisor assignment for project 1003 tasks
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixSupervisorForTasks() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const tasksCollection = db.collection('workertaskassignments');
    const employeesCollection = db.collection('employees');

    // Step 1: Check current state
    console.log('=== CURRENT STATE ===');
    const currentTasks = await tasksCollection.find({ projectId: 1003 }).toArray();
    console.log(`Found ${currentTasks.length} tasks for project 1003:\n`);
    
    currentTasks.forEach(task => {
      console.log(`  • ${task.taskName}`);
      console.log(`    Assignment ID: ${task.id}`);
      console.log(`    Supervisor ID: ${task.supervisorId || 'NOT SET ❌'}`);
      console.log('');
    });

    // Step 2: Find supervisor
    console.log('=== FINDING SUPERVISOR ===');
    const supervisor = await employeesCollection.findOne({ 
      id: 4,
      status: 'ACTIVE'
    });

    if (!supervisor) {
      console.log('❌ Supervisor with ID 4 not found');
      console.log('Looking for any active supervisor...\n');
      
      const anySupervisor = await employeesCollection.findOne({ 
        jobTitle: { $regex: /supervisor/i },
        status: 'ACTIVE'
      });
      
      if (!anySupervisor) {
        console.log('❌ No supervisors found in database');
        return;
      }
      
      console.log(`✅ Found supervisor: ${anySupervisor.fullName} (ID: ${anySupervisor.id})`);
      await updateTasks(tasksCollection, anySupervisor.id, currentTasks.length);
    } else {
      console.log(`✅ Found supervisor: ${supervisor.fullName}`);
      console.log(`   Employee ID: ${supervisor.id}`);
      console.log(`   Phone: ${supervisor.phone || 'N/A'}`);
      console.log(`   Email: ${supervisor.email || 'N/A'}\n`);
      
      await updateTasks(tasksCollection, supervisor.id, currentTasks.length);
    }

    // Step 3: Verify update
    console.log('\n=== VERIFICATION ===');
    const updatedTasks = await tasksCollection.find({ projectId: 1003 }).toArray();
    
    let allUpdated = true;
    updatedTasks.forEach(task => {
      const hasSuper = task.supervisorId ? '✅' : '❌';
      console.log(`${hasSuper} ${task.taskName} - Supervisor ID: ${task.supervisorId || 'MISSING'}`);
      if (!task.supervisorId) allUpdated = false;
    });

    if (allUpdated) {
      console.log('\n✅ SUCCESS! All tasks now have supervisor assigned');
      console.log('\n📝 NEXT STEPS:');
      console.log('1. Restart your backend server (Ctrl+C and npm start)');
      console.log('2. Refresh the mobile app (pull down on Today\'s Tasks screen)');
      console.log('3. Expand a task card to see supervisor information');
    } else {
      console.log('\n⚠️  Some tasks still missing supervisor');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

async function updateTasks(collection, supervisorId, taskCount) {
  console.log(`🔄 Updating ${taskCount} tasks with supervisorId: ${supervisorId}...`);
  
  const result = await collection.updateMany(
    { projectId: 1003 },
    { 
      $set: { 
        supervisorId: supervisorId,
        updatedAt: new Date()
      } 
    }
  );

  console.log(`✅ Matched: ${result.matchedCount} tasks`);
  console.log(`✅ Modified: ${result.modifiedCount} tasks`);
}

fixSupervisorForTasks();
