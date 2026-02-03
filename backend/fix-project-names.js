#!/usr/bin/env node

/**
 * Fix project names in the database
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/modules/project/models/Project.js';

// Load environment variables
dotenv.config();

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function fixProjectNames() {
  console.log('🏗️ Fixing project names...\n');

  try {
    // Get all projects
    const projects = await Project.find({});
    console.log(`Found ${projects.length} projects to update`);

    // Define project names
    const projectNames = {
      1: 'Office Building Construction',
      2: 'Residential Complex Phase 1',
      1001: 'Shopping Mall Development',
      1002: 'Hospital Wing Extension',
      1003: 'School Campus Renovation',
      1004: 'Industrial Warehouse',
      1005: 'Luxury Hotel Project',
      1006: 'Community Center',
      1007: 'Sports Complex',
      1008: 'Parking Garage',
      1009: 'Bridge Construction',
      1010: 'Road Infrastructure',
      1011: 'Water Treatment Plant',
      1012: 'Power Substation',
      1013: 'Metro Station',
      1014: 'High-rise Apartment',
      1015: 'Commercial Plaza',
      1016: 'Tech Park Development'
    };

    let updatedCount = 0;

    for (const project of projects) {
      const projectName = projectNames[project.id] || `Project ${project.id}`;
      
      console.log(`Updating Project ${project.id}: "${projectName}"`);
      
      await Project.updateOne(
        { _id: project._id },
        { 
          $set: { 
            projectName: projectName, // Use projectName field, not name
            updatedAt: new Date()
          }
        }
      );
      
      updatedCount++;
    }

    console.log(`\n✅ Updated ${updatedCount} projects with proper names`);

    // Show updated projects
    console.log('\n📋 Updated project list:');
    const updatedProjects = await Project.find({}).select('id projectName').sort({ id: 1 });
    updatedProjects.forEach(project => {
      console.log(`   - Project ${project.id}: ${project.projectName}`);
    });

  } catch (error) {
    console.error('❌ Error fixing project names:', error);
    throw error;
  }
}

async function main() {
  await connectToDatabase();
  
  try {
    await fixProjectNames();
    console.log('\n✅ Project names fixed successfully!');
    console.log('\n📱 Now the mobile app should show proper project names instead of IDs');
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

main().catch(console.error);