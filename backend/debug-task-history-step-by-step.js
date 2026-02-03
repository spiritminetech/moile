import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models and utilities
import Employee from './src/modules/employee/Employee.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';
import Project from './src/modules/project/models/Project.js';
import { validateAuthData, validateId, validateDateString } from './utils/validationUtil.js';

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

async function debugTaskHistoryStepByStep() {
  await connectDB();
  
  try {
    // Simulate the exact same logic as the getWorkerTaskHistory function
    console.log('🔍 Step-by-step debugging of task history logic...');
    
    // Step 1: Mock request object (simulating what the middleware would create)
    const mockReq = {
      user: {
        userId: 2,
        companyId: 1,
        role: 'WORKER',
        email: 'worker@gmail.com'
      },
      query: {
        page: '1',
        limit: '10'
      }
    };
    
    console.log('Step 1: Mock request created');
    
    // Step 2: Validate auth data
    console.log('\nStep 2: Validating auth data...');
    const authValidation = validateAuthData(mockReq);
    if (!authValidation.isValid) {
      console.error('❌ Auth validation failed:', authValidation);
      return;
    }
    console.log('✅ Auth validation passed');
    
    // Step 3: Resolve employee
    console.log('\nStep 3: Resolving employee...');
    const employee = await Employee.findOne({
      userId: mockReq.user.userId,
      companyId: mockReq.user.companyId,
      status: "ACTIVE"
    });
    
    if (!employee) {
      console.error('❌ Employee not found');
      return;
    }
    console.log('✅ Employee found:', employee.fullName);
    
    // Step 4: Parse query parameters
    console.log('\nStep 4: Parsing query parameters...');
    const page = parseInt(mockReq.query.page) || 1;
    const limit = Math.min(parseInt(mockReq.query.limit) || 20, 100);
    console.log('Page:', page, 'Limit:', limit);
    
    // Step 5: Build filter
    console.log('\nStep 5: Building filter...');
    const filter = {
      employeeId: employee.id
    };
    console.log('Filter:', filter);
    
    // Step 6: Get total count
    console.log('\nStep 6: Getting total count...');
    const totalTasks = await WorkerTaskAssignment.countDocuments(filter);
    console.log('Total tasks:', totalTasks);
    
    // Step 7: Get assignments
    console.log('\nStep 7: Getting assignments...');
    const skip = (page - 1) * limit;
    const assignments = await WorkerTaskAssignment.find(filter)
      .sort({ date: -1, sequence: 1 })
      .skip(skip)
      .limit(limit);
    
    console.log('Found assignments:', assignments.length);
    
    if (assignments.length === 0) {
      console.log('✅ No assignments found - would return empty result');
      return;
    }
    
    // Step 8: Process each assignment
    console.log('\nStep 8: Processing assignments...');
    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];
      console.log(`\nProcessing assignment ${i + 1}/${assignments.length}:`);
      console.log('Assignment ID:', assignment.id);
      console.log('Task ID:', assignment.taskId);
      console.log('Project ID:', assignment.projectId);
      console.log('Status:', assignment.status);
      console.log('Date:', assignment.date);
      
      try {
        // Get task details
        const task = await Task.findOne({ id: assignment.taskId }).select('taskName taskType');
        console.log('Task found:', task ? task.taskName : 'NOT FOUND');
        
        // Get project details
        const project = await Project.findOne({ id: assignment.projectId }).select('projectName');
        console.log('Project found:', project ? project.projectName : 'NOT FOUND');
        
        // Calculate time spent
        let timeSpent = 0;
        if (assignment.startTime && assignment.completedAt) {
          timeSpent = Math.round((new Date(assignment.completedAt) - new Date(assignment.startTime)) / (1000 * 60));
        } else if (assignment.startTime && assignment.status === 'in_progress') {
          timeSpent = Math.round((new Date() - new Date(assignment.startTime)) / (1000 * 60));
        }
        console.log('Time spent (minutes):', timeSpent);
        
        const taskDetail = {
          assignmentId: assignment.id,
          taskId: assignment.taskId,
          taskName: task?.taskName || "N/A",
          taskType: task?.taskType || "WORK",
          projectName: project?.projectName || "N/A",
          status: assignment.status,
          startTime: assignment.startTime,
          completedAt: assignment.completedAt,
          progressPercent: assignment.progressPercent || 0,
          timeSpent: timeSpent,
          workArea: assignment.workArea || "",
          date: assignment.date
        };
        
        console.log('✅ Task detail created successfully');
        
      } catch (error) {
        console.error('❌ Error processing assignment:', error);
        throw error; // This might be where the error is coming from
      }
    }
    
    console.log('\n✅ All steps completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in step-by-step debug:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

debugTaskHistoryStepByStep();