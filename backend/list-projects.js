// List all projects
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

async function listProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const projects = await Project.find({}).select('projectId projectCode projectName latitude longitude geofence geofenceRadius');
    
    console.log(`Found ${projects.length} projects:\n`);
    
    projects.forEach(project => {
      console.log('='.repeat(80));
      console.log('Project ID:', project.projectId);
      console.log('Project Code:', project.projectCode);
      console.log('Project Name:', project.projectName);
      console.log('Latitude:', project.latitude);
      console.log('Longitude:', project.longitude);
      console.log('Geofence Radius:', project.geofenceRadius);
      console.log('Geofence Object:', JSON.stringify(project.geofence, null, 2));
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

listProjects();
