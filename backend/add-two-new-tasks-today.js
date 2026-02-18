import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';

dotenv.config();

async function addTwoNewTasksToday() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // 2026-02-16

    console.log(`📅 Today's date: ${todayStr}\n`);

    // Find the highest WorkerTaskAssignment ID
    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 }).select('id');
    const nextAssignmentId = lastAssignment ? lastAssignment.id + 1 : 7062;
    console.log(`📊 Next WorkerTaskAssignment ID: ${nextAssignmentId}\n`);

    // Find the highest Task ID
    const lastTask = await Task.findOne().sort({ id: -1 }).select('id');
    const nextTaskId = lastTask ? lastTask.id + 1 : 84409;
    console.log(`📊 Next Task ID: ${nextTaskId}\n`);

    // Create Task 1: Electrical Installation
    const task1 = new Task({
      id: nextTaskId,
      taskName: "Electrical Wiring Installation",
      description: "Install electrical wiring for the second floor offices",
      projectId: 1002,
      taskType: "WORK",
      status: "PLANNED",
      companyId: 1,
      trade: "Electrical",
      activity: "Installation",
      workType: "Wiring",
      startDate: today,
      createdAt: today,
      updatedAt: today
    });
    await task1.save();
    console.log(`✅ Created Task ${task1.id}: ${task1.taskName}`);

    // Create Task 2: Plumbing Installation
    const task2 = new Task({
      id: nextTaskId + 1,
      taskName: "Bathroom Plumbing Fixtures",
      description: "Install sinks, toilets, and faucets in the new bathroom facilities",
      projectId: 1003,
      taskType: "WORK",
      status: "PLANNED",
      companyId: 1,
      trade: "Plumbing",
      activity: "Installation",
      workType: "Fixtures",
      startDate: today,
      createdAt: today,
      updatedAt: today
    });
    await task2.save();
    console.log(`✅ Created Task ${task2.id}: ${task2.taskName}\n`);

    // Create WorkerTaskAssignment 1
    const assignment1 = new WorkerTaskAssignment({
      id: nextAssignmentId,
      taskName: "Electrical Wiring Installation",
      description: "Install electrical wiring for the second floor offices",
      employeeId: 2,
      projectId: 1002,
      supervisorId: 4,
      taskId: task1.id,
      status: "queued",
      priority: "medium",
      date: todayStr,
      assignedDate: today,
      startDate: today,
      dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      progressPercent: 0,
      natureOfWork: "Electrical",
      companyId: 1,
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
    await assignment1.save();
    console.log(`✅ Created WorkerTaskAssignment ${assignment1.id}`);
    console.log(`   Employee ID: ${assignment1.employeeId} (Ravi Smith)`);
    console.log(`   Project ID: ${assignment1.projectId}`);
    console.log(`   Task ID: ${assignment1.taskId}`);
    console.log(`   Date: ${assignment1.date}`);
    console.log(`   Status: ${assignment1.status}\n`);

    // Create WorkerTaskAssignment 2
    const assignment2 = new WorkerTaskAssignment({
      id: nextAssignmentId + 1,
      taskName: "Bathroom Plumbing Fixtures",
      description: "Install sinks, toilets, and faucets in the new bathroom facilities",
      employeeId: 2,
      projectId: 1003,
      supervisorId: 4,
      taskId: task2.id,
      status: "queued",
      priority: "high",
      date: todayStr,
      assignedDate: today,
      startDate: today,
      dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      progressPercent: 0,
      natureOfWork: "Plumbing",
      companyId: 1,
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
    await assignment2.save();
    console.log(`✅ Created WorkerTaskAssignment ${assignment2.id}`);
    console.log(`   Employee ID: ${assignment2.employeeId} (Ravi Smith)`);
    console.log(`   Project ID: ${assignment2.projectId}`);
    console.log(`   Task ID: ${assignment2.taskId}`);
    console.log(`   Date: ${assignment2.date}`);
    console.log(`   Status: ${assignment2.status}\n`);

    // Verify all tasks for employee 2 today
    const todayTasks = await WorkerTaskAssignment.find({ 
      employeeId: 2,
      date: todayStr
    }).sort({ id: 1 });

    console.log('📋 ALL TASKS FOR EMPLOYEE 2 TODAY:');
    console.log('==========================================');
    todayTasks.forEach(task => {
      const statusEmoji = task.status === 'in_progress' ? '🟢' : 
                         task.status === 'paused' ? '🟠' : 
                         task.status === 'completed' ? '✅' : '🔵';
      const priorityEmoji = task.priority === 'high' ? '🔴' : 
                           task.priority === 'medium' ? '🟡' : '🟢';
      console.log(`${statusEmoji} ${priorityEmoji} Task ${task.id}: ${task.taskName || 'Unnamed'}`);
      console.log(`   Status: ${task.status} | ProjectId: ${task.projectId} | TaskId: ${task.taskId}`);
    });

    console.log('\n✅ TWO NEW TASKS ADDED FOR TODAY!');
    console.log('======================================');
    console.log('📊 Summary:');
    console.log(`   - Total tasks for employee 2 today: ${todayTasks.length}`);
    console.log(`   - Task 1: Electrical (ProjectId: 1002, TaskId: ${task1.id})`);
    console.log(`   - Task 2: Plumbing (ProjectId: 1003, TaskId: ${task2.id})`);
    console.log('\n🔄 RESTART THE BACKEND NOW');
    console.log('📱 Then reload the mobile app to see the new tasks');
    console.log('🔐 Clock-in will work with ProjectId 1002 or 1003');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

addTwoNewTasksToday();
