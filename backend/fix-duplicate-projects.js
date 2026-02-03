// Fix duplicate Project 1 records - keep Singapore, remove New York

import mongoose from 'mongoose';
import Project from './src/modules/project/models/Project.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function fixDuplicateProjects() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔧 Fixing duplicate Project 1 records...');
    
    // Find all Project 1 records
    const project1Records = await Project.find({ id: 1 });
    console.log(`📍 Found ${project1Records.length} Project 1 records:`);
    
    project1Records.forEach((project, index) => {
      console.log(`  Record ${index + 1}:`);
      console.log(`    _id: ${project._id}`);
      console.log(`    Coordinates: ${project.latitude}, ${project.longitude}`);
      console.log(`    Radius: ${project.geofenceRadius}`);
      console.log(`    Location: ${project.latitude === 1.3521 ? 'Singapore ✅' : 'New York ❌'}`);
    });
    
    // Delete the New York record (40.7128, -74.006)
    const deleteResult = await Project.deleteMany({
      id: 1,
      latitude: 40.7128,
      longitude: -74.006
    });
    
    console.log(`\n🗑️ Deleted ${deleteResult.deletedCount} New York Project 1 record(s)`);
    
    // Verify only Singapore record remains
    const remainingRecords = await Project.find({ id: 1 });
    console.log(`\n✅ Remaining Project 1 records: ${remainingRecords.length}`);
    
    if (remainingRecords.length === 1) {
      const project = remainingRecords[0];
      console.log(`   Coordinates: ${project.latitude}, ${project.longitude}`);
      console.log(`   Radius: ${project.geofenceRadius}m`);
      console.log(`   Location: Singapore ✅`);
    }
    
    await mongoose.disconnect();
    console.log('\n🎉 Project 1 cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixDuplicateProjects();