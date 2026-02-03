// Check all project coordinates to find the issue

import mongoose from 'mongoose';
import Project from './src/modules/project/models/Project.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function checkAllProjects() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔍 Checking ALL project coordinates...');
    
    const projects = await Project.find({}).select('id name latitude longitude geofence geofenceRadius');
    
    console.log('📍 Found', projects.length, 'projects:');
    projects.forEach(project => {
      console.log(`  Project ${project.id}: ${project.name}`);
      console.log(`    Old coords: ${project.latitude}, ${project.longitude}`);
      console.log(`    Geofence center: ${project.geofence?.center?.latitude}, ${project.geofence?.center?.longitude}`);
      console.log(`    Radius: ${project.geofenceRadius} / ${project.geofence?.radius}`);
      console.log('');
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAllProjects();