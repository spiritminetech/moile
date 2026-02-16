// Check specific task assignments that user reported
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkSpecificTasks() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const tasksCollection = db.collection('workertaskassignments');
    const employeesCollection = db.collection('employees');

    // Check the specific assignment IDs from user's output
    const assignmentIds = [7034, 7035, 7036];
    
    console.log('=== CHECKING SPECIFIC TASK ASSIGNMENTS ===\n');
    
    for (const assignmentId of assignmentIds) {
      const task = await tasksCollection.findOne({ id: assignmentId });
      
      if (task) {
        console.log(`✅ Found Assignment ID: ${assignmentId}`);
        console.log(`   Task Name: ${task.taskName}`);
        console.log(`   Project ID: ${task.projectId}`);
        console.log(`   Supervisor ID: ${task.supervisorId || 'NOT SET ❌'}`);
        console.log(`   Status: ${task.status}`);
        console.log('');
      } else {
        console.log(`❌ Assignment ID ${assignmentId} not found\n`);
      }
    }

    // Check if these tasks need updating
    const tasksNeedingUpdate = await tasksCollection.find({
      id: { $in: assignmentIds },
      $or: [
        { supervisorId: { $exists: false } },
        { supervisorId: null },
        { supervisorId: undefined }
      ]
    }).toArray();

    if (tasksNeedingUpdate.length > 0) {
      console.log(`\n⚠️  Found ${tasksNeedingUpdate.length} tasks without supervisor\n`);
      
      // Find supervisor
      const supervisor = await employeesCollection.findOne({ 
        id: 4,
        status: 'ACTIVE'
      });

      if (supervisor) {
        console.log(`🔄 Updating tasks with supervisor: ${supervisor.fullName} (ID: ${supervisor.id})\n`);
        
        const result = await tasksCollection.updateMany(
          { id: { $in: assignmentIds } },
          { 
            $set: { 
              supervisorId: 4,
              updatedAt: new Date()
            } 
          }
        );

        console.log(`✅ Updated ${result.modifiedCount} tasks\n`);
        
        // Verify
        console.log('=== VERIFICATION ===\n');
        for (const assignmentId of assignmentIds) {
          const task = await tasksCollection.findOne({ id: assignmentId });
          if (task) {
            const status = task.supervisorId ? '✅' : '❌';
            console.log(`${status} ${task.taskName} - Supervisor ID: ${task.supervisorId || 'MISSING'}`);
          }
        }
      }
    } else {
      console.log('✅ All specified tasks already have supervisor assigned');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkSpecificTasks();
