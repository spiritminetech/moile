import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function fixAllProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'erp' });
    
    // Check what project the worker is assigned to
    const assignments = await WorkerTaskAssignment.find({ employeeId: 107 });
    console.log('Worker 107 assignments:');
    assignments.forEach(assignment => {
      console.log('- Project ID:', assignment.projectId, 'Date:', assignment.date);
    });
    
    // Find all projects with the old coordinates
    const problemProjects = await Project.find({ 
      latitude: 12.865141646709928,
      longitude: 77.6467982341202 
    });
    
    console.log('\n=== PROJECTS TO UPDATE ===');
    problemProjects.forEach(project => {
      console.log('Project ID:', project.id, 'Name:', project.projectName);
      console.log('Current coordinates:', project.latitude, project.longitude);
    });
    
    // Update ALL projects with the old coordinates to use the new ones
    const updateResult = await Project.updateMany(
      { 
        latitude: 12.865141646709928,
        longitude: 77.6467982341202 
      },
      {
        $set: {
          latitude: 40.7128,
          longitude: -74.0060,
          geofenceRadius: 500,
          'geofence.center.latitude': 40.7128,
          'geofence.center.longitude': -74.0060,
          'geofence.radius': 500,
          'geofence.strictMode': false,
          'geofence.allowedVariance': 100
        }
      }
    );
    
    console.log('\n✅ Update result:', updateResult);
    console.log('✅ Projects updated:', updateResult.modifiedCount);
    
    // Verify the update
    const remainingProblemProjects = await Project.find({ 
      latitude: 12.865141646709928,
      longitude: 77.6467982341202 
    });
    
    console.log('\n📊 Remaining projects with old coordinates:', remainingProblemProjects.length);
    
    if (remainingProblemProjects.length === 0) {
      console.log('🎉 SUCCESS: All projects updated to new coordinates!');
    }
    
    // Show all projects for company 1 now
    const allProjects = await Project.find({ companyId: 1 }).sort({ id: 1 });
    console.log('\n=== ALL PROJECTS FOR COMPANY 1 (AFTER UPDATE) ===');
    allProjects.forEach(project => {
      console.log(`ID: ${project.id} - ${project.projectName}`);
      console.log(`  Coordinates: ${project.latitude}, ${project.longitude}`);
      console.log(`  Status: ${project.status}`);
      console.log('---');
    });
    
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

fixAllProjects();