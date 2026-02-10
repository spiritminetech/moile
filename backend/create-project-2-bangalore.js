import mongoose from 'mongoose';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';
import Employee from './src/modules/employee/Employee.js';
import appConfig from './src/config/app.config.js';

async function createProject2Bangalore() {
  try {
    // Connect to MongoDB
    await mongoose.connect(appConfig.database.uri, { 
      dbName: appConfig.database.name,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    console.log('🏗️ CREATING PROJECT ID 2 FOR BANGALORE');
    console.log('====================================');
    
    // Your current location in Bangalore
    const userLocation = {
      latitude: 12.865141646709928,
      longitude: 77.6467982341202,
      locationName: "Bangalore, India - Worker Location"
    };

    console.log(`📍 Your Location: ${userLocation.latitude}, ${userLocation.longitude}`);

    // Step 1: Check if Project ID 2 already exists
    const existingProject2 = await Project.findOne({ id: 2 });
    if (existingProject2) {
      console.log('✅ Project ID 2 already exists, updating location...');
      
      // Update existing project
      await Project.updateOne(
        { id: 2 },
        {
          $set: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            'geofence.center.latitude': userLocation.latitude,
            'geofence.center.longitude': userLocation.longitude,
            geofenceRadius: 500,
            'geofence.radius': 500,
            'geofence.strictMode': false,
            'geofence.allowedVariance': 100,
            status: 'Ongoing',
            companyId: 1
          }
        }
      );
    } else {
      console.log('🆕 Creating new Project ID 2...');
      
      // Create new Project ID 2
      const newProject = new Project({
        id: 2,
        projectCode: 'BANG-WORKER-002', // Unique project code
        projectName: 'Bangalore Worker Attendance Project',
        description: 'Project created for worker@gmail.com attendance in Bangalore',
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        geofenceRadius: 500,
        geofence: {
          center: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude
          },
          radius: 500,
          strictMode: false,
          allowedVariance: 100
        },
        status: 'Ongoing',
        companyId: 1,
        startDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        priority: 'medium'
      });

      await newProject.save();
      console.log('✅ Project ID 2 created successfully!');
    }

    // Step 2: Create task for Project 2
    console.log('\n📋 Step 2: Creating task for Project 2...');
    
    let task = await Task.findOne({ projectId: 2 });
    if (!task) {
      const lastTask = await Task.findOne().sort({ id: -1 }).select("id");
      const nextTaskId = lastTask ? lastTask.id + 1 : 200;

      task = new Task({
        id: nextTaskId,
        projectId: 2,
        taskName: 'Bangalore Attendance Task',
        description: 'Task for attendance tracking in Bangalore',
        taskType: 'WORK', // Required field
        status: 'PLANNED', // Valid enum value
        estimatedHours: 8,
        companyId: 1
      });
      await task.save();
      console.log(`✅ Created task: ${task.taskName} (ID: ${task.id})`);
    } else {
      console.log(`✅ Task already exists: ${task.taskName} (ID: ${task.id})`);
    }

    // Step 3: Create task assignment
    console.log('\n👤 Step 3: Creating task assignment for worker@gmail.com...');
    
    const employee = await Employee.findOne({ userId: 2, companyId: 1 });
    if (!employee) {
      console.log('❌ Employee not found');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    const existingAssignment = await WorkerTaskAssignment.findOne({
      employeeId: employee.id,
      projectId: 2,
      date: today
    });

    if (!existingAssignment) {
      const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 }).select("id");
      const nextAssignmentId = lastAssignment ? lastAssignment.id + 1 : 3000;

      const newAssignment = new WorkerTaskAssignment({
        id: nextAssignmentId,
        employeeId: employee.id,
        taskId: task.id,
        projectId: 2,
        date: today,
        status: 'queued',
        supervisorId: 1,
        startTime: new Date(`${today}T08:00:00.000Z`),
        companyId: 1
      });

      await newAssignment.save();
      console.log('✅ Created task assignment for Project 2');
      console.log(`Assignment ID: ${newAssignment.id}`);
    } else {
      console.log('✅ Task assignment already exists for Project 2');
    }

    // Step 4: Verify setup
    console.log('\n🔍 Step 4: Verifying Project 2 setup...');
    
    const project2 = await Project.findOne({ id: 2 });
    console.log(`Project 2 Name: ${project2.projectName}`);
    console.log(`Location: ${project2.latitude}, ${project2.longitude}`);
    console.log(`Geofence Radius: ${project2.geofenceRadius}m`);
    console.log(`Company ID: ${project2.companyId}`);
    console.log(`Status: ${project2.status}`);

    const assignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      projectId: 2,
      date: today
    });
    console.log(`Task assignments for Project 2: ${assignments.length}`);

    console.log('\n🎉 PROJECT ID 2 SETUP COMPLETE!');
    console.log('Now you can use Project ID 2 for attendance');
    console.log(`API Call: POST http://192.168.0.3:5002/api/attendance/validate-geofence`);
    console.log(`Payload: {"projectId": 2, "latitude": ${userLocation.latitude}, "longitude": ${userLocation.longitude}, "accuracy": 10}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

createProject2Bangalore();