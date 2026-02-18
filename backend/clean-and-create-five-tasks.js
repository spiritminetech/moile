import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanAndCreateFiveTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workerTaskAssignment' }));
    const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false, collection: 'tasks' }));

    // Delete any documents with null id
    console.log('🗑️ Cleaning up documents with null id...');
    const deleteNull = await WorkerTaskAssignment.deleteMany({ id: null });
    console.log(`   ✅ Deleted ${deleteNull.deletedCount} documents with null id\n`);

    // Delete any existing assignments for employeeId 2 on 2026-02-15
    console.log('🗑️ Cleaning up existing assignments for 2026-02-15...');
    const deleteExisting = await WorkerTaskAssignment.deleteMany({
      employeeId: 2,
      date: '2026-02-15'
    });
    console.log(`   ✅ Deleted ${deleteExisting.deletedCount} existing assignments\n`);

    // Get the highest assignment ID
    const maxAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 }).lean();
    let nextId = (maxAssignment?.id || 7000) + 1;
    
    console.log(`📊 Highest assignment ID: ${maxAssignment?.id}`);
    console.log(`   Starting new assignments from ID: ${nextId}\n`);

    // Define the 5 new tasks
    const newTasks = [
      { name: 'Install Plumbing Fixtures', status: 'queued' },
      { name: 'Repair Ceiling Tiles', status: 'queued' },
      { name: 'Install LED Lighting', status: 'queued' },
      { name: 'Install Electrical Fixtures', status: 'queued' },
      { name: 'Paint Interior Walls', status: 'queued' }
    ];

    console.log('📦 Creating 5 new task assignments...\n');

    for (const taskInfo of newTasks) {
      // Find the task in tasks collection
      const taskDoc = await Task.findOne({ taskName: taskInfo.name }).lean();
      
      if (!taskDoc) {
        console.log(`   ⚠️ Task "${taskInfo.name}" not found in tasks collection, skipping...`);
        continue;
      }

      const newAssignment = {
        id: nextId,
        projectId: 1003, // School Campus Renovation
        employeeId: 2,
        supervisorId: 4, // Kawaja
        taskId: taskDoc.id,
        date: '2026-02-15',
        status: taskInfo.status,
        companyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedAt: new Date()
      };
      
      await WorkerTaskAssignment.create(newAssignment);
      console.log(`   ✅ Created: ${taskInfo.name}`);
      console.log(`      Assignment ID: ${nextId}, Task ID: ${taskDoc.id}, Status: ${taskInfo.status}`);
      nextId++;
    }

    // Verify
    console.log('\n📊 Verifying all tasks for 2026-02-15...');
    const verifyTasks = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: '2026-02-15'
    }).sort({ id: 1 }).lean();
    
    console.log(`   Found ${verifyTasks.length} tasks\n`);

    // Populate task names
    console.log('📝 Task details:');
    for (let i = 0; i < verifyTasks.length; i++) {
      const assignment = verifyTasks[i];
      const taskDoc = await Task.findOne({ id: assignment.taskId }).lean();
      console.log(`   ${i + 1}. ${taskDoc?.taskName || 'Unnamed'} (Assignment ID: ${assignment.id}, Task ID: ${assignment.taskId}, Status: ${assignment.status})`);
    }

    console.log('\n🎉 Done! Restart backend and login with worker@gmail.com to see 5 tasks.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

cleanAndCreateFiveTasks();
