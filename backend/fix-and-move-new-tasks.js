import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixAndMoveNewTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Source: workertaskassignments (plural)
    const SourceCollection = mongoose.model('SourceCollection', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
    
    // Destination: workerTaskAssignment (singular - what the model uses)
    const DestCollection = mongoose.model('DestCollection', new mongoose.Schema({}, { strict: false, collection: 'workerTaskAssignment' }));

    // Get all tasks from source for employeeId 2
    console.log('🔍 Finding all tasks in workertaskassignments...');
    const sourceTasks = await SourceCollection.find({ employeeId: 2 }).lean();
    
    console.log(`   Found ${sourceTasks.length} tasks\n`);
    sourceTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.taskName || 'Unnamed'} (Status: ${task.status}, Date: ${task.date})`);
    });

    // Take only the first 5 unique task names
    const newTaskNames = [
      'Install Plumbing Fixtures',
      'Repair Ceiling Tiles', 
      'Install LED Lighting',
      'Install Electrical Fixtures',
      'Paint Interior Walls'
    ];
    
    const tasksToMove = [];
    const seenNames = new Set();
    
    for (const task of sourceTasks) {
      if (newTaskNames.includes(task.taskName) && !seenNames.has(task.taskName)) {
        tasksToMove.push(task);
        seenNames.add(task.taskName);
      }
      if (tasksToMove.length === 5) break;
    }
    
    console.log(`\n📦 Moving ${tasksToMove.length} tasks to workerTaskAssignment...\n`);

    // Get the highest ID in destination collection
    const maxAssignment = await DestCollection.findOne().sort({ id: -1 }).lean();
    let nextId = (maxAssignment?.id || 7000) + 1;

    // Get task IDs from the tasks collection
    const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false, collection: 'tasks' }));
    
    for (const task of tasksToMove) {
      // Find the corresponding task in tasks collection by name
      const taskDoc = await Task.findOne({ taskName: task.taskName }).lean();
      
      const newAssignment = {
        id: nextId,
        projectId: 1003, // School Campus Renovation
        employeeId: 2,
        supervisorId: 4, // Kawaja
        taskId: taskDoc?.id || nextId, // Use task ID from tasks collection
        date: '2026-02-15',
        status: task.status || 'queued',
        companyId: 1,
        taskName: task.taskName,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedAt: new Date()
      };
      
      await DestCollection.create(newAssignment);
      console.log(`   ✅ Created: ${newAssignment.taskName} (Assignment ID: ${nextId}, Task ID: ${newAssignment.taskId})`);
      nextId++;
    }

    // Verify
    console.log('\n📊 Verifying tasks in workerTaskAssignment...');
    const verifyTasks = await DestCollection.find({
      employeeId: 2,
      date: '2026-02-15'
    }).sort({ id: 1 }).lean();
    
    console.log(`   Found ${verifyTasks.length} tasks for 2026-02-15\n`);
    verifyTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.taskName || 'Unnamed'} (Assignment ID: ${task.id}, Task ID: ${task.taskId}, Status: ${task.status})`);
    });

    // Clean up source collection
    console.log('\n🗑️ Cleaning up source collection...');
    const deleteResult = await SourceCollection.deleteMany({ employeeId: 2 });
    console.log(`   ✅ Deleted ${deleteResult.deletedCount} tasks from workertaskassignments`);

    console.log('\n🎉 Done! Restart backend and login to see 5 tasks.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAndMoveNewTasks();
