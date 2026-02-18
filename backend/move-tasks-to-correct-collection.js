import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function moveTasksToCorrectCollection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Source: workertaskassignments (plural)
    const SourceCollection = mongoose.model('SourceCollection', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
    
    // Destination: workerTaskAssignment (singular - what the model uses)
    const DestCollection = mongoose.model('DestCollection', new mongoose.Schema({}, { strict: false, collection: 'workerTaskAssignment' }));

    // Get the 5 new tasks from source
    console.log('🔍 Finding tasks in workertaskassignments (plural)...');
    const sourceTasks = await SourceCollection.find({ 
      employeeId: 2,
      date: new Date('2026-02-15')
    }).lean();
    
    console.log(`   Found ${sourceTasks.length} tasks with date as Date object\n`);

    // Try with string date too
    const sourceTasks2 = await SourceCollection.find({ 
      employeeId: 2
    }).lean();
    
    console.log(`   Found ${sourceTasks2.length} total tasks for employeeId: 2`);
    
    // Filter for the 5 new tasks (Install Plumbing Fixtures, Repair Ceiling Tiles, etc.)
    const newTaskNames = [
      'Install Plumbing Fixtures',
      'Repair Ceiling Tiles', 
      'Install LED Lighting',
      'Install Electrical Fixtures',
      'Paint Interior Walls'
    ];
    
    const tasksToMove = sourceTasks2.filter(task => 
      newTaskNames.includes(task.taskName) && 
      task.date && 
      task.date.toString().includes('2026-02-15')
    );
    
    console.log(`\n   Found ${tasksToMove.length} tasks to move:`);
    tasksToMove.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.taskName} (Status: ${task.status})`);
    });

    if (tasksToMove.length === 0) {
      console.log('\n❌ No tasks found to move. Checking all tasks...');
      sourceTasks2.slice(0, 5).forEach(task => {
        console.log(`   - ${task.taskName || 'Unnamed'}, Date: ${task.date}, Type: ${typeof task.date}`);
      });
      
      await mongoose.connection.close();
      process.exit(0);
    }

    // Move tasks to correct collection
    console.log('\n📦 Moving tasks to workerTaskAssignment (singular)...');
    
    for (const task of tasksToMove) {
      // Remove MongoDB _id to let it generate a new one
      const { _id, ...taskData } = task;
      
      // Ensure date is a string in YYYY-MM-DD format
      taskData.date = '2026-02-15';
      
      // Generate a unique assignment ID
      const maxAssignment = await DestCollection.findOne().sort({ id: -1 }).lean();
      const newId = (maxAssignment?.id || 7000) + 1;
      taskData.id = newId;
      
      // Create in destination collection
      await DestCollection.create(taskData);
      console.log(`   ✅ Moved: ${taskData.taskName} (New ID: ${newId})`);
    }

    // Verify
    console.log('\n📊 Verifying tasks in workerTaskAssignment...');
    const verifyTasks = await DestCollection.find({
      employeeId: 2,
      date: '2026-02-15'
    }).lean();
    
    console.log(`   Found ${verifyTasks.length} tasks for 2026-02-15\n`);
    verifyTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.taskName || 'Unnamed'} (ID: ${task.id}, Status: ${task.status})`);
    });

    // Clean up source collection
    console.log('\n🗑️ Cleaning up source collection...');
    const deleteResult = await SourceCollection.deleteMany({
      employeeId: 2,
      taskName: { $in: newTaskNames }
    });
    console.log(`   ✅ Deleted ${deleteResult.deletedCount} tasks from workertaskassignments`);

    console.log('\n🎉 Done! Restart backend to see 5 tasks.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

moveTasksToCorrectCollection();
