// Assign three tasks and project for Employee 107 for today
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import Task from './src/modules/task/Task.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

// Load environment variables
dotenv.config();

async function assignTasksForEmployee107Today() {
  console.log('📋 Assigning Three Tasks and Project for Employee 107 - Today');
  console.log('===========================================================');

  try {
    // Connect to MongoDB using environment variable
    await mongoose.connect(process.env.MONGODB_URI);
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
      
      // Clear existing assignments for fresh start
      console.log('\n🧹 Clearing existing assignments for fresh start...');
      await WorkerTaskAssignment.deleteMany({
        employeeId: employee.id,
        date: today
      });
      console.log('✅ Existing assignments cleared');
    }

    // Get or create a project for the employee
    let project = await Project.findOne({ companyId: employee.companyId });
    if (!project) {
      // Create a default project
      const lastProject = await Project.findOne().sort({ id: -1 }).select("id");
      const nextProjectId = lastProject ? lastProject.id + 1 : 1;

      project = new Project({
        id: nextProjectId,
        companyId: employee.companyId,
        projectName: 'Construction Site Alpha',
        description: 'Main construction project site',
        status: 'ACTIVE',
        startDate: new Date(),
        location: {
          address: 'Construction Site, City',
          coordinates: {
            latitude: 12.9716,
            longitude: 77.5946
          }
        },
        geofence: {
          center: {
            latitude: 12.9716,
            longitude: 77.5946
          },
          radius: 100 // 100 meters
        }
      });

      await project.save();
      console.log(`\n🏗️ Created new project: ${project.projectName} (ID: ${project.id})`);
    } else {
      console.log(`\n🏗️ Using existing project: ${project.projectName} (ID: ${project.id})`);
    }

    // Define three tasks to assign for today
    const tasksToAssign = [
      {
        taskName: 'Morning Site Inspection',
        taskType: 'Inspection',
        description: 'Conduct morning safety and progress inspection of the construction site',
        workArea: 'Main Construction Area',
        floor: 'Ground Level',
        zone: 'Zone A',
        priority: 'high',
        sequence: 1,
        timeEstimate: {
          estimated: 90, // 1.5 hours
          elapsed: 0,
          remaining: 90
        },
        dailyTarget: {
          description: 'Complete morning site inspection',
          quantity: 1,
          unit: 'inspection',
          targetCompletion: 100
        }
      },
      {
        taskName: 'Material Delivery Check',
        taskType: 'Deliver Material',
        description: 'Check quality of delivered materials and update inventory',
        workArea: 'Storage Area',
        floor: 'Ground Level',
        zone: 'Zone B',
        priority: 'high',
        sequence: 2,
        timeEstimate: {
          estimated: 120, // 2 hours
          elapsed: 0,
          remaining: 120
        },
        dailyTarget: {
          description: 'Quality check all delivered materials',
          quantity: 10,
          unit: 'batches',
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
          description: 'Complete daily progress report',
          quantity: 1,
          unit: 'report',
          targetCompletion: 100
        }
      }
    ];

    // Create task records and assignments
    console.log('\n📝 Creating Tasks and Assignments...');
    const assignments = [];

    // Get next assignment ID
    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 }).select("id");
    let nextAssignmentId = lastAssignment ? lastAssignment.id + 1 : 1000;

    for (let i = 0; i < tasksToAssign.length; i++) {
      const taskData = tasksToAssign[i];
      
      // Check if task already exists
      let task = await Task.findOne({ 
        taskName: taskData.taskName,
        companyId: employee.companyId,
        projectId: project.id
      });

      if (!task) {
        // Get next task ID
        const lastTask = await Task.findOne().sort({ id: -1 }).select("id");
        const nextTaskId = lastTask ? lastTask.id + 1 : 1000;

        // Create new task
        task = new Task({
          id: nextTaskId,
          companyId: employee.companyId,
          projectId: project.id,
          taskType: taskData.taskType,
          taskName: taskData.taskName,
          description: taskData.description,
          status: 'PLANNED',
          priority: taskData.priority,
          createdBy: 1, // System created
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await task.save();
        console.log(`   ✅ Created Task ${task.id}: ${task.taskName}`);
      } else {
        console.log(`   ✅ Found existing Task ${task.id}: ${task.taskName}`);
      }

      // Create task assignment
      const assignment = new WorkerTaskAssignment({
        id: nextAssignmentId++,
        projectId: project.id,
        employeeId: employee.id,
        supervisorId: 1, // Default supervisor
        taskId: task.id,
        date: today,
        status: 'queued',
        companyId: employee.companyId,
        dailyTarget: taskData.dailyTarget,
        workArea: taskData.workArea,
        floor: taskData.floor,
        zone: taskData.zone,
        timeEstimate: taskData.timeEstimate,
        priority: taskData.priority,
        sequence: taskData.sequence,
        dependencies: i > 0 ? [assignments[i-1].id] : [], // Each task depends on previous
        geofenceValidation: {
          required: true,
          tolerance: 50 // 50 meters tolerance
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await assignment.save();
      console.log(`   ✅ Created Assignment ${assignment.id}: ${task.taskName}`);
      assignments.push({ assignment, task });
    }

    // Summary
    console.log('\n📊 ASSIGNMENT SUMMARY:');
    console.log('======================');
    console.log(`👤 Employee: ${employee.fullName} (ID: ${employee.id})`);
    console.log(`🏗️ Project: ${project.projectName} (ID: ${project.id})`);
    console.log(`📅 Date: ${today}`);
    console.log(`📋 Total Assignments: ${assignments.length}`);
    console.log('');

    assignments.forEach(({ assignment, task }, index) => {
      console.log(`${index + 1}. 📋 ${task.taskName}`);
      console.log(`   🆔 Assignment ID: ${assignment.id}`);
      console.log(`   🎯 Task ID: ${task.id}`);
      console.log(`   🏗️ Project ID: ${assignment.projectId}`);
      console.log(`   ⚡ Priority: ${assignment.priority}`);
      console.log(`   ⏱️ Estimated Time: ${assignment.timeEstimate.estimated} minutes`);
      console.log(`   📍 Work Area: ${assignment.workArea}`);
      console.log(`   📊 Status: ${assignment.status}`);
      console.log(`   🎯 Target: ${assignment.dailyTarget.description}`);
      console.log('');
    });

    console.log('✅ SUCCESS! Three tasks and project successfully assigned to Employee 107 for today!');
    console.log('\n📱 What Employee 107 can do now:');
    console.log('   ✓ Login to mobile app');
    console.log('   ✓ View today\'s tasks (3 tasks assigned)');
    console.log('   ✓ See project assignment');
    console.log('   ✓ Start tasks in sequence');
    console.log('   ✓ Track progress and time');
    console.log('   ✓ Complete daily targets');

  } catch (error) {
    console.error('❌ Assignment failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

assignTasksForEmployee107Today();