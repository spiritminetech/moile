import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function finalCleanAndCreateFiveTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workerTaskAssignment' }));
    const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false, collection: 'tasks' }));

    // Clean up null IDs in both collections
    console.log('🗑️ Step 1: Cleaning up null IDs...\n');
    
    const deleteNullTasks = await Task.deleteMany({ id: null });
    console.log(`   ✅ Deleted ${deleteNullTasks.deletedCount} tasks with null id`);
    
    const deleteNullAssignments = await WorkerTaskAssignment.deleteMany({ id: null });
    console.log(`   ✅ Deleted ${deleteNullAssignments.deletedCount} assignments with null id\n`);

    // Create 5 tasks in tasks collection
    console.log('📝 Step 2: Creating 5 tasks in tasks collection...\n');
    
    const taskDefinitions = [
      { name: 'Install Plumbing Fixtures', trade: 'Plumbing', activity: 'Installation' },
      { name: 'Repair Ceiling Tiles', trade: 'General Construction', activity: 'Repair' },
      { name: 'Install LED Lighting', trade: 'Electrical', activity: 'Installation' },
      { name: 'Install Electrical Fixtures', trade: 'Electrical', activity: 'Installation' },
      { name: 'Paint Interior Walls', trade: 'Painting', activity: 'Finishing' }
    ];

    // Get highest task ID
    const maxTask = await Task.findOne().sort({ id: -1 }).lean();
    let nextTaskId = (maxTask?.id || 84396) + 1;

    const createdTasks = [];

    for (const taskDef of taskDefinitions) {
      // Check if task already exists
      let existingTask = await Task.findOne({ taskName: taskDef.name }).lean();
      
      if (!existingTask) {
        const newTask = {
          id: nextTaskId,
          taskName: taskDef.name,
          trade: taskDef.trade,
          activity: taskDef.activity,
          projectId: 1003,
          companyId: 1,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await Task.create(newTask);
        console.log(`   ✅ Created task: ${taskDef.name} (ID: ${nextTaskId})`);
        createdTasks.push({ id: nextTaskId, name: taskDef.name });
        nextTaskId++;
      } else {
        console.log(`   ℹ️ Task already exists: ${taskDef.name} (ID: ${existingTask.id})`);
        createdTasks.push({ id: existingTask.id, name: taskDef.name });
      }
    }

    // Create 5 assignments
    console.log('\n📦 Step 3: Creating 5 task assignments...\n');

    // Get highest assignment ID
    const maxAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 }).lean();
    let nextAssignmentId = (maxAssignment?.id || 7033) + 1;

    for (const task of createdTasks) {
      const newAssignment = {
        id: nextAssignmentId,
        projectId: 1003, // School Campus Renovation
        employeeId: 2,
        supervisorId: 4, // Kawaja
        taskId: task.id,
        date: '2026-02-15',
        status: 'queued',
        companyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedAt: new Date()
      };
      
      await WorkerTaskAssignment.create(newAssignment);
      console.log(`   ✅ Created assignment: ${task.name}`);
      console.log(`      Assignment ID: ${nextAssignmentId}, Task ID: ${task.id}`);
      nextAssignmentId++;
    }

    // Verify
    console.log('\n📊 Step 4: Verifying assignments for 2026-02-15...\n');
    const verifyAssignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: '2026-02-15'
    }).sort({ id: 1 }).lean();
    
    console.log(`   Found ${verifyAssignments.length} assignments\n`);

    for (let i = 0; i < verifyAssignments.length; i++) {
      const assignment = verifyAssignments[i];
      const taskDoc = await Task.findOne({ id: assignment.taskId }).lean();
      console.log(`   ${i + 1}. ${taskDoc?.taskName || 'Unnamed'}`);
      console.log(`      Assignment ID: ${assignment.id}, Task ID: ${assignment.taskId}, Status: ${assignment.status}`);
    }

    console.log('\n🎉 SUCCESS! Restart backend and login with worker@gmail.com to see 5 tasks.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

finalCleanAndCreateFiveTasks();
