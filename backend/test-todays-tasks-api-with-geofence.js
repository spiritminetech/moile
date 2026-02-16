// Test Today's Tasks API to check if geofence data is included
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function testTasksAPI() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Simulate what the API does
    console.log('🔍 SIMULATING API CALL: GET /api/worker/tasks/today\n');
    console.log('='.repeat(80));

    // Get task assignments
    const assignments = await db.collection('workerTaskAssignment').find({
      employeeId: 2,
      date: '2026-02-15'
    }).toArray();

    console.log(`\n✅ Found ${assignments.length} task assignments\n`);

    // For each assignment, get task and project details
    for (const assignment of assignments) {
      console.log('─'.repeat(80));
      
      // Get task details
      const task = await db.collection('tasks').findOne({ id: assignment.taskId });
      
      // Get project details
      const project = await db.collection('projects').findOne({ id: assignment.projectId });

      console.log(`\n📋 Task: ${task ? task.taskName : 'Unknown'}`);
      console.log(`   Assignment ID: ${assignment.id}`);
      console.log(`   Task ID: ${assignment.taskId}`);
      console.log(`   Project ID: ${assignment.projectId}`);
      
      if (project) {
        console.log(`\n📍 Project: ${project.projectName}`);
        console.log(`   Project Code: ${project.projectCode}`);
        console.log(`\n   Geofence in Database:`);
        console.log(`   ${JSON.stringify(project.geofence, null, 2)}`);
        
        // Check what would be sent to mobile app
        const projectGeofence = project.geofence ? {
          latitude: project.geofence.coordinates ? project.geofence.coordinates[1] : null,
          longitude: project.geofence.coordinates ? project.geofence.coordinates[0] : null,
          radius: project.geofence.radius || 100,
          allowedVariance: project.geofence.allowedVariance || 20
        } : null;
        
        console.log(`\n   Geofence sent to Mobile App:`);
        console.log(`   ${JSON.stringify(projectGeofence, null, 2)}`);
        
        if (projectGeofence && projectGeofence.latitude && projectGeofence.longitude) {
          console.log(`\n   ✅ Geofence data is COMPLETE and will be sent to mobile app`);
        } else {
          console.log(`\n   ❌ Geofence data is INCOMPLETE or MISSING`);
        }
      } else {
        console.log(`\n   ❌ Project not found`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📱 MOBILE APP WILL RECEIVE:\n');
    
    // Show what the mobile app receives
    const apiResponse = [];
    for (const assignment of assignments) {
      const task = await db.collection('tasks').findOne({ id: assignment.taskId });
      const project = await db.collection('projects').findOne({ id: assignment.projectId });
      
      const taskData = {
        assignmentId: assignment.id,
        taskId: assignment.taskId,
        taskName: task ? task.taskName : 'Unknown',
        status: assignment.status,
        projectId: assignment.projectId,
        projectName: project ? project.projectName : 'Unknown',
        projectCode: project ? project.projectCode : 'Unknown',
        projectGeofence: project && project.geofence ? {
          latitude: project.geofence.coordinates[1],
          longitude: project.geofence.coordinates[0],
          radius: project.geofence.radius || 100,
          allowedVariance: project.geofence.allowedVariance || 20
        } : null
      };
      
      apiResponse.push(taskData);
    }
    
    console.log(JSON.stringify(apiResponse, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('\n🎯 SUMMARY:\n');
    
    const tasksWithGeofence = apiResponse.filter(t => t.projectGeofence !== null);
    const tasksWithoutGeofence = apiResponse.filter(t => t.projectGeofence === null);
    
    console.log(`Total tasks: ${apiResponse.length}`);
    console.log(`Tasks with geofence: ${tasksWithGeofence.length} ✅`);
    console.log(`Tasks without geofence: ${tasksWithoutGeofence.length} ${tasksWithoutGeofence.length > 0 ? '⚠️' : ''}`);
    
    if (tasksWithGeofence.length > 0) {
      console.log('\n✅ Geofence data IS being included in API response');
      console.log('   Mobile app should receive and use this data');
    } else {
      console.log('\n❌ Geofence data is NOT being included in API response');
      console.log('   This is why the mobile app shows "Outside Geo-Fence"');
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testTasksAPI();
