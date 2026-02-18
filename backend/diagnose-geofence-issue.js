import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { calculateDistance } from './utils/geofenceUtil.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

// Your current location (example - replace with actual)
const MY_LOCATION = {
  latitude: 12.9716,  // Replace with your actual location
  longitude: 77.5946
};

async function diagnoseGeofenceIssue() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');

    // Find School Campus Renovation project
    const project = await Project.findOne({ 
      projectName: /school.*campus.*renovation/i 
    });

    if (!project) {
      console.log('❌ School Campus Renovation project not found');
      return;
    }

    console.log('📍 PROJECT DATA:');
    console.log('================');
    console.log(`Project Name: ${project.projectName}`);
    console.log(`Project ID: ${project._id}`);
    console.log(`\n📊 ALL LOCATION FIELDS:`);
    console.log(`  latitude: ${project.latitude}`);
    console.log(`  longitude: ${project.longitude}`);
    console.log(`  geofenceRadius: ${project.geofenceRadius}`);
    
    if (project.coordinates) {
      console.log(`\n  coordinates.latitude: ${project.coordinates.latitude}`);
      console.log(`  coordinates.longitude: ${project.coordinates.longitude}`);
    }
    
    if (project.geofence) {
      console.log(`\n  geofence.enabled: ${project.geofence.enabled}`);
      console.log(`  geofence.radius: ${project.geofence.radius}`);
      console.log(`  geofence.latitude: ${project.geofence.latitude}`);
      console.log(`  geofence.longitude: ${project.geofence.longitude}`);
      console.log(`  geofence.allowedVariance: ${project.geofence.allowedVariance}`);
      console.log(`  geofence.strictMode: ${project.geofence.strictMode}`);
      
      if (project.geofence.center) {
        console.log(`\n  geofence.center.latitude: ${project.geofence.center.latitude}`);
        console.log(`  geofence.center.longitude: ${project.geofence.center.longitude}`);
      }
    }

    // Calculate distance from your location
    console.log(`\n\n🎯 DISTANCE CALCULATION:`);
    console.log(`======================`);
    console.log(`Your location: ${MY_LOCATION.latitude}, ${MY_LOCATION.longitude}`);
    
    const distanceFromProject = calculateDistance(
      MY_LOCATION.latitude,
      MY_LOCATION.longitude,
      project.latitude,
      project.longitude
    );
    
    const distanceFromGeofenceCenter = project.geofence?.center ? calculateDistance(
      MY_LOCATION.latitude,
      MY_LOCATION.longitude,
      project.geofence.center.latitude,
      project.geofence.center.longitude
    ) : null;

    console.log(`\nDistance from project (lat/lon): ${Math.round(distanceFromProject)}m`);
    if (distanceFromGeofenceCenter !== null) {
      console.log(`Distance from geofence center: ${Math.round(distanceFromGeofenceCenter)}m`);
    }

    console.log(`\n\n✅ VALIDATION CHECKS:`);
    console.log(`====================`);
    console.log(`Geofence radius: ${project.geofence?.radius || project.geofenceRadius}m`);
    console.log(`Allowed variance: ${project.geofence?.allowedVariance || 0}m`);
    console.log(`Total allowed distance: ${(project.geofence?.radius || project.geofenceRadius) + (project.geofence?.allowedVariance || 0)}m`);
    
    const isWithinRadius = distanceFromProject <= (project.geofence?.radius || project.geofenceRadius);
    const isWithinVariance = distanceFromProject <= ((project.geofence?.radius || project.geofenceRadius) + (project.geofence?.allowedVariance || 0));
    
    console.log(`\nWithin radius? ${isWithinRadius ? '✅ YES' : '❌ NO'}`);
    console.log(`Within variance? ${isWithinVariance ? '✅ YES' : '❌ NO'}`);
    
    if (!isWithinRadius) {
      const distanceOver = distanceFromProject - (project.geofence?.radius || project.geofenceRadius);
      console.log(`\n⚠️  You are ${Math.round(distanceOver)}m too far from the project`);
    }

    // Check for inconsistencies
    console.log(`\n\n🔍 INCONSISTENCY CHECK:`);
    console.log(`======================`);
    
    const issues = [];
    
    if (project.geofence?.radius !== project.geofenceRadius) {
      issues.push(`⚠️  geofence.radius (${project.geofence?.radius}) != geofenceRadius (${project.geofenceRadius})`);
    }
    
    if (project.geofence?.latitude !== project.latitude) {
      issues.push(`⚠️  geofence.latitude (${project.geofence?.latitude}) != latitude (${project.latitude})`);
    }
    
    if (project.geofence?.longitude !== project.longitude) {
      issues.push(`⚠️  geofence.longitude (${project.geofence?.longitude}) != longitude (${project.longitude})`);
    }
    
    if (project.geofence?.center?.latitude !== project.latitude) {
      issues.push(`⚠️  geofence.center.latitude (${project.geofence?.center?.latitude}) != latitude (${project.latitude})`);
    }
    
    if (project.geofence?.center?.longitude !== project.longitude) {
      issues.push(`⚠️  geofence.center.longitude (${project.geofence?.center?.longitude}) != longitude (${project.longitude})`);
    }

    if (issues.length > 0) {
      console.log('Found inconsistencies:');
      issues.forEach(issue => console.log(`  ${issue}`));
    } else {
      console.log('✅ All location fields are consistent');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

diagnoseGeofenceIssue();
