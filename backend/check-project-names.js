#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

async function checkProjects() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const projects = await Project.find({ id: { $in: [1014, 1016] } }).select('id projectName name');
  console.log('Projects 1014 and 1016:');
  projects.forEach(p => {
    console.log(`  Project ${p.id}: projectName='${p.projectName}', name='${p.name}'`);
  });
  
  await mongoose.disconnect();
}

checkProjects().catch(console.error);