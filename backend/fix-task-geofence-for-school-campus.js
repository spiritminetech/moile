import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function fixTaskGeofence() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');
    const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false }), 'tasks');
    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false }), 'workertaskassignments');

    // Find School Campus Renovation project
    const project = await Project.findOne({ 
      projectName: /school.*campus.*renovation/i 
    });

    if (!project) {
      console.log('❌ School Campus Renovation project not found');
      return;
    }

    console.log(`📍 Found project: ${project.projectName} (ID: ${project.id || project._id})`);
    console.log(`   Location: ${project.latitude}, ${project.longitude}`);
    console.log(`   Geofence radius: ${project.geofence.radius}m\n`);

    // Find all tasks for this project
    const tasks = await Task.find({ projectId: project.id });
    console.log(`📋 Found ${tasks.length} tasks for this project\n`);

    if (tasks.length === 0) {
      console.log('No tasks to update');
      return;
    }

    // Update each task with correct geofence
    for (const task of tasks) {
      console.log(`Updating task: ${task.taskName || task.title} (ID: ${task.id || task._id})`);
      
      const updateResult = await Task.updateOne(
        { _id: task._id },
        {
          $set: {
            'geofence.enabled': true,
            'geofence.radius': 50000,
            'geofence.latitude': 12.9716,
            'geofence.longitude': 77.5946,
            'geofence.center.latitude': 12.9716,
            'geofence.center.longitude': 77.5946,
            'geofence.allowedVariance': 5000,
            'geofence.strictMode': false
          }
        }
      );
      
      console.log(`  ✅ Updated (modified: ${updateResult.modifiedCount})`);
    }

    // Also update task assignments
    const taskIds = tasks.map(t => t.id || t._id);
    const assignments = await WorkerTaskAssignment.find({ 
      taskId: { $in: taskIds }
    });

    console.log(`\n📝 Found ${assignments.length} task assignments\n`);

    for (const assignment of assignments) {
      console.log(`Updating assignment ID: ${assignment._id}`);
      
      const updateResult = await WorkerTaskAssignment.updateOne(
        { _id: assignment._id },
        {
          $set: {
            'geofence.enabled': true,
            'geofence.radius': 50000,
            'geofence.latitude': 12.9716,
            'geofence.longitude': 77.5946,
            'geofence.center.latitude': 12.9716,
            'geofence.center.longitude': 77.5946,
            'geofence.allowedVariance': 5000,
            'geofence.strictMode': false
          }
        }
      );
      
      console.log(`  ✅ Updated (modified: ${updateResult.modifiedCount})`);
    }

    console.log(`\n✅ All tasks and assignments updated with 50km geofence!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

fixTaskGeofence();
