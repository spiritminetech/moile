import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

const fixProjectClientAssignment = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update project 1003 to have a client
    const project = await Project.findOne({ id: 1003 });
    
    if (!project) {
      console.log('❌ Project 1003 not found');
      return;
    }
    
    console.log('\n📊 Current Project Data:');
    console.log('Project Name:', project.projectName);
    console.log('Client ID:', project.clientId);
    console.log('Client Name:', project.clientName);
    
    // Assign client ID 1 (Skyline Developments Pte Ltd) to this project
    project.clientId = 1;
    project.clientName = 'Skyline Developments Pte Ltd';
    
    await project.save();
    
    console.log('\n✅ Updated Project Data:');
    console.log('Project Name:', project.projectName);
    console.log('Client ID:', project.clientId);
    console.log('Client Name:', project.clientName);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

fixProjectClientAssignment();
