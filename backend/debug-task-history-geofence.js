// Debug script to check task history geofence data
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const ProjectSchema = new mongoose.Schema({}, { strict: false, collection: 'projects' });
const Project = mongoose.model('Project', ProjectSchema);

const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' });
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

async function debugTaskHistoryGeofence() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a sample task assignment
    const assignment = await WorkerTaskAssignment.findOne({
      employeeId: 2 // Change this to your test employee ID
    }).sort({ date: -1 });

    if (!assignment) {
      console.log('❌ No task assignments found');
      return;
    }

    console.log('\n📋 Sample Task Assignment:');
    console.log('  Assignment ID:', assignment.id);
    console.log('  Project ID:', assignment.projectId);
    console.log('  Task Name:', assignment.taskName);
    console.log('  Date:', assignment.date);

    // Get the project
    const project = await Project.findOne({ id: assignment.projectId });

    if (!project) {
      console.log('❌ Project not found');
      return;
    }

    console.log('\n🏗️ Project Data:');
    console.log('  Project ID:', project.id);
    console.log('  Project Name:', project.projectName);
    console.log('  Project Code:', project.projectCode);
    
    console.log('\n📍 Geofence Data (Old Format):');
    console.log('  latitude:', project.latitude);
    console.log('  longitude:', project.longitude);
    console.log('  geofenceRadius:', project.geofenceRadius);
    
    console.log('\n📍 Geofence Data (New Format):');
    console.log('  geofence:', JSON.stringify(project.geofence, null, 2));
    
    console.log('\n🔍 What the backend code will extract:');
    const centerLat = project.geofence?.center?.latitude || project.latitude || 0;
    const centerLng = project.geofence?.center?.longitude || project.longitude || 0;
    const radius = project.geofence?.radius || project.geofenceRadius || 100;
    
    console.log('  Extracted latitude:', centerLat);
    console.log('  Extracted longitude:', centerLng);
    console.log('  Extracted radius:', radius);
    
    if (centerLat === 0 && centerLng === 0) {
      console.log('\n⚠️ WARNING: Coordinates are 0,0 - this is the problem!');
      console.log('   The project does not have valid geofence data.');
    } else {
      console.log('\n✅ Coordinates look valid');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugTaskHistoryGeofence();
