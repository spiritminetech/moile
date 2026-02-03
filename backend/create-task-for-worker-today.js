// Create a task for the worker for today
// This script creates both a task assignment and a task for the worker

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import Task from './src/modules/task/Task.js';

// Load environment variables
dotenv.config({ path: './.env' });

const getTodayString = () => {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
};

async function createTaskForWorkerToday() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const today = getTodayString();
    console.log('📅 Today:', today);

    // Find the worker (employee ID 107 or user ID 64)
    const worker = await Employee.findOne({ 
      $or: [
        { id: 107 },
        { userId: 64 }
      ]
    });

    if (!worker) {
      console.log('❌ Worker not found');
      return;
    }

    console.log('👤 Worker found:', {
      id: worker.id,
      userId: worker.userId,
      fullName: worker.fullName,
      companyId: worker.companyId
    });

    // Find the project we assigned earlier (project ID 1003)
    const project = await Project.findOne({ id: 1003, companyId: worker.companyId });
    if (!project) {
      console.log('❌ Project 1003 not found');
      return;
    }

    console.log('🏗️ Project found:', {
      id: project.id,
      name: project.projectName
    });

    // Check if task assignment already exists
    const existingAssignment = await WorkerTaskAssignment.findOne({
      employeeId: worker.id,
      projectId: project.id,
      date: today
    });

    if (existingAssignment) {
      console.log('✅ Task assignment already exists:', {
        id: existingAssignment.id,
        taskId: existingAssignment.taskId
      });

      // Check if we need to create a task
      if (!existingAssignment.taskId) {
        console.log('🔧 Assignment exists but no task ID, creating task...');
        
        // Get next task ID
        const lastTask = await Task.findOne().sort({ id: -1 }).select('id');
        const nextTaskId = lastTask ? lastTask.id + 1 : 1;

        // Create a new task
        const newTask = new Task({
          id: nextTaskId,
          taskName: 'Daily Construction Work',
          taskType: 'WORK',
          description: 'General construction work for today',
          projectId: project.id,
          companyId: worker.companyId,
          status: 'PLANNED',
          createdBy: 1 // Default supervisor
        });

        await newTask.save();
        console.log('✅ Created new task:', {
          id: newTask.id,
          name: newTask.taskName
        });

        // Update the assignment with the task ID
        existingAssignment.taskId = newTask.id;
        await existingAssignment.save();
        console.log('✅ Updated assignment with task ID');
      }
      return;
    }

    // Get next task ID
    const lastTask = await Task.findOne().sort({ id: -1 }).select('id');
    const nextTaskId = lastTask ? lastTask.id + 1 : 1;

    // Create a new task
    const newTask = new Task({
      id: nextTaskId,
      taskName: 'Daily Construction Work',
      taskType: 'WORK',
      description: 'General construction work for today',
      projectId: project.id,
      companyId: worker.companyId,
      status: 'PLANNED',
      createdBy: 1 // Default supervisor
    });

    await newTask.save();
    console.log('✅ Created new task:', {
      id: newTask.id,
      name: newTask.taskName
    });

    // Get next assignment ID
    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 }).select('id');
    const nextAssignmentId = lastAssignment ? lastAssignment.id + 1 : 1;

    // Create new task assignment with the task
    const newAssignment = new WorkerTaskAssignment({
      id: nextAssignmentId,
      projectId: project.id,
      employeeId: worker.id,
      supervisorId: 1, // Default supervisor
      taskId: newTask.id,
      date: today,
      status: 'queued',
      companyId: worker.companyId,
      dailyTarget: {
        description: 'Daily construction work',
        quantity: 8,
        unit: 'hours',
        targetCompletion: 100
      },
      workArea: 'Main Site',
      priority: 'medium',
      timeEstimate: {
        estimated: 480, // 8 hours in minutes
        elapsed: 0,
        remaining: 480
      },
      geofenceValidation: {
        required: true
      }
    });

    await newAssignment.save();
    console.log('✅ Created new task assignment:', {
      id: newAssignment.id,
      projectId: newAssignment.projectId,
      taskId: newAssignment.taskId,
      employeeId: newAssignment.employeeId,
      date: newAssignment.date,
      status: newAssignment.status
    });

    // Verify both task and assignment were created
    const verifyTask = await Task.findOne({ id: newTask.id });
    const verifyAssignment = await WorkerTaskAssignment.findOne({
      employeeId: worker.id,
      projectId: project.id,
      date: today
    });

    if (verifyTask && verifyAssignment) {
      console.log('✅ Task and assignment verified successfully');
      console.log('📋 Task details:', {
        id: verifyTask.id,
        name: verifyTask.taskName,
        status: verifyTask.status
      });
      console.log('📋 Assignment details:', {
        id: verifyAssignment.id,
        taskId: verifyAssignment.taskId,
        status: verifyAssignment.status
      });
    } else {
      console.log('❌ Verification failed');
    }

  } catch (error) {
    console.error('❌ Error creating task and assignment:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the script
createTaskForWorkerToday();