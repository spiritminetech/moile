import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './src/modules/task/Task.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createMissingTasks = async () => {
  try {
    console.log('\n📋 Creating Missing Tasks...\n');

    // Get all assignments
    const assignments = await WorkerTaskAssignment.find().lean();
    const assignmentTaskIds = [...new Set(assignments.map(a => a.taskId))];

    // Get existing tasks
    const existingTasks = await Task.find().lean();
    const existingTaskIds = new Set(existingTasks.map(t => t.id));

    // Find missing task IDs
    const missingTaskIds = assignmentTaskIds.filter(id => !existingTaskIds.has(id));

    console.log(`Found ${missingTaskIds.length} missing task IDs\n`);

    if (missingTaskIds.length === 0) {
      console.log('✅ No missing tasks to create');
      return;
    }

    // Task name templates
    const taskTemplates = [
      'Foundation Work',
      'Concrete Pouring',
      'Steel Fixing',
      'Bricklaying',
      'Plastering',
      'Electrical Installation',
      'Plumbing Work',
      'Painting',
      'Flooring',
      'Ceiling Installation',
      'Door Installation',
      'Window Installation',
      'Quality Inspection',
      'Site Cleanup',
      'Material Handling'
    ];

    // Create missing tasks
    const tasksToCreate = [];
    
    for (const taskId of missingTaskIds) {
      // Get a sample assignment to determine project
      const sampleAssignment = assignments.find(a => a.taskId === taskId);
      const projectId = sampleAssignment?.projectId || 1;

      // Generate a task name
      const templateIndex = taskId % taskTemplates.length;
      const taskName = `${taskTemplates[templateIndex]} - Task ${taskId}`;

      tasksToCreate.push({
        id: taskId,
        taskName: taskName,
        description: `Auto-generated task for assignment compatibility`,
        projectId: projectId,
        companyId: 1, // Default company ID
        taskType: 'WORK', // Default task type
        status: 'PLANNED', // Valid enum value
        priority: 'medium',
        estimatedHours: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Insert tasks in batches
    console.log(`Creating ${tasksToCreate.length} tasks...`);
    await Task.insertMany(tasksToCreate);
    console.log('✅ Tasks created successfully\n');

    // Verify
    console.log('📊 Verification:');
    const newTasks = await Task.find({ id: { $in: missingTaskIds } }).lean();
    console.log(`  Tasks created: ${newTasks.length}`);
    console.log(`  Expected: ${missingTaskIds.length}`);

    if (newTasks.length === missingTaskIds.length) {
      console.log('\n✅ All missing tasks created successfully!');
      
      // Show sample created tasks
      console.log('\n📝 Sample created tasks:');
      newTasks.slice(0, 5).forEach(task => {
        console.log(`  ID: ${task.id}, Name: ${task.taskName}, Project: ${task.projectId}`);
      });
    } else {
      console.log('\n⚠️  Some tasks may not have been created');
    }

  } catch (error) {
    console.error('❌ Error creating missing tasks:', error);
  }
};

const main = async () => {
  await connectDB();
  await createMissingTasks();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script execution error:', error);
  process.exit(1);
});
