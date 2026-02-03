import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';

dotenv.config();

async function createAssignmentsForProject1() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'erp' });
    
    const today = new Date().toISOString().split('T')[0];
    console.log('Creating assignments for date:', today);
    
    // Get next available IDs
    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 });
    const nextAssignmentId = lastAssignment ? lastAssignment.id + 1 : 1;
    
    const lastTask = await Task.findOne().sort({ id: -1 });
    const nextTaskId = lastTask ? lastTask.id + 1 : 1;
    
    // Create tasks for project 1
    const tasks = [
      {
        id: nextTaskId,
        companyId: 1,
        projectId: 1,
        taskType: 'WORK',
        taskName: 'Daily Site Work',
        description: 'General construction site work for project 1',
        status: 'PLANNED',
        startDate: new Date(),
        endDate: new Date(Date.now() + 8 * 60 * 60 * 1000),
        createdBy: 1
      },
      {
        id: nextTaskId + 1,
        companyId: 1,
        projectId: 1,
        taskType: 'INSPECTION',
        taskName: 'Safety Inspection',
        description: 'Daily safety inspection for project 1',
        status: 'PLANNED',
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        createdBy: 1
      }
    ];
    
    const createdTasks = await Task.insertMany(tasks);
    console.log('✅ Created', createdTasks.length, 'tasks for project 1');
    
    // Create task assignments for project 1
    const assignments = createdTasks.map((task, index) => ({
      id: nextAssignmentId + index,
      projectId: 1,
      employeeId: 107,
      supervisorId: 1,
      taskId: task.id,
      date: today,
      status: 'queued',
      companyId: 1,
      dailyTarget: {
        description: task.description,
        quantity: 1,
        unit: 'task',
        targetCompletion: 100
      },
      workArea: 'Main Site',
      floor: 'Ground Level',
      zone: 'Zone A',
      timeEstimate: {
        estimated: index === 0 ? 480 : 120,
        elapsed: 0,
        remaining: index === 0 ? 480 : 120
      },
      priority: index === 1 ? 'high' : 'medium',
      sequence: index + 1,
      geofenceValidation: {
        required: true
      }
    }));
    
    const createdAssignments = await WorkerTaskAssignment.insertMany(assignments);
    console.log('✅ Created', createdAssignments.length, 'task assignments for project 1');
    
    // Verify the assignments
    const verifyAssignments = await WorkerTaskAssignment.find({ 
      employeeId: 107,
      projectId: 1,
      date: today 
    });
    
    console.log('\\n📊 Verification:');
    console.log('- Employee 107 now has', verifyAssignments.length, 'assignments for project 1 today');
    
    // Show all assignments for employee 107
    const allAssignments = await WorkerTaskAssignment.find({ employeeId: 107, date: today });
    console.log('\\n📋 All assignments for employee 107 today:');
    allAssignments.forEach(assignment => {
      console.log('- Project:', assignment.projectId, 'Assignment ID:', assignment.id, 'Status:', assignment.status);
    });
    
    console.log('\\n🎉 SUCCESS: Worker can now check in for both project 1 and project 1003!');
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

createAssignmentsForProject1();