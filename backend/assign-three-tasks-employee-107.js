// Assign three tasks for Employee 107 (Raj Kumar) for today
import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import Task from './src/modules/task/Task.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function assignThreeTasksForEmployee107() {
  console.log('📋 Assigning Three Tasks for Employee 107');
  console.log('=========================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get Employee 107
    const employee = await Employee.findOne({ id: 107 });
    if (!employee) {
      console.log('❌ Employee 107 not found');
      return;
    }

    console.log('\n👤 Employee Details:');
    console.log(`   Employee ID: ${employee.id}`);
    console.log(`   Name: ${employee.fullName}`);
    console.log(`   Company ID: ${employee.companyId}`);

    // Get today's date
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log(`\n📅 Today's Date: ${today}`);

    // Check if tasks already assigned for today
    const existingAssignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    });

    console.log(`\n🔍 Existing assignments for today: ${existingAssignments.length}`);
    if (existingAssignments.length > 0) {
      console.log('   Existing assignments:');
      existingAssignments.forEach((assignment, index) => {
        console.log(`   ${index + 1}. Assignment ID: ${assignment.id}, Task ID: ${assignment.taskId}, Project: ${assignment.projectId}`);
      });
    }

    // Get available projects
    const projects = await Project.find({ companyId: employee.companyId }).limit(3);
    console.log(`\n🏗️ Available Projects: ${projects.length}`);
    projects.forEach(project => {
      console.log(`   - Project ${project.id}: ${project.projectName}`);
    });

    // Get available tasks
    const availableTasks = await Task.find({ 
      companyId: employee.companyId,
      status: { $in: ['PLANNED', 'IN_PROGRESS'] }
    }).limit(10);

    console.log(`\n📋 Available Tasks: ${availableTasks.length}`);
    availableTasks.forEach(task => {
      console.log(`   - Task ${task.id}: ${task.taskName} (${task.taskType}) - Project ${task.projectId}`);
    });

    // Create three task assignments for today
    console.log('\n🎯 Creating Three Task Assignments...');

    // Get the next assignment ID
    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 }).select("id");
    let nextAssignmentId = lastAssignment ? lastAssignment.id + 1 : 1000;

    // Define three tasks to assign
    const tasksToAssign = [
      {
        taskName: 'Foundation Inspection',
        taskType: 'Inspection',
        description: 'Inspect foundation work and document progress',
        workArea: 'Foundation',
        floor: 'Ground Level',
        zone: 'Zone A',
        priority: 'high',
        sequence: 1,
        timeEstimate: {
          estimated: 120, // 2 hours
          elapsed: 0,
          remaining: 120
        },
        dailyTarget: {
          description: 'Complete foundation inspection',
          quantity: 1,
          unit: 'inspection',
          targetCompletion: 100
        }
      },
      {
        taskName: 'Material Delivery Coordination',
        taskType: 'Deliver Material',
        description: 'Coordinate delivery of construction materials to site',
        workArea: 'Storage Area',
        floor: 'Ground Level',
        zone: 'Zone B',
        priority: 'medium',
        sequence: 2,
        timeEstimate: {
          estimated: 90, // 1.5 hours
          elapsed: 0,
          remaining: 90
        },
        dailyTarget: {
          description: 'Coordinate material delivery',
          quantity: 5,
          unit: 'deliveries',
          targetCompletion: 100
        }
      },
      {
        taskName: 'Work Progress Documentation',
        taskType: 'Work Progress',
        description: 'Document daily work progress and update project status',
        workArea: 'Site Office',
        floor: 'Ground Level',
        zone: 'Zone C',
        priority: 'medium',
        sequence: 3,
        timeEstimate: {
          estimated: 60, // 1 hour
          elapsed: 0,
          remaining: 60
        },
        dailyTarget: {
          description: 'Complete progress documentation',
          quantity: 1,
          unit: 'report',
          targetCompletion: 100
        }
      }
    ];

    // Create task records if they don't exist
    console.log('\n📝 Creating/Finding Tasks...');
    const createdTasks = [];

    for (let i = 0; i < tasksToAssign.length; i++) {
      const taskData = tasksToAssign[i];
      
      // Check if task already exists
      let task = await Task.findOne({ 
        taskName: taskData.taskName,
        companyId: employee.companyId 
      });

      if (!task) {
        // Get next task ID
        const lastTask = await Task.findOne().sort({ id: -1 }).select("id");
        const nextTaskId = lastTask ? lastTask.id + 1 : 1000;

        // Create new task
        task = new Task({
          id: nextTaskId,
          companyId: employee.companyId,
          projectId: projects[0]?.id || 1, // Use first available project
          taskType: taskData.taskType,
          taskName: taskData.taskName,
          description: taskData.description,
          status: 'PLANNED',
          createdBy: 1 // System created
        });

        await task.save();
        console.log(`   ✅ Created Task ${task.id}: ${task.taskName}`);
      } else {
        console.log(`   ✅ Found existing Task ${task.id}: ${task.taskName}`);
      }

      createdTasks.push({ task, assignmentData: taskData });
    }

    // Create task assignments
    console.log('\n🎯 Creating Task Assignments...');
    const assignments = [];

    for (let i = 0; i < createdTasks.length; i++) {
      const { task, assignmentData } = createdTasks[i];

      // Check if assignment already exists
      const existingAssignment = await WorkerTaskAssignment.findOne({
        employeeId: employee.id,
        taskId: task.id,
        date: today
      });

      if (existingAssignment) {
        console.log(`   ⚠️ Assignment already exists for Task ${task.id}`);
        assignments.push(existingAssignment);
        continue;
      }

      // Create new assignment
      const assignment = new WorkerTaskAssignment({
        id: nextAssignmentId++,
        projectId: task.projectId,
        employeeId: employee.id,
        supervisorId: 1, // Default supervisor
        taskId: task.id,
        date: today,
        status: 'queued',
        companyId: employee.companyId,
        dailyTarget: assignmentData.dailyTarget,
        workArea: assignmentData.workArea,
        floor: assignmentData.floor,
        zone: assignmentData.zone,
        timeEstimate: assignmentData.timeEstimate,
        priority: assignmentData.priority,
        sequence: assignmentData.sequence,
        dependencies: i > 0 ? [assignments[i-1].id] : [], // Each task depends on previous
        geofenceValidation: {
          required: true
        }
      });

      await assignment.save();
      console.log(`   ✅ Created Assignment ${assignment.id}: ${task.taskName}`);
      assignments.push(assignment);
    }

    // Summary
    console.log('\n📊 ASSIGNMENT SUMMARY:');
    console.log(`   Employee: ${employee.fullName} (ID: ${employee.id})`);
    console.log(`   Date: ${today}`);
    console.log(`   Total Assignments: ${assignments.length}`);
    console.log('');

    assignments.forEach((assignment, index) => {
      const task = createdTasks[index].task;
      console.log(`   ${index + 1}. ${task.taskName}`);
      console.log(`      Assignment ID: ${assignment.id}`);
      console.log(`      Task ID: ${task.id}`);
      console.log(`      Project ID: ${assignment.projectId}`);
      console.log(`      Priority: ${assignment.priority}`);
      console.log(`      Estimated Time: ${assignment.timeEstimate.estimated} minutes`);
      console.log(`      Work Area: ${assignment.workArea}`);
      console.log(`      Status: ${assignment.status}`);
      console.log('');
    });

    console.log('✅ Three tasks successfully assigned to Employee 107 for today!');
    console.log('\n📱 Employee can now see these tasks in the mobile app:');
    console.log('   - Today\'s Tasks screen will show 3 tasks');
    console.log('   - Tasks are in sequence (1 → 2 → 3)');
    console.log('   - Each task has estimated time and work area');
    console.log('   - Tasks can be started once location is validated');

  } catch (error) {
    console.error('❌ Assignment failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

assignThreeTasksForEmployee107();