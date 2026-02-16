import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function fixAndAddTwoTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // First, find the highest numeric ID across ALL tasks
    const lastTask = await WorkerTaskAssignment.findOne({ id: { $type: 'number' } })
      .sort({ id: -1 })
      .select('id');

    const nextId = lastTask ? lastTask.id + 1 : 7044;
    console.log(`📊 Highest numeric ID found: ${lastTask ? lastTask.id : 'none'}`);
    console.log(`🆕 Next ID will be: ${nextId}\n`);

    // Delete the incorrectly created tasks (with ObjectId in id field)
    const deleteResult = await WorkerTaskAssignment.deleteMany({
      employeeId: 107,
      id: { $type: 'string' }
    });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} tasks with incorrect ID format\n`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Task 1: Electrical Installation
    const task1 = {
      id: nextId,
      taskName: "Electrical Wiring Installation",
      description: "Install electrical wiring for the second floor offices",
      employeeId: 107,
      projectId: 1003,
      supervisorId: 4,
      status: "queued",
      priority: "medium",
      assignedDate: today,
      startDate: today,
      dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      progressPercent: 0,
      natureOfWork: "Electrical",
      dailyTarget: {
        quantity: 50,
        unit: "outlets",
        description: "Install 50 electrical outlets",
        progressToday: {
          completed: 0,
          total: 50,
          percentage: 0
        }
      },
      supervisorInstructions: {
        safetyRequirements: [
          "Ensure power is off before starting work",
          "Use insulated tools only",
          "Wear rubber-soled safety boots"
        ],
        qualityStandards: [
          "All wiring must meet electrical code standards",
          "Test each outlet after installation",
          "Label all circuit breakers clearly"
        ],
        specialNotes: "Coordinate with the HVAC team for ceiling access"
      },
      toolsRequired: [
        { name: "Wire Stripper", quantity: 2 },
        { name: "Voltage Tester", quantity: 1 },
        { name: "Drill", quantity: 1 }
      ],
      materialsRequired: [
        { name: "Electrical Wire (14 AWG)", quantity: 500, unit: "meters" },
        { name: "Outlet Boxes", quantity: 50, unit: "pieces" },
        { name: "Wire Nuts", quantity: 200, unit: "pieces" }
      ]
    };

    // Task 2: Plumbing Fixture Installation
    const task2 = {
      id: nextId + 1,
      taskName: "Bathroom Plumbing Fixtures",
      description: "Install sinks, toilets, and faucets in the new bathroom facilities",
      employeeId: 107,
      projectId: 1003,
      supervisorId: 4,
      status: "queued",
      priority: "high",
      assignedDate: today,
      startDate: today,
      dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      progressPercent: 0,
      natureOfWork: "Plumbing",
      dailyTarget: {
        quantity: 8,
        unit: "fixtures",
        description: "Install 8 plumbing fixtures",
        progressToday: {
          completed: 0,
          total: 8,
          percentage: 0
        }
      },
      supervisorInstructions: {
        safetyRequirements: [
          "Turn off water supply before starting",
          "Check for leaks after each installation",
          "Wear safety gloves when handling fixtures"
        ],
        qualityStandards: [
          "All connections must be watertight",
          "Test water pressure after installation",
          "Ensure proper drainage for all fixtures"
        ],
        specialNotes: "Priority task - bathrooms needed for building occupancy permit"
      },
      toolsRequired: [
        { name: "Pipe Wrench", quantity: 2 },
        { name: "Basin Wrench", quantity: 1 },
        { name: "Plumber's Tape", quantity: 5 }
      ],
      materialsRequired: [
        { name: "Toilets", quantity: 4, unit: "pieces" },
        { name: "Sinks", quantity: 4, unit: "pieces" },
        { name: "Faucets", quantity: 4, unit: "pieces" },
        { name: "P-Traps", quantity: 4, unit: "pieces" }
      ]
    };

    // Insert both tasks
    await WorkerTaskAssignment.create(task1);
    console.log(`✅ Created Task ${task1.id}: ${task1.taskName}`);
    console.log(`   Nature of Work: ${task1.natureOfWork}`);
    console.log(`   Priority: ${task1.priority}`);
    console.log(`   Daily Target: ${task1.dailyTarget.quantity} ${task1.dailyTarget.unit}`);
    console.log(`   Status: ${task1.status}\n`);

    await WorkerTaskAssignment.create(task2);
    console.log(`✅ Created Task ${task2.id}: ${task2.taskName}`);
    console.log(`   Nature of Work: ${task2.natureOfWork}`);
    console.log(`   Priority: ${task2.priority}`);
    console.log(`   Daily Target: ${task2.dailyTarget.quantity} ${task2.dailyTarget.unit}`);
    console.log(`   Status: ${task2.status}\n`);

    // Verify all tasks for employee 107 with numeric IDs
    const allTasks = await WorkerTaskAssignment.find({ 
      employeeId: 107,
      id: { $type: 'number' }
    })
      .select('id taskName status progressPercent priority')
      .sort({ id: 1 });

    console.log('📋 ALL TASKS FOR EMPLOYEE 107 (with numeric IDs):');
    console.log('==================================================');
    allTasks.forEach(task => {
      const statusEmoji = task.status === 'in_progress' ? '🟢' : 
                         task.status === 'paused' ? '🟠' : 
                         task.status === 'completed' ? '✅' : '🔵';
      const priorityEmoji = task.priority === 'high' ? '🔴' : 
                           task.priority === 'medium' ? '🟡' : '🟢';
      console.log(`${statusEmoji} ${priorityEmoji} Task ${task.id}: ${task.taskName}`);
      console.log(`   Status: ${task.status} | Priority: ${task.priority} | Progress: ${task.progressPercent || 0}%\n`);
    });

    console.log('\n✅ TWO NEW TASKS ADDED SUCCESSFULLY!');
    console.log('====================================');
    console.log('🔄 RESTART THE BACKEND to see the new tasks');
    console.log('📱 Then reload the mobile app to see them in Today\'s Tasks');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixAndAddTwoTasks();
