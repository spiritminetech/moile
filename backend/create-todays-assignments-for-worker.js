import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function createTodaysAssignments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const WorkerTaskAssignment = mongoose.connection.collection('workertaskassignments');
    const Task = mongoose.connection.collection('tasks');

    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Creating assignments for:', today);

    // Get the three tasks for project 1003
    const tasks = await Task.find({ projectId: 1003 }).limit(3).toArray();
    
    console.log(`\n📋 Found ${tasks.length} tasks for project 1003`);

    // Delete any existing assignments for employee 2 today
    const deleteResult = await WorkerTaskAssignment.deleteMany({
      employeeId: 2,
      date: today
    });
    
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing assignments`);

    // Create new assignments
    const assignments = tasks.map((task, index) => ({
      id: 7034 + index,
      employeeId: 2,
      projectId: 1003,
      taskId: task.id,
      supervisorId: 4,  // Kawaja
      date: today,
      status: index === 0 ? 'completed' : (index === 1 ? 'in_progress' : 'in_progress'),
      sequence: index,
      progressPercent: index === 0 ? 100 : (index === 1 ? 50 : 30),
      startTime: index > 0 ? new Date(Date.now() - (index * 3600000)).toISOString() : new Date(Date.now() - 28800000).toISOString(),
      completedAt: index === 0 ? new Date().toISOString() : null,
      dailyTarget: {
        description: task.description || '',
        quantity: 100,
        unit: 'units',
        targetCompletion: 100
      },
      timeEstimate: {
        estimated: 480,
        elapsed: index * 120,
        remaining: 480 - (index * 120)
      },
      supervisorInstructions: {
        instructions: task.description || '',
        attachments: [],
        lastUpdated: new Date().toISOString()
      },
      dependencies: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const insertResult = await WorkerTaskAssignment.insertMany(assignments);
    
    console.log(`\n✅ Created ${insertResult.insertedCount} assignments:`);
    assignments.forEach(a => {
      console.log({
        id: a.id,
        taskId: a.taskId,
        employeeId: a.employeeId,
        supervisorId: a.supervisorId,
        date: a.date,
        status: a.status
      });
    });

    console.log('\n🎉 Assignments created successfully!');
    console.log('Now restart the backend and refresh the mobile app.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createTodaysAssignments();
