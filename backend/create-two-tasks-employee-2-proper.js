import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './src/modules/task/Task.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function createTwoTasksEmployee2Proper() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Find the highest task ID
    const lastTask = await Task.findOne().sort({ id: -1 }).select('id');
    const nextTaskId = lastTask ? lastTask.id + 1 : 5000;
    
    // Find the highest assignment ID
    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 }).select('id');
    const nextAssignmentId = lastAssignment ? lastAssignment.id + 1 : 7050;

    console.log(`📊 Next Task ID: ${nextTaskId}`);
    console.log(`📊 Next Assignment ID: ${nextAssignmentId}\n`);

    // ========================================
    // TASK 1: Electrical Wiring Installation
    // ========================================
    const task1 = new Task({
      id: nextTaskId,
      companyId: 1,
      projectId: 1003,
      taskType: 'WORK',
      taskName: "Electrical Wiring Installation",
      description: "Install electrical wiring for the second floor offices",
      trade: "Electrical",
      activity: "Installation",
      workType: "Wiring",
      requiredTools: ["Wire Stripper", "Voltage Tester", "Drill"],
      requiredMaterials: ["Electrical Wire (14 AWG)", "Outlet Boxes", "Wire Nuts"],
      status: 'PLANNED',
      startDate: today,
      createdBy: 4, // Supervisor ID
      assignedBy: 4
    });

    await task1.save();
    console.log(`✅ Created Task ${task1.id}: ${task1.taskName}`);

    // Create assignment for task 1
    const assignment1 = new WorkerTaskAssignment({
      id: nextAssignmentId,
      projectId: 1003,
      employeeId: 2,
      supervisorId: 4,
      taskId: task1.id,
      date: todayStr,
      status: 'queued',
      priority: 'medium',
      companyId: 1,
      dailyTarget: {
        description: "Install 50 electrical outlets",
        quantity: 50,
        unit: "outlets",
        targetCompletion: 100,
        targetType: "Quantity Based",
        areaLevel: "Second Floor - Offices",
        startTime: "8:00 AM",
        expectedFinish: "5:00 PM",
        progressToday: {
          completed: 0,
          total: 50,
          percentage: 0
        }
      },
      trade: "Electrical",
      activity: "Installation",
      workType: "Wiring",
      requiredTools: ["Wire Stripper", "Voltage Tester", "Drill"],
      requiredMaterials: ["Electrical Wire (14 AWG)", "Outlet Boxes", "Wire Nuts"],
      supervisorInstructions: {
        text: "Ensure power is off before starting work. Use insulated tools only. Wear rubber-soled safety boots. All wiring must meet electrical code standards.",
        lastUpdated: today,
        updatedBy: 4
      }
    });

    await assignment1.save();
    console.log(`✅ Created Assignment ${assignment1.id} for Task ${task1.id}`);
    console.log(`   Employee ID: ${assignment1.employeeId} (Ravi Smith)`);
    console.log(`   Date: ${assignment1.date}`);
    console.log(`   Status: ${assignment1.status}\n`);

    // ========================================
    // TASK 2: Bathroom Plumbing Fixtures
    // ========================================
    const task2 = new Task({
      id: nextTaskId + 1,
      companyId: 1,
      projectId: 1003,
      taskType: 'WORK',
      taskName: "Bathroom Plumbing Fixtures",
      description: "Install sinks, toilets, and faucets in the new bathroom facilities",
      trade: "Plumbing",
      activity: "Installation",
      workType: "Fixtures",
      requiredTools: ["Pipe Wrench", "Basin Wrench", "Plumber's Tape"],
      requiredMaterials: ["Toilets", "Sinks", "Faucets", "P-Traps"],
      status: 'PLANNED',
      startDate: today,
      createdBy: 4,
      assignedBy: 4
    });

    await task2.save();
    console.log(`✅ Created Task ${task2.id}: ${task2.taskName}`);

    // Create assignment for task 2
    const assignment2 = new WorkerTaskAssignment({
      id: nextAssignmentId + 1,
      projectId: 1003,
      employeeId: 2,
      supervisorId: 4,
      taskId: task2.id,
      date: todayStr,
      status: 'queued',
      priority: 'high',
      companyId: 1,
      dailyTarget: {
        description: "Install 8 plumbing fixtures",
        quantity: 8,
        unit: "fixtures",
        targetCompletion: 100,
        targetType: "Quantity Based",
        areaLevel: "Ground Floor - Bathrooms",
        startTime: "8:00 AM",
        expectedFinish: "4:00 PM",
        progressToday: {
          completed: 0,
          total: 8,
          percentage: 0
        }
      },
      trade: "Plumbing",
      activity: "Installation",
      workType: "Fixtures",
      requiredTools: ["Pipe Wrench", "Basin Wrench", "Plumber's Tape"],
      requiredMaterials: ["Toilets", "Sinks", "Faucets", "P-Traps"],
      supervisorInstructions: {
        text: "Turn off water supply before starting. Check for leaks after each installation. Priority task - bathrooms needed for building occupancy permit.",
        lastUpdated: today,
        updatedBy: 4
      }
    });

    await assignment2.save();
    console.log(`✅ Created Assignment ${assignment2.id} for Task ${task2.id}`);
    console.log(`   Employee ID: ${assignment2.employeeId} (Ravi Smith)`);
    console.log(`   Date: ${assignment2.date}`);
    console.log(`   Status: ${assignment2.status}\n`);

    // Verify the data
    console.log('='.repeat(60));
    console.log('📋 VERIFICATION - Querying assignments for Employee 2');
    console.log('='.repeat(60));
    
    const allAssignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: todayStr
    }).select('id taskId status priority date');

    console.log(`\n✅ Found ${allAssignments.length} assignments for Employee 2 on ${todayStr}:`);
    
    for (const assignment of allAssignments) {
      const task = await Task.findOne({ id: assignment.taskId }).select('taskName');
      console.log(`\n  Assignment ID: ${assignment.id}`);
      console.log(`  Task ID: ${assignment.taskId}`);
      console.log(`  Task Name: ${task?.taskName || 'N/A'}`);
      console.log(`  Status: ${assignment.status}`);
      console.log(`  Priority: ${assignment.priority}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TWO NEW TASKS CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('🔄 NEXT STEPS:');
    console.log('   1. Restart the backend server');
    console.log('   2. Clear mobile app cache (close app completely)');
    console.log('   3. Reopen mobile app and pull to refresh');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createTwoTasksEmployee2Proper();
