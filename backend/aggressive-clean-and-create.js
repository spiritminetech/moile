import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function aggressiveCleanAndCreate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Use direct collection access to avoid schema issues
    const db = mongoose.connection.db;
    const tasksCollection = db.collection('tasks');
    const assignmentsCollection = db.collection('workerTaskAssignment');

    // Aggressively delete ALL null IDs
    console.log('🗑️ Step 1: Aggressively cleaning up null IDs...\n');
    
    const deleteNullTasks = await tasksCollection.deleteMany({ 
      $or: [{ id: null }, { id: { $exists: false } }] 
    });
    console.log(`   ✅ Deleted ${deleteNullTasks.deletedCount} tasks with null/missing id`);
    
    const deleteNullAssignments = await assignmentsCollection.deleteMany({ 
      $or: [{ id: null }, { id: { $exists: false } }] 
    });
    console.log(`   ✅ Deleted ${deleteNullAssignments.deletedCount} assignments with null/missing id\n`);

    // Create 5 tasks
    console.log('📝 Step 2: Creating 5 tasks...\n');
    
    const taskDefinitions = [
      { name: 'Install Plumbing Fixtures', trade: 'Plumbing' },
      { name: 'Repair Ceiling Tiles', trade: 'General Construction' },
      { name: 'Install LED Lighting', trade: 'Electrical' },
      { name: 'Install Electrical Fixtures', trade: 'Electrical' },
      { name: 'Paint Interior Walls', trade: 'Painting' }
    ];

    // Get highest task ID
    const maxTaskDoc = await tasksCollection.findOne({}, { sort: { id: -1 } });
    let nextTaskId = (maxTaskDoc?.id || 84396) + 1;

    const createdTasks = [];

    for (const taskDef of taskDefinitions) {
      // Check if exists
      const existing = await tasksCollection.findOne({ taskName: taskDef.name });
      
      if (!existing) {
        const newTask = {
          id: nextTaskId,
          taskName: taskDef.name,
          trade: taskDef.trade,
          projectId: 1003,
          companyId: 1,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await tasksCollection.insertOne(newTask);
        console.log(`   ✅ Created: ${taskDef.name} (ID: ${nextTaskId})`);
        createdTasks.push({ id: nextTaskId, name: taskDef.name });
        nextTaskId++;
      } else {
        console.log(`   ℹ️ Exists: ${taskDef.name} (ID: ${existing.id})`);
        createdTasks.push({ id: existing.id, name: taskDef.name });
      }
    }

    // Create 5 assignments
    console.log('\n📦 Step 3: Creating 5 assignments...\n');

    const maxAssignmentDoc = await assignmentsCollection.findOne({}, { sort: { id: -1 } });
    let nextAssignmentId = (maxAssignmentDoc?.id || 7033) + 1;

    for (const task of createdTasks) {
      const newAssignment = {
        id: nextAssignmentId,
        projectId: 1003,
        employeeId: 2,
        supervisorId: 4,
        taskId: task.id,
        date: '2026-02-15',
        status: 'queued',
        companyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedAt: new Date()
      };
      
      await assignmentsCollection.insertOne(newAssignment);
      console.log(`   ✅ Created: ${task.name} (Assignment ID: ${nextAssignmentId}, Task ID: ${task.id})`);
      nextAssignmentId++;
    }

    // Verify
    console.log('\n📊 Step 4: Verifying...\n');
    const assignments = await assignmentsCollection.find({
      employeeId: 2,
      date: '2026-02-15'
    }).sort({ id: 1 }).toArray();
    
    console.log(`   Found ${assignments.length} assignments for 2026-02-15\n`);

    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];
      const taskDoc = await tasksCollection.findOne({ id: assignment.taskId });
      console.log(`   ${i + 1}. ${taskDoc?.taskName || 'Unnamed'} (Assignment ID: ${assignment.id}, Task ID: ${assignment.taskId})`);
    }

    console.log('\n🎉 SUCCESS! Restart backend and login with worker@gmail.com / password123');
    console.log('   You should see 5 tasks in the mobile app.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

aggressiveCleanAndCreate();
