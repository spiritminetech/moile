import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import User from './src/modules/user/User.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import Task from './src/modules/task/Task.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

const createNewWorkerSetup = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'erp',
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Worker details
    const workerEmail = 'worker1@gmail.com';
    const workerPassword = 'password123';
    const workerName = 'Worker One';
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Get next available IDs
    const lastUser = await User.findOne().sort({ id: -1 });
    const nextUserId = lastUser ? lastUser.id + 1 : 1;

    const lastEmployee = await Employee.findOne().sort({ id: -1 });
    const nextEmployeeId = lastEmployee ? lastEmployee.id + 1 : 1;

    const lastTask = await Task.findOne().sort({ id: -1 });
    const nextTaskId = lastTask ? lastTask.id + 1 : 1;

    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 });
    const nextAssignmentId = lastAssignment ? lastAssignment.id + 1 : 1;

    // Hash password
    const passwordHash = await bcrypt.hash(workerPassword, 10);

    // 1. Create User
    console.log('📝 Creating user account...');
    const newUser = new User({
      id: nextUserId,
      email: workerEmail,
      passwordHash: passwordHash,
      tenantCode: null,
      isActive: true
    });
    await newUser.save();
    console.log(`✅ User created with ID: ${nextUserId}`);

    // 2. Create Employee
    console.log('👤 Creating employee record...');
    const newEmployee = new Employee({
      id: nextEmployeeId,
      companyId: 1, // Default company ID
      userId: nextUserId,
      employeeCode: `EMP${nextEmployeeId.toString().padStart(3, '0')}`,
      fullName: workerName,
      phone: '+1234567890',
      jobTitle: 'Construction Worker',
      status: 'ACTIVE'
    });
    await newEmployee.save();
    console.log(`✅ Employee created with ID: ${nextEmployeeId}`);

    // 3. Find or create a project
    let project = await Project.findOne({ companyId: 1, status: 'Ongoing' });
    
    if (!project) {
      console.log('🏗️ Creating new project...');
      const lastProject = await Project.findOne().sort({ id: -1 });
      const nextProjectId = lastProject ? lastProject.id + 1 : 1;
      
      project = new Project({
        id: nextProjectId,
        companyId: 1,
        projectCode: `PROJ${nextProjectId.toString().padStart(3, '0')}`,
        projectName: 'Construction Site Alpha',
        description: 'Main construction project for worker assignments',
        jobNature: 'Construction',
        jobSubtype: 'Building',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        status: 'Ongoing',
        address: '123 Construction Ave, Building City',
        latitude: 40.7128,
        longitude: -74.0060,
        geofenceRadius: 100,
        geofence: {
          center: {
            latitude: 40.7128,
            longitude: -74.0060
          },
          radius: 100,
          strictMode: true,
          allowedVariance: 10
        }
      });
      await project.save();
      console.log(`✅ Project created with ID: ${nextProjectId}`);
    } else {
      console.log(`✅ Using existing project: ${project.projectName} (ID: ${project.id})`);
    }

    // 4. Create tasks for today
    console.log('📋 Creating tasks...');
    const tasks = [
      {
        id: nextTaskId,
        companyId: 1,
        projectId: project.id,
        taskType: 'WORK',
        taskName: 'Site Preparation',
        description: 'Prepare construction site for daily work activities',
        status: 'PLANNED',
        startDate: new Date(),
        endDate: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
        createdBy: 1
      },
      {
        id: nextTaskId + 1,
        companyId: 1,
        projectId: project.id,
        taskType: 'WORK',
        taskName: 'Material Handling',
        description: 'Organize and move construction materials',
        status: 'PLANNED',
        startDate: new Date(),
        endDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
        createdBy: 1
      },
      {
        id: nextTaskId + 2,
        companyId: 1,
        projectId: project.id,
        taskType: 'INSPECTION',
        taskName: 'Safety Check',
        description: 'Conduct daily safety inspection of work area',
        status: 'PLANNED',
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        createdBy: 1
      }
    ];

    const createdTasks = await Task.insertMany(tasks);
    console.log(`✅ Created ${createdTasks.length} tasks`);

    // 5. Create task assignments for today
    console.log('📅 Creating task assignments for today...');
    const assignments = createdTasks.map((task, index) => ({
      id: nextAssignmentId + index,
      projectId: project.id,
      employeeId: nextEmployeeId,
      supervisorId: 1, // Default supervisor
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
        estimated: index === 0 ? 480 : index === 1 ? 360 : 120, // minutes
        elapsed: 0,
        remaining: index === 0 ? 480 : index === 1 ? 360 : 120
      },
      priority: index === 2 ? 'high' : 'medium', // Safety check is high priority
      sequence: index + 1,
      geofenceValidation: {
        required: true
      }
    }));

    const createdAssignments = await WorkerTaskAssignment.insertMany(assignments);
    console.log(`✅ Created ${createdAssignments.length} task assignments for ${today}`);

    // Update employee with current project
    await Employee.findOneAndUpdate(
      { id: nextEmployeeId },
      {
        currentProject: {
          id: project.id,
          name: project.projectName,
          code: project.projectCode
        }
      }
    );
    console.log('✅ Updated employee with current project');

    // Summary
    console.log('\n🎉 Worker setup completed successfully!');
    console.log('=====================================');
    console.log(`👤 Worker Email: ${workerEmail}`);
    console.log(`🔑 Password: ${workerPassword}`);
    console.log(`🆔 User ID: ${nextUserId}`);
    console.log(`👷 Employee ID: ${nextEmployeeId}`);
    console.log(`🏗️ Project: ${project.projectName} (ID: ${project.id})`);
    console.log(`📅 Date: ${today}`);
    console.log(`📋 Tasks Assigned: ${createdTasks.length}`);
    console.log('\nTask Details:');
    createdTasks.forEach((task, index) => {
      console.log(`  ${index + 1}. ${task.taskName} (${task.taskType})`);
    });

    console.log('\n🔐 Login Credentials:');
    console.log(`Email: ${workerEmail}`);
    console.log(`Password: ${workerPassword}`);

  } catch (error) {
    console.error('❌ Error creating worker setup:', error);
    
    if (error.code === 11000) {
      console.error('💡 Duplicate key error - worker might already exist');
      
      // Check if user exists
      const existingUser = await User.findOne({ email: 'worker1@gmail.com' });
      if (existingUser) {
        console.log(`ℹ️ User already exists with ID: ${existingUser.id}`);
        
        // Find associated employee
        const existingEmployee = await Employee.findOne({ userId: existingUser.id });
        if (existingEmployee) {
          console.log(`ℹ️ Employee already exists with ID: ${existingEmployee.id}`);
          
          // Check for existing assignments today
          const existingAssignments = await WorkerTaskAssignment.find({
            employeeId: existingEmployee.id,
            date: new Date().toISOString().split('T')[0]
          });
          
          console.log(`ℹ️ Existing assignments for today: ${existingAssignments.length}`);
        }
      }
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the setup
createNewWorkerSetup();