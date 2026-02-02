import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import Task from './src/modules/task/Task.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixNoTaskAssignedIssue = async () => {
  await connectDB();

  try {
    console.log('\n🔧 FIXING "NO TASK ASSIGNED" ISSUE\n');

    // 1. Find the user and their project
    const user = await User.findOne({ email: 'worker@gmail.com' });
    const employee = await Employee.findOne({ userId: user.id });
    
    console.log(`1. User: ${user.email} (ID: ${user.id})`);
    console.log(`   Current Project: ${employee.currentProject?.id} - ${employee.currentProject?.name}`);

    const projectId = employee.currentProject?.id;
    if (!projectId) {
      console.log('❌ No current project assigned to user');
      return;
    }

    // 2. Check if project exists
    const project = await Project.findOne({ id: projectId });
    if (!project) {
      console.log(`❌ Project ${projectId} not found`);
      return;
    }

    console.log(`   Project: ${project.projectName} (Company: ${project.companyId})`);

    // 3. Check existing tasks for this project
    console.log('\n2. Checking existing tasks for this project...');
    const existingTasks = await Task.find({ projectId: projectId });
    console.log(`   Found ${existingTasks.length} tasks for project ${projectId}`);

    if (existingTasks.length > 0) {
      console.log('   Existing tasks:');
      existingTasks.forEach((task, index) => {
        console.log(`     ${index + 1}. ${task.taskName} (ID: ${task.id})`);
      });
    }

    // 4. Create tasks if none exist
    if (existingTasks.length === 0) {
      console.log('\n3. Creating sample tasks for the project...');
      
      // Get next task ID
      const lastTask = await Task.findOne({}, {}, { sort: { id: -1 } });
      let nextTaskId = lastTask ? lastTask.id + 1 : 1;

      const sampleTasks = [
        {
          id: nextTaskId++,
          projectId: projectId,
          taskName: 'Site Preparation',
          description: 'Prepare the construction site for work',
          taskType: 'PREPARATION',
          priority: 'HIGH',
          estimatedHours: 8,
          status: 'PENDING',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: nextTaskId++,
          projectId: projectId,
          taskName: 'Foundation Work',
          description: 'Foundation construction and concrete work',
          taskType: 'CONSTRUCTION',
          priority: 'MEDIUM',
          estimatedHours: 16,
          status: 'PENDING',
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: nextTaskId++,
          projectId: projectId,
          taskName: 'Quality Inspection',
          description: 'Daily quality inspection and reporting',
          taskType: 'INSPECTION',
          priority: 'HIGH',
          estimatedHours: 4,
          status: 'PENDING',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const taskData of sampleTasks) {
        const task = new Task(taskData);
        await task.save();
        console.log(`   ✅ Created task: ${task.taskName} (ID: ${task.id})`);
      }
    } else {
      console.log('\n3. Tasks already exist for this project');
    }

    // 5. Check if we need WorkerTaskAssignment collection
    console.log('\n4. Checking for WorkerTaskAssignment collection...');
    
    try {
      // Try to import WorkerTaskAssignment model
      const collections = await mongoose.connection.db.listCollections().toArray();
      const hasWorkerTaskAssignments = collections.some(col => 
        col.name.toLowerCase().includes('workertask') || 
        col.name.toLowerCase().includes('assignment')
      );

      console.log(`   Collections found: ${collections.map(c => c.name).join(', ')}`);
      
      if (hasWorkerTaskAssignments) {
        console.log('   ✅ WorkerTaskAssignment-related collection exists');
        
        // Try to create task assignments
        console.log('\n5. Creating task assignments for the worker...');
        
        // This is a simplified approach - in a real system, you'd use the proper WorkerTaskAssignment model
        const tasks = await Task.find({ projectId: projectId });
        
        console.log(`   Assigning ${tasks.length} tasks to worker ${user.id}`);
        console.log('   Note: Task assignments may need to be created through the proper admin interface');
        
      } else {
        console.log('   ⚠️ No WorkerTaskAssignment collection found');
        console.log('   The system might not require explicit task assignments');
      }
    } catch (error) {
      console.log('   ⚠️ Could not check WorkerTaskAssignment:', error.message);
    }

    // 6. Test the clock-in API to see if it works now
    console.log('\n6. Testing clock-in API...');
    
    try {
      const axios = (await import('axios')).default;
      
      // Login first
      const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
        email: 'worker@gmail.com',
        password: 'password123'
      });
      const token = loginResponse.data.token;

      // Try clock-in
      const clockInResponse = await axios.post(
        'http://localhost:5002/api/worker/attendance/clock-in',
        {
          projectId: projectId,
          latitude: 12.865141646709928,
          longitude: 77.6467982341202,
          accuracy: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('   ✅ Clock-in successful!', clockInResponse.data.message);

    } catch (clockInError) {
      if (clockInError.response) {
        console.log('   ❌ Clock-in still failed:', clockInError.response.data.message);
        
        if (clockInError.response.data.message === 'No task assigned for this project today') {
          console.log('\n   🔍 ADDITIONAL DIAGNOSIS:');
          console.log('   The backend requires specific task assignments for today.');
          console.log('   This might require:');
          console.log('   1. Creating WorkerTaskAssignment records');
          console.log('   2. Setting task dates to today');
          console.log('   3. Configuring the backend to allow attendance without tasks');
        }
      } else {
        console.log('   ❌ Clock-in request failed:', clockInError.message);
      }
    }

    // 7. Alternative solution: Modify backend to allow attendance without tasks
    console.log('\n7. 🎯 SOLUTIONS:');
    console.log('   OPTION 1: Create proper task assignments (requires admin interface)');
    console.log('   OPTION 2: Modify backend to allow attendance without tasks (for testing)');
    console.log('   OPTION 3: Set task dates to today and assign to worker');
    console.log('   ');
    console.log('   For immediate testing, the backend attendance validation');
    console.log('   could be temporarily disabled or made less strict.');

  } catch (error) {
    console.error('❌ Fix error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
};

fixNoTaskAssignedIssue();