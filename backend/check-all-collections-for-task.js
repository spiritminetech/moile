import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkAllCollectionsForTask() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Get all collection names
    const collections = await db.listCollections().toArray();
    console.log('📚 Available collections:');
    collections.forEach(col => console.log('   -', col.name));
    console.log('');

    // Check common collection names for worker task assignments
    const possibleCollections = [
      'workertaskassignments',
      'workerTaskAssignment',
      'workerTaskAssignments',
      'worker_task_assignments',
      'taskassignments',
      'task_assignments'
    ];

    for (const collectionName of possibleCollections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          console.log(`\n🔍 Checking collection: ${collectionName}`);
          console.log(`   Total documents: ${count}`);
          
          // Check for employee 2
          const employee2Tasks = await collection.find({ employeeId: 2 }).toArray();
          console.log(`   Tasks for employee 2: ${employee2Tasks.length}`);
          
          if (employee2Tasks.length > 0) {
            console.log('\n   📋 Tasks found:');
            employee2Tasks.forEach((task, i) => {
              console.log(`   ${i+1}. ID: ${task.id || task._id}, Date: ${task.date}, Status: ${task.status}`);
              if (task.dailyTarget) {
                console.log(`      Target: ${task.dailyTarget.description || task.dailyTarget.quantity + ' ' + task.dailyTarget.unit}`);
              }
            });
          }
          
          // Check for task ID 7059
          const task7059 = await collection.findOne({ id: 7059 });
          if (task7059) {
            console.log('\n   ✅ Found task 7059 in this collection!');
            console.log('   Details:', JSON.stringify(task7059, null, 2));
          }
          
          // Check for the specific task by description
          const fireTask = await collection.findOne({ 
            employeeId: 2,
            'dailyTarget.description': /fire safety/i
          });
          if (fireTask) {
            console.log('\n   ✅ Found fire safety task!');
            console.log('   ID:', fireTask.id || fireTask._id);
            console.log('   Date:', fireTask.date);
            console.log('   Status:', fireTask.status);
          }
        }
      } catch (err) {
        // Collection doesn't exist, skip
      }
    }

    // Also check if the task exists with _id
    console.log('\n\n🔍 Checking for task by MongoDB _id: 6992b834cdabb47b9197c67b');
    for (const collectionName of possibleCollections) {
      try {
        const collection = db.collection(collectionName);
        const task = await collection.findOne({ _id: new mongoose.Types.ObjectId('6992b834cdabb47b9197c67b') });
        if (task) {
          console.log(`\n✅ Found task in collection: ${collectionName}`);
          console.log('Task details:');
          console.log('   ID:', task.id);
          console.log('   Employee ID:', task.employeeId);
          console.log('   Date:', task.date);
          console.log('   Status:', task.status);
          console.log('   Task ID:', task.taskId);
          console.log('   Daily Target:', task.dailyTarget?.description);
        }
      } catch (err) {
        // Skip
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkAllCollectionsForTask();
