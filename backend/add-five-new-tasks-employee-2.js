import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './src/modules/task/Task.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function addFiveNewTasksEmployee2() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Find the highest task ID
    const lastTask = await Task.findOne().sort({ id: -1 }).select('id');
    const nextTaskId = lastTask ? lastTask.id + 1 : 84404;
    
    // Find the highest assignment ID
    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 }).select('id');
    const nextAssignmentId = lastAssignment ? lastAssignment.id + 1 : 7054;

    console.log(`📊 Next Task ID: ${nextTaskId}`);
    console.log(`📊 Next Assignment ID: ${nextAssignmentId}\n`);

    const tasksData = [
      {
        taskName: "HVAC Duct Installation",
        description: "Install HVAC ductwork for the third floor ventilation system",
        trade: "HVAC",
        activity: "Installation",
        workType: "Ductwork",
        priority: "high",
        requiredTools: ["Sheet Metal Shears", "Duct Tape", "Measuring Tape"],
        requiredMaterials: ["Metal Ducts", "Duct Connectors", "Insulation"],
        dailyTarget: {
          quantity: 40,
          unit: "meters",
          description: "Install 40 meters of HVAC ductwork",
          targetType: "Quantity Based",
          areaLevel: "Third Floor - Main Area",
          startTime: "8:00 AM",
          expectedFinish: "5:00 PM"
        },
        instructions: "Ensure all duct connections are sealed properly. Follow HVAC specifications. Coordinate with electrical team for ceiling access."
      },
      {
        taskName: "Drywall Installation",
        description: "Install drywall panels for interior walls on the second floor",
        trade: "Carpentry",
        activity: "Installation",
        workType: "Drywall",
        priority: "medium",
        requiredTools: ["Drywall Saw", "T-Square", "Screw Gun"],
        requiredMaterials: ["Drywall Sheets", "Drywall Screws", "Joint Compound"],
        dailyTarget: {
          quantity: 100,
          unit: "sqm",
          description: "Install 100 square meters of drywall",
          targetType: "Area Based",
          areaLevel: "Second Floor - Office Rooms",
          startTime: "8:00 AM",
          expectedFinish: "4:30 PM"
        },
        instructions: "Stagger joints for strength. Ensure proper spacing between screws. Check for level before securing."
      },
      {
        taskName: "Floor Tile Installation",
        description: "Install ceramic floor tiles in the lobby and entrance area",
        trade: "Tiling",
        activity: "Installation",
        workType: "Flooring",
        priority: "high",
        requiredTools: ["Tile Cutter", "Trowel", "Level", "Spacers"],
        requiredMaterials: ["Ceramic Tiles", "Tile Adhesive", "Grout"],
        dailyTarget: {
          quantity: 60,
          unit: "sqm",
          description: "Install 60 square meters of floor tiles",
          targetType: "Area Based",
          areaLevel: "Ground Floor - Lobby",
          startTime: "7:00 AM",
          expectedFinish: "5:00 PM"
        },
        instructions: "Priority task for building opening. Ensure tiles are level and properly spaced. Allow 24 hours for adhesive to cure."
      },
      {
        taskName: "Window Frame Installation",
        description: "Install aluminum window frames for the east wing offices",
        trade: "Carpentry",
        activity: "Installation",
        workType: "Windows",
        priority: "medium",
        requiredTools: ["Level", "Drill", "Caulking Gun"],
        requiredMaterials: ["Window Frames", "Screws", "Sealant"],
        dailyTarget: {
          quantity: 15,
          unit: "units",
          description: "Install 15 window frames",
          targetType: "Quantity Based",
          areaLevel: "East Wing - All Floors",
          startTime: "8:00 AM",
          expectedFinish: "5:00 PM"
        },
        instructions: "Check frame alignment before securing. Apply weatherproof sealant around all edges. Test opening mechanism."
      },
      {
        taskName: "Fire Safety Equipment Installation",
        description: "Install fire extinguishers, smoke detectors, and emergency lighting",
        trade: "Safety",
        activity: "Installation",
        workType: "Fire Safety",
        priority: "critical",
        requiredTools: ["Drill", "Wire Stripper", "Ladder"],
        requiredMaterials: ["Fire Extinguishers", "Smoke Detectors", "Emergency Lights", "Mounting Brackets"],
        dailyTarget: {
          quantity: 25,
          unit: "devices",
          description: "Install 25 fire safety devices",
          targetType: "Quantity Based",
          areaLevel: "All Floors - Building Wide",
          startTime: "8:00 AM",
          expectedFinish: "4:00 PM"
        },
        instructions: "CRITICAL: Required for building occupancy permit. Follow fire code regulations. Test all devices after installation. Document locations."
      }
    ];

    console.log('🔨 Creating 5 new tasks and assignments...\n');

    for (let i = 0; i < tasksData.length; i++) {
      const taskData = tasksData[i];
      const taskId = nextTaskId + i;
      const assignmentId = nextAssignmentId + i;

      // Create Task
      const task = new Task({
        id: taskId,
        companyId: 1,
        projectId: 1003,
        taskType: 'WORK',
        taskName: taskData.taskName,
        description: taskData.description,
        trade: taskData.trade,
        activity: taskData.activity,
        workType: taskData.workType,
        requiredTools: taskData.requiredTools,
        requiredMaterials: taskData.requiredMaterials,
        status: 'PLANNED',
        startDate: today,
        createdBy: 4,
        assignedBy: 4
      });

      await task.save();
      console.log(`✅ Created Task ${task.id}: ${task.taskName}`);

      // Create Assignment
      const assignment = new WorkerTaskAssignment({
        id: assignmentId,
        projectId: 1003,
        employeeId: 2,
        supervisorId: 4,
        taskId: task.id,
        date: todayStr,
        status: 'queued',
        priority: taskData.priority,
        companyId: 1,
        dailyTarget: {
          description: taskData.dailyTarget.description,
          quantity: taskData.dailyTarget.quantity,
          unit: taskData.dailyTarget.unit,
          targetCompletion: 100,
          targetType: taskData.dailyTarget.targetType,
          areaLevel: taskData.dailyTarget.areaLevel,
          startTime: taskData.dailyTarget.startTime,
          expectedFinish: taskData.dailyTarget.expectedFinish,
          progressToday: {
            completed: 0,
            total: taskData.dailyTarget.quantity,
            percentage: 0
          }
        },
        trade: taskData.trade,
        activity: taskData.activity,
        workType: taskData.workType,
        requiredTools: taskData.requiredTools,
        requiredMaterials: taskData.requiredMaterials,
        supervisorInstructions: {
          text: taskData.instructions,
          lastUpdated: today,
          updatedBy: 4
        }
      });

      await assignment.save();
      console.log(`   ✅ Assignment ${assignment.id} created`);
      console.log(`   Priority: ${assignment.priority} | Target: ${taskData.dailyTarget.quantity} ${taskData.dailyTarget.unit}\n`);
    }

    // Verify final state
    const allAssignments = await WorkerTaskAssignment.find({
      employeeId: 2,
      date: todayStr
    }).sort({ id: 1 });

    console.log('='.repeat(70));
    console.log('📋 FINAL STATE - ALL TASKS FOR EMPLOYEE 2');
    console.log('='.repeat(70));
    console.log(`Total Assignments: ${allAssignments.length}\n`);

    // Count by status
    const statusCounts = allAssignments.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    console.log('By Status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const emoji = status === 'in_progress' ? '🟢' : 
                   status === 'paused' ? '🟠' : 
                   status === 'completed' ? '✅' : '🔵';
      console.log(`  ${emoji} ${status}: ${count}`);
    });

    // Count by priority
    const priorityCounts = allAssignments.reduce((acc, a) => {
      acc[a.priority] = (acc[a.priority] || 0) + 1;
      return acc;
    }, {});

    console.log('\nBy Priority:');
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      const emoji = priority === 'critical' ? '🔴🔴' :
                   priority === 'high' ? '🔴' : 
                   priority === 'medium' ? '🟡' : '🟢';
      console.log(`  ${emoji} ${priority}: ${count}`);
    });

    // Show new tasks
    const newTasks = allAssignments.filter(a => a.id >= nextAssignmentId);
    console.log('\n' + '='.repeat(70));
    console.log('🆕 NEW TASKS ADDED (5 tasks)');
    console.log('='.repeat(70));
    for (const assignment of newTasks) {
      const task = await Task.findOne({ id: assignment.taskId });
      const priorityEmoji = assignment.priority === 'critical' ? '🔴🔴' :
                           assignment.priority === 'high' ? '🔴' : 
                           assignment.priority === 'medium' ? '🟡' : '🟢';
      console.log(`\n${priorityEmoji} Assignment ${assignment.id}: ${task?.taskName || 'N/A'}`);
      console.log(`   Priority: ${assignment.priority}`);
      console.log(`   Target: ${assignment.dailyTarget.quantity} ${assignment.dailyTarget.unit}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ 5 NEW TASKS CREATED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('🔄 NEXT STEPS:');
    console.log('   1. Restart the backend server');
    console.log('   2. Clear mobile app cache completely');
    console.log('   3. Reopen mobile app and pull to refresh');
    console.log('   4. You should now see 17 total tasks for Employee 2');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

addFiveNewTasksEmployee2();
