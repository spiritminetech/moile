// Check if key projects exist

import mongoose from 'mongoose';
import Project from './src/modules/project/models/Project.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function checkProjects() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    console.log('🔍 Checking key projects...');
    
    // Check Project 1
    const project1 = await Project.findOne({ id: 1 });
    console.log('📍 Project 1:', project1 ? `EXISTS - ${project1.latitude}, ${project1.longitude}` : 'NOT FOUND');
    
    // Check Project 1003
    const project1003 = await Project.findOne({ id: 1003 });
    console.log('📍 Project 1003:', project1003 ? `EXISTS - ${project1003.latitude}, ${project1003.longitude}` : 'NOT FOUND');
    
    // List all projects with id 1 or 1003
    const projects = await Project.find({ 
      $or: [{ id: 1 }, { id: 1003 }] 
    }).select('id name latitude longitude geofenceRadius');
    
    console.log('\n📋 All matching projects:');
    projects.forEach(p => {
      console.log(`  Project ${p.id}: ${p.name || 'Unnamed'} - ${p.latitude}, ${p.longitude} (radius: ${p.geofenceRadius}m)`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProjects();