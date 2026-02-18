import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function addTwoMoreTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get current date for today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Task 4: Install Electrical Fixtures
    const task4 = {
      taskId: 7036,
      employeeId: 2,
      projectId: 1003,
      assignedDate: today,
      status: 'queued',
      priority: 'medium',
      taskName: 'Install Electrical Fixtures',
      description: 'Install light fixtures and electrical outlets in classrooms',
      location: 'Building A - Classrooms',
      estimatedHours: 4,
      actualHours: 0,
      startTime: null,
      endTime: null,
      notes: '',
      supervisorId: 4,
      supervisorName: 'Kawaja',
      supervisorEmail: 'kawaja@construction.com',
      supervisorPhone: '+9876543210',
      supervisorInstructions: 'Follow electrical safety protocols. Test all connections before final installation.',
      sequence: 4,
      dependencies: [7035], // Depends on LED Installation task
      toolsRequired: ['Screwdriver Set', 'Wire Stripper', 'Voltage Tester', 'Drill'],
      materialsRequired: ['Light Fixtures', 'Electrical Outlets', 'Wire Connectors', 'Mounting Brackets'],
      safetyRequirements: ['Electrical Safety Gloves', 'Safety Glasses', 'Insulated Tools'],
      dailyTarget: {
        targetQuantity: 12,
        targetUnit: 'fixtures',
        targetDescription: 'Install 12 light fixtures and outlets',
        completedQuantity: 0,
        progressPercentage: 0
      }
    };

    // Task 5: Paint Interior Walls
    const task5 = {
      taskId: 7037,
      employeeId: 2,
      projectId: 1003,
      assignedDate: today,
      status: 'queued',
      priority: 'low',
      taskName: 'Paint Interior Walls',
      description: 'Apply primer and paint to classroom walls',
      location: 'Building A - Classrooms',
      estimatedHours: 6,
      actualHours: 0,
      startTime: null,
      endTime: null,
      notes: '',
      supervisorId: 4,
      supervisorName: 'Kawaja',
      supervisorEmail: 'kawaja@construction.com',
      supervisorPhone: '+9876543210',
      supervisorInstructions: 'Apply one coat of primer, then two coats of paint. Allow proper drying time between coats.',
      sequence: 5,
      dependencies: [7036], // Depends on Electrical Fixtures task
      toolsRequired: ['Paint Roller', 'Paint Brushes', 'Paint Tray', 'Drop Cloth', 'Ladder'],
      materialsRequired: ['Primer', 'Interior Paint', 'Painter\'s Tape', 'Sandpaper'],
      safetyRequirements: ['Dust Mask', 'Safety Glasses', 'Gloves'],
      dailyTarget: {
        targetQuantity: 200,
        targetUnit: 'sq ft',
        targetDescription: 'Paint 200 square feet of wall area',
        completedQuantity: 0,
        progressPercentage: 0
      }
    };

    console.log('\n📝 Creating Task 4: Install Electrical Fixtures...');
    const createdTask4 = await WorkerTaskAssignment.create(task4);
    console.log('✅ Task 4 created:', {
      taskId: createdTask4.taskId,
      taskName: createdTask4.taskName,
      status: createdTask4.status,
      priority: createdTask4.priority,
      sequence: createdTask4.sequence
    });

    console.log('\n📝 Creating Task 5: Paint Interior Walls...');
    const createdTask5 = await WorkerTaskAssignment.create(task5);
    console.log('✅ Task 5 created:', {
      taskId: createdTask5.taskId,
      taskName: createdTask5.taskName,
      status: createdTask5.status,
      priority: createdTask5.priority,
      sequence: createdTask5.sequence
    });

    // Verify all tasks for employee 2
    console.log('\n📊 Verifying all tasks for Ravi (Employee ID: 2)...');
    const allTasks = await WorkerTaskAssignment.find({ 
      employeeId: 2,
      assignedDate: { $gte: today }
    }).sort({ sequence: 1 });

    console.log(`\n✅ Total tasks found: ${allTasks.length}`);
    allTasks.forEach((task, index) => {
      console.log(`\nTask ${index + 1}:`);
      console.log(`  Task ID: ${task.taskId}`);
      console.log(`  Name: ${task.taskName}`);
      console.log(`  Status: ${task.status}`);
      console.log(`  Priority: ${task.priority}`);
      console.log(`  Sequence: ${task.sequence}`);
      console.log(`  Dependencies: ${task.dependencies?.join(', ') || 'None'}`);
      console.log(`  Daily Target: ${task.dailyTarget?.targetQuantity || 0} ${task.dailyTarget?.targetUnit || ''}`);
    });

    console.log('\n✅ Successfully added 2 new tasks!');
    console.log('\n📱 Refresh the mobile app to see the new tasks.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

addTwoMoreTasks();
