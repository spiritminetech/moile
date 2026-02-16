import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function addTwoTasksEmployee2() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the highest numeric ID
    const lastTask = await WorkerTaskAssignment.findOne().sort({ id: -1 }).select('id');
    const nextId = lastTask ? lastTask.id + 1 : 7046;
    console.log(`📊 Highest ID found: ${lastTask ? lastTask.id : 'none'}`);
    console.log(`🆕 Next ID will be: ${nextId}\n`);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Task 1: Electrical Installation for Employee 2
    const task1 = new WorkerTaskAssignment({
      id: nextId,
      taskName: "Electrical Wiring Installation",
      description: "Install electrical wiring for the second floor offices",
      employeeId: 2,
      projectId: 1003,
      supervisorId: 4,
      status: "queued",
      priority: "medium",
      date: todayStr,
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
    });

    await task1.save();
    console.log(`✅ Created Task ${task1.id}: ${task1.taskName}`);
    console.log(`   Employee ID: ${task1.employeeId} (Ravi Smith)`);
    console.log(`   ID Type: ${typeof task1.id}`);
    console.log(`   Nature of Work: ${task1.natureOfWork}`);
    console.log(`   Priority: ${task1.priority}`);
    console.log(`   Daily Target: ${task1.dailyTarget.quantity} ${task1.dailyTarget.unit}\n`);

    // Task 2: Plumbing Fixture Installation for Employee 2
    const task2 = new WorkerTaskAssignment({
      id: nextId + 1,
      taskName: "Bathroom Plumbing Fixtures",
      description: "Install sinks, toilets, and faucets in the new bathroom facilities",
      employeeId: 2,
      projectId: 1003,
      supervisorId: 4,
      status: "queued",
      priority: "high",
      date: todayStr,
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
    });

    await task2.save();
    console.log(`✅ Created Task ${task2.id}: ${task2.taskName}`);
    console.log(`   Employee ID: ${task2.employeeId} (Ravi Smith)`);
    console.log(`   ID Type: ${typeof task2.id}`);
    console.log(`   Nature of Work: ${task2.natureOfWork}`);
    console.log(`   Priority: ${task2.priority}`);
    console.log(`   Daily Target: ${task2.dailyTarget.quantity} ${task2.dailyTarget.unit}\n`);

    // Verify all tasks for employee 2
    const allTasks = await WorkerTaskAssignment.find({ employeeId: 2 })
      .select('id taskName status priority')
      .sort({ id: 1 });

    console.log('📋 ALL TASKS FOR EMPLOYEE 2 (Ravi Smith):');
    console.log('==========================================');
    allTasks.forEach(task => {
      const statusEmoji = task.status === 'in_progress' ? '🟢' : 
                         task.status === 'paused' ? '🟠' : 
                         task.status === 'completed' ? '✅' : '🔵';
      const priorityEmoji = task.priority === 'high' ? '🔴' : 
                           task.priority === 'medium' ? '🟡' : '🟢';
      console.log(`${statusEmoji} ${priorityEmoji} Task ${task.id}: ${task.taskName}`);
      console.log(`   Status: ${task.status} | Priority: ${task.priority}\n`);
    });

    console.log('✅ TWO NEW TASKS ADDED FOR RAVI SMITH!');
    console.log('======================================');
    console.log('🔄 RESTART THE BACKEND NOW');
    console.log('📱 Then reload the mobile app to see the new tasks');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

addTwoTasksEmployee2();
