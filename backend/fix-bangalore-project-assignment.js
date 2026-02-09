import mongoose from 'mongoose';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';
import Employee from './src/modules/employee/Employee.js';
import appConfig from './src/config/app.config.js';

async function fixBangaloreProjectAssignment() {
  try {
    // Connect to MongoDB
    await mongoose.connect(appConfig.database.uri, { 
      dbName: appConfig.database.name,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    console.log('🔧 FIXING BANGALORE PROJECT ASSIGNMENT');
    console.log('=====================================');
    
    // Your current location in Bangalore
    const userLocation = {
      latitude: 12.865145716526893,
      longitude: 77.64679448904312,
      locationName: "Bangalore, India - User Location"
    };

    console.log(`📍 Your Location: ${userLocation.latitude}, ${userLocation.longitude}`);

    // Step 1: Update Project 1003 to your exact location
    console.log('\n📋 Step 1: Updating Project 1003 to your location...');
    const project1003 = await Project.findOne({ id: 1003, companyId: 1 });
    
    if (project1003) {
      console.log(`Found Project: ${project1003.projectName}`);
      console.log(`Current Location: ${project1003.latitude}, ${project1003.longitude}`);
      
      // Update project location to user's location
      const updateResult = await Project.updateOne(
        { id: 1003, companyId: 1 },
        {
          $set: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            'geofence.center.latitude': userLocation.latitude,
            'geofence.center.longitude': userLocation.longitude,
            geofenceRadius: 500, // 500 meters radius for Bangalore
            'geofence.radius': 500,
            'geofence.strictMode': false,
            'geofence.allowedVariance': 100,
            status: 'Ongoing' // Make sure it's active
          }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        console.log('✅ Project 1003 location updated successfully!');
        console.log(`📍 New Location: ${userLocation.latitude}, ${userLocation.longitude}`);
        console.log(`🔵 Geofence Radius: 500m`);
      }
    }

    // Step 2: Create task assignment for Project 1003
    console.log('\n👤 Step 2: Creating task assignment for Project 1003...');
    
    const employee = await Employee.findOne({ userId: 2, companyId: 1 });
    if (!employee) {
      console.log('❌ Employee not found');
      return;
    }

    console.log(`Employee: ${employee.fullName} (ID: ${employee.id})`);

    // Check if task exists for Project 1003
    let task = await Task.findOne({ projectId: 1003 });
    if (!task) {
      // Create a new task for Project 1003
      const lastTask = await Task.findOne().sort({ id: -1 }).select("id");
      const nextTaskId = lastTask ? lastTask.id + 1 : 100;

      task = new Task({
        id: nextTaskId,
        projectId: 1003,
        taskName: 'Bangalore Site Attendance Task',
        description: 'Task created for attendance testing in Bangalore',
        status: 'active',
        priority: 'medium',
        estimatedHours: 8,
        companyId: 1
      });
      await task.save();
      console.log(`✅ Created new task: ${task.taskName} (ID: ${task.id})`);
    } else {
      console.log(`✅ Found existing task: ${task.taskName} (ID: ${task.id})`);
    }

    // Create task assignment for today
    const today = new Date().toISOString().split('T')[0];
    
    // Check if assignment already exists
    const existingAssignment = await WorkerTaskAssignment.findOne({
      employeeId: employee.id,
      projectId: 1003,
      date: today
    });

    if (existingAssignment) {
      console.log('✅ Task assignment already exists for Project 1003');
    } else {
      // Generate next assignment ID
      const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 }).select("id");
      const nextAssignmentId = lastAssignment ? lastAssignment.id + 1 : 1000;

      const newAssignment = new WorkerTaskAssignment({
        id: nextAssignmentId,
        employeeId: employee.id,
        taskId: task.id,
        projectId: 1003,
        date: today,
        status: 'queued',
        supervisorId: 1, // Default supervisor
        startTime: new Date(`${today}T08:00:00.000Z`),
        companyId: 1
      });

      await newAssignment.save();
      console.log('✅ Created new task assignment for Project 1003');
      console.log(`Assignment ID: ${newAssignment.id}`);
      console.log(`Date: ${today}`);
    }

    // Step 3: Verify the setup
    console.log('\n🔍 Step 3: Verifying the setup...');
    
    const updatedProject = await Project.findOne({ id: 1003, companyId: 1 });
    console.log(`Project 1003 Location: ${updatedProject.latitude}, ${updatedProject.longitude}`);
    console.log(`Geofence Radius: ${updatedProject.geofenceRadius}m`);
    
    const assignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      projectId: 1003,
      date: today
    });
    console.log(`Task assignments for Project 1003: ${assignments.length}`);

    // Calculate distance from user location to project
    const distance = calculateDistance(
      userLocation.latitude, userLocation.longitude,
      updatedProject.latitude, updatedProject.longitude
    );
    console.log(`Distance from your location to project: ${distance.toFixed(2)}m`);
    console.log(`Within geofence: ${distance <= updatedProject.geofenceRadius ? '✅ YES' : '❌ NO'}`);

    console.log('\n🎉 SETUP COMPLETE!');
    console.log('Now you can use Project ID 1003 for attendance');
    console.log(`API Call: POST http://192.168.1.8:5002/api/attendance/validate-geofence`);
    console.log(`Payload: {"projectId": 1003, "latitude": ${userLocation.latitude}, "longitude": ${userLocation.longitude}, "accuracy": 10}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

fixBangaloreProjectAssignment();