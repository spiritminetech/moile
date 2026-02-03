// Fix worker task assignment for today
// This script creates a task assignment for the worker for today's date

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';

// Load environment variables
dotenv.config({ path: './.env' });

const getTodayString = () => {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
};

async function fixWorkerTaskAssignment() {
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

    // Find available projects for the company
    const projects = await Project.find({ companyId: worker.companyId });
    console.log('🏗️ Available projects:', projects.map(p => ({ id: p.id, name: p.projectName })));

    // Use project ID 1 as default (or first available project)
    const targetProjectId = projects.length > 0 ? projects[0].id : 1;
    console.log('🎯 Target project ID:', targetProjectId);

    // Check if task assignment already exists for today
    const existingAssignment = await WorkerTaskAssignment.findOne({
      employeeId: worker.id,
      projectId: targetProjectId,
      date: today
    });

    if (existingAssignment) {
      console.log('✅ Task assignment already exists:', {
        id: existingAssignment.id,
        projectId: existingAssignment.projectId,
        date: existingAssignment.date,
        status: existingAssignment.status
      });
      return;
    }

    // Get next assignment ID
    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 }).select('id');
    const nextId = lastAssignment ? lastAssignment.id + 1 : 1;

    // Create new task assignment
    const newAssignment = new WorkerTaskAssignment({
      id: nextId,
      projectId: targetProjectId,
      employeeId: worker.id,
      supervisorId: 1, // Default supervisor
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
      employeeId: newAssignment.employeeId,
      date: newAssignment.date,
      status: newAssignment.status
    });

    // Verify the assignment was created
    const verification = await WorkerTaskAssignment.findOne({
      employeeId: worker.id,
      projectId: targetProjectId,
      date: today
    });

    if (verification) {
      console.log('✅ Task assignment verified successfully');
    } else {
      console.log('❌ Task assignment verification failed');
    }

  } catch (error) {
    console.error('❌ Error fixing task assignment:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the fix
fixWorkerTaskAssignment();