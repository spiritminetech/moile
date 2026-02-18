import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './src/modules/task/Task.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function addToolsAndMaterials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update LED Lighting task (ID 84394) with tools and materials
    console.log('\n📝 Updating Task 84394 (LED Lighting)...');
    const ledTask = await Task.findOne({ id: 84394 });
    if (ledTask) {
      ledTask.requiredTools = [
        'Screwdriver Set',
        'Wire Stripper',
        'Voltage Tester',
        'Ladder'
      ];
      ledTask.requiredMaterials = [
        'LED Light Fixtures',
        'Electrical Wire',
        'Wire Connectors',
        'Mounting Brackets'
      ];
      await ledTask.save();
      console.log('✅ Updated LED lighting task');
    }

    // Update assignment 7035
    const assignment7035 = await WorkerTaskAssignment.findOne({ id: 7035 });
    if (assignment7035) {
      assignment7035.requiredTools = ledTask.requiredTools;
      assignment7035.requiredMaterials = ledTask.requiredMaterials;
      await assignment7035.save();
      console.log('✅ Updated assignment 7035');
    }

    // Update Painting task (ID 84395) with tools and materials
    console.log('\n📝 Updating Task 84395 (Painting)...');
    const paintTask = await Task.findOne({ id: 84395 });
    if (paintTask) {
      paintTask.requiredTools = [
        'Paint Roller',
        'Paint Brush Set',
        'Paint Tray',
        'Masking Tape',
        'Drop Cloth'
      ];
      paintTask.requiredMaterials = [
        'Interior Paint (White)',
        'Primer',
        'Sandpaper',
        'Putty'
      ];
      await paintTask.save();
      console.log('✅ Updated painting task');
    }

    // Update assignment 7036
    const assignment7036 = await WorkerTaskAssignment.findOne({ id: 7036 });
    if (assignment7036) {
      assignment7036.requiredTools = paintTask.requiredTools;
      assignment7036.requiredMaterials = paintTask.requiredMaterials;
      await assignment7036.save();
      console.log('✅ Updated assignment 7036');
    }

    // Update Bricklaying task (ID 84393) with tools and materials
    console.log('\n📝 Updating Task 84393 (Bricklaying)...');
    const brickTask = await Task.findOne({ id: 84393 });
    if (brickTask) {
      brickTask.requiredTools = [
        'Trowel',
        'Spirit Level',
        'Brick Hammer',
        'Measuring Tape',
        'String Line'
      ];
      brickTask.requiredMaterials = [
        'Bricks',
        'Cement',
        'Sand',
        'Water'
      ];
      await brickTask.save();
      console.log('✅ Updated bricklaying task');
    }

    // Update assignment 7034
    const assignment7034 = await WorkerTaskAssignment.findOne({ id: 7034 });
    if (assignment7034) {
      assignment7034.requiredTools = brickTask.requiredTools;
      assignment7034.requiredMaterials = brickTask.requiredMaterials;
      await assignment7034.save();
      console.log('✅ Updated assignment 7034');
    }

    // Create a new plumbing task as example
    console.log('\n📝 Creating sample Plumbing task...');
    
    // Find the highest task ID
    const highestTask = await Task.findOne().sort({ id: -1 }).limit(1);
    const newTaskId = (highestTask?.id || 84395) + 1;

    const plumbingTask = new Task({
      id: newTaskId,
      companyId: 1,
      projectId: 1003,
      taskType: 'WORK',
      taskName: 'Install Plumbing Pipes',
      description: 'Install PVC pipes for water supply on Level 5',
      trade: 'Plumbing & Sanitary',
      activity: 'Above Ground Works',
      workType: 'Pipe Installation – Level 5',
      requiredTools: [
        'Pipe Cutter',
        'Welding Machine',
        'Alignment Level'
      ],
      requiredMaterials: [
        'PVC Pipes (50mm)',
        'Pipe Clamps',
        'Sealant'
      ],
      status: 'PLANNED',
      assignedBy: 4,
      createdBy: 4
    });

    await plumbingTask.save();
    console.log(`✅ Created plumbing task with ID: ${newTaskId}`);

    // Verify all updates
    console.log('\n✅ Verification:');
    const assignments = await WorkerTaskAssignment.find({
      id: { $in: [7034, 7035, 7036] }
    }).lean();

    for (const assignment of assignments) {
      const task = await Task.findOne({ id: assignment.taskId }).lean();
      console.log(`\n📋 Assignment ${assignment.id} (${task?.taskName}):`);
      console.log(`  Trade: ${assignment.trade || task?.trade || 'NOT SET'}`);
      console.log(`  Activity: ${assignment.activity || task?.activity || 'NOT SET'}`);
      console.log(`  Work Type: ${assignment.workType || task?.workType || 'NOT SET'}`);
      console.log(`  Required Tools: ${(assignment.requiredTools || task?.requiredTools || []).join(', ') || 'NONE'}`);
      console.log(`  Required Materials: ${(assignment.requiredMaterials || task?.requiredMaterials || []).join(', ') || 'NONE'}`);
    }

    // Show the new plumbing task
    console.log(`\n📋 New Plumbing Task (ID ${newTaskId}):`);
    console.log(`  Trade: ${plumbingTask.trade}`);
    console.log(`  Activity: ${plumbingTask.activity}`);
    console.log(`  Work Type: ${plumbingTask.workType}`);
    console.log(`  Required Tools:`);
    plumbingTask.requiredTools.forEach(tool => console.log(`    • ${tool}`));
    console.log(`  Required Materials:`);
    plumbingTask.requiredMaterials.forEach(material => console.log(`    • ${material}`));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

addToolsAndMaterials();
