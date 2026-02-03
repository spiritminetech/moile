import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import Employee from './src/modules/employee/Employee.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function assignTwoProjectsForEmployee107() {
  await connectDB();
  
  try {
    console.log('🔍 Setting up two project assignments for Employee 107...');
    
    // Find employee 107
    const employee = await Employee.findOne({ id: 107 });
    if (!employee) {
      console.error('❌ Employee 107 not found');
      return;
    }
    
    console.log('✅ Found employee:', employee.fullName);
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today:', today);
    
    // Find available projects
    const projects = await Project.find({ status: 'Ongoing' }).limit(2);
    if (projects.length < 2) {
      console.error('❌ Need at least 2 active projects');
      return;
    }
    
    console.log('🏗️ Found projects:');
    projects.forEach(p => console.log(`   - ${p.projectName} (ID: ${p.id})`));
    
    // Find available tasks
    const tasks = await Task.find().limit(4);
    if (tasks.length < 4) {
      console.error('❌ Need at least 4 tasks');
      return;
    }
    
    console.log('📋 Found tasks:');
    tasks.forEach(t => console.log(`   - ${t.taskName} (ID: ${t.id})`));
    
    // Clear existing assignments for today
    await WorkerTaskAssignment.deleteMany({
      employeeId: employee.id,
      date: today
    });
    console.log('🧹 Cleared existing assignments for today');
    
    // Get next assignment ID
    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 });
    let nextAssignmentId = lastAssignment ? lastAssignment.id + 1 : 3000;
    
    // Create assignments for Project 1
    const project1Assignments = [
      {
        id: nextAssignmentId++,
        projectId: projects[0].id,
        employeeId: employee.id,
        taskId: tasks[0].id,
        date: today,
        status: 'queued',
        sequence: 1,
        workArea: 'Zone A',
        dailyTarget: {
          description: 'Complete foundation work',
          quantity: 100,
          unit: 'sqm',
          targetCompletion: 100
        },
        timeEstimate: {
          estimated: 480, // 8 hours in minutes
          elapsed: 0,
          remaining: 480
        },
        priority: 'high',
        assignedAt: new Date(),
        companyId: employee.companyId
      },
      {
        id: nextAssignmentId++,
        projectId: projects[0].id,
        employeeId: employee.id,
        taskId: tasks[1].id,
        date: today,
        status: 'queued',
        sequence: 2,
        workArea: 'Zone B',
        dailyTarget: {
          description: 'Install structural elements',
          quantity: 50,
          unit: 'units',
          targetCompletion: 100
        },
        timeEstimate: {
          estimated: 360, // 6 hours in minutes
          elapsed: 0,
          remaining: 360
        },
        priority: 'medium',
        dependencies: [nextAssignmentId - 2], // Depends on first task
        assignedAt: new Date(),
        companyId: employee.companyId
      }
    ];
    
    // Create assignments for Project 2
    const project2Assignments = [
      {
        id: nextAssignmentId++,
        projectId: projects[1].id,
        employeeId: employee.id,
        taskId: tasks[2].id,
        date: today,
        status: 'queued',
        sequence: 1,
        workArea: 'Main Area',
        dailyTarget: {
          description: 'Quality inspection',
          quantity: 10,
          unit: 'checkpoints',
          targetCompletion: 100
        },
        timeEstimate: {
          estimated: 240, // 4 hours in minutes
          elapsed: 0,
          remaining: 240
        },
        priority: 'high',
        assignedAt: new Date(),
        companyId: employee.companyId
      },
      {
        id: nextAssignmentId++,
        projectId: projects[1].id,
        employeeId: employee.id,
        taskId: tasks[3].id,
        date: today,
        status: 'queued',
        sequence: 2,
        workArea: 'Secondary Area',
        dailyTarget: {
          description: 'Final cleanup',
          quantity: 1,
          unit: 'area',
          targetCompletion: 100
        },
        timeEstimate: {
          estimated: 120, // 2 hours in minutes
          elapsed: 0,
          remaining: 120
        },
        priority: 'low',
        assignedAt: new Date(),
        companyId: employee.companyId
      }
    ];
    
    // Insert all assignments
    const allAssignments = [...project1Assignments, ...project2Assignments];
    await WorkerTaskAssignment.insertMany(allAssignments);
    
    console.log('✅ Created assignments:');
    console.log(`📊 Project 1 (${projects[0].projectName}): ${project1Assignments.length} tasks`);
    console.log(`📊 Project 2 (${projects[1].projectName}): ${project2Assignments.length} tasks`);
    console.log(`📊 Total assignments: ${allAssignments.length}`);
    
    // Verify assignments
    const verifyAssignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    }).sort({ projectId: 1, sequence: 1 });
    
    console.log('\n📋 Verification - Created assignments:');
    for (const assignment of verifyAssignments) {
      const project = await Project.findOne({ id: assignment.projectId });
      const task = await Task.findOne({ id: assignment.taskId });
      
      console.log(`   Assignment ${assignment.id}:`);
      console.log(`     Project: ${project?.projectName || 'Unknown'} (${assignment.projectId})`);
      console.log(`     Task: ${task?.taskName || 'Unknown'} (${assignment.taskId})`);
      console.log(`     Status: ${assignment.status}`);
      console.log(`     Work Area: ${assignment.workArea}`);
      console.log(`     Priority: ${assignment.priority}`);
      console.log('');
    }
    
    console.log('🎉 Successfully assigned two projects to Employee 107!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

assignTwoProjectsForEmployee107();