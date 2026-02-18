import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function createFiveNewAssignments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workerTaskAssignment' }));
    const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false, collection: 'tasks' }));

    // Get the highest assignment ID
    const maxAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 }).lean();
    let nextId = (maxAssignment?.id || 7000) + 1;
    
    console.log(`📊 Highest assignment ID: ${maxAssignment?.id}`);
    console.log(`   Starting new assignments from ID: ${nextId}\n`);

    // Define the 5 new tasks
    const newTasks = [
      { name: 'Install Plumbing Fixtures', status: 'completed' },
      { name: 'Repair Ceiling Tiles', status: 'completed' },
      { name: 'Install LED Lighting', status: 'in_progress' },
      { name: 'Install Electrical Fixtures', status: 'queued' },
      { name: 'Paint Interior Walls', status: 'queued' }
    ];

    console.log('📦 Creating 5 new task assignments...\n');

    for (const taskInfo of newTasks) {
      // Find the task in tasks collection
      const taskDoc = await Task.findOne({ taskName: taskInfo.name }).lean();
      
      const newAssignment = {
        id: nextId,
        projectId: 1003, // School Campus Renovation
        employeeId: 2,
        supervisorId: 4, // Kawaja
        taskId: taskDoc?.id || nextId,
        date: '2026-02-15',
        status: taskInfo.status,
        companyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedAt: new Date()
      };
      
      await WorkerTaskAssignment.create(newAssignment);
      console.log(`   ✅ Created: ${taskInfo.name}`);
      console.log(`      Assignment ID: ${nextId}, Task ID: ${newAssignment.taskId}, Status: ${taskInfo.status}`);
      nextId++;
    }

    // Verify
    console.log('\n📊 Verifying all tasks for 2026-02-15...');
    const verifyTasks = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: '2026-02-15'
    }).sort({ id: 1 }).lean();
    
    console.log(`   Found ${verifyTasks.length} tasks\n`);
    verifyTasks.forEach((task, index) => {
      // Get task name from tasks collection
      console.log(`   ${index + 1}. Task ID: ${task.taskId}, Assignment ID: ${task.id}, Status: ${task.status}`);
    });

    // Now populate task names by looking up in tasks collection
    console.log('\n📝 Task details with names:');
    for (let i = 0; i < verifyTasks.length; i++) {
      const task = verifyTasks[i];
      const taskDoc = await Task.findOne({ id: task.taskId }).lean();
      console.log(`   ${i + 1}. ${taskDoc?.taskName || 'Unnamed'} (Status: ${task.status})`);
    }

    console.log('\n🎉 Done! Restart backend and login to see 5 tasks.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createFiveNewAssignments();
