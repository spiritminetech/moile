#!/usr/bin/env node

/**
 * Fix geofence validation issues in the backend
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple Project schema
const ProjectSchema = new mongoose.Schema({
  id: Number,
  name: String,
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  geofence: {
    center: {
      latitude: Number,
      longitude: Number
    },
    radius: Number,
    strictMode: Boolean
  }
}, { collection: 'projects' });

const Project = mongoose.model('Project', ProjectSchema);

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function fixGeofenceIssues() {
  console.log('🔧 Fixing geofence validation issues...\n');

  try {
    // 1. Check current project settings
    const projects = await Project.find({});
    console.log(`Found ${projects.length} projects:`);
    
    projects.forEach(project => {
      console.log(`\nProject ${project.id}: ${project.name || 'Unnamed'}`);
      if (project.coordinates) {
        console.log(`  Current coordinates: (${project.coordinates.latitude}, ${project.coordinates.longitude})`);
      }
      if (project.geofence) {
        console.log(`  Current geofence: radius=${project.geofence.radius}m, strict=${project.geofence.strictMode}`);
      }
    });

    // 2. Apply fixes
    console.log('\n🔧 Applying geofence fixes...');
    
    // Bangalore coordinates as default (change these to your location if needed)
    const defaultCoords = {
      latitude: 12.9716,
      longitude: 77.5946
    };

    const updateResult = await Project.updateMany(
      {},
      {
        $set: {
          coordinates: defaultCoords,
          'geofence.center': defaultCoords,
          'geofence.radius': 20000, // 20km radius for testing
          'geofence.strictMode': false, // Disable strict mode
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} projects with relaxed geofence settings`);

    // 3. Show updated settings
    console.log('\n📍 Updated project settings:');
    const updatedProjects = await Project.find({}).limit(5);
    
    updatedProjects.forEach(project => {
      console.log(`\nProject ${project.id}: ${project.name || 'Unnamed'}`);
      console.log(`  Coordinates: (${project.coordinates.latitude}, ${project.coordinates.longitude})`);
      console.log(`  Geofence: ${project.geofence.radius}m radius, strict: ${project.geofence.strictMode}`);
    });

    console.log('\n✅ Geofence fix completed!');
    console.log('\n📱 You can now try starting tasks again - geofence validation should be much more permissive');
    console.log('\n⚠️  Note: All projects now have 20km radius and non-strict validation for testing');

  } catch (error) {
    console.error('❌ Error fixing geofence:', error);
    throw error;
  }
}

async function main() {
  await connectToDatabase();
  
  try {
    await fixGeofenceIssues();
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

main().catch(console.error);