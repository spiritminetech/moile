import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const ProjectSchema = new mongoose.Schema({}, { strict: false, collection: 'projects' });
const Project = mongoose.model('Project', ProjectSchema);

async function testLocationFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check a few projects to see what location data they have
    const projects = await Project.find({ id: { $in: [1, 2, 1001, 1002, 1003] } }).lean();
    
    console.log('📍 Project Location Data:\n');
    projects.forEach(p => {
      console.log(`Project ${p.id}: ${p.projectName || p.name}`);
      console.log(`  - address: ${p.address || 'NOT SET'}`);
      console.log(`  - location: ${p.location || 'NOT SET'}`);
      console.log(`  - latitude: ${p.latitude || 'NOT SET'}`);
      console.log(`  - longitude: ${p.longitude || 'NOT SET'}`);
      console.log('');
    });

    // Now test the API response format
    console.log('\n📊 Testing API Response Format:\n');
    const apiProjects = projects.map(p => ({
      id: p.id,
      name: p.projectName || p.name,
      location: p.address || 'Unknown',
      geofenceRadius: p.geofenceRadius || p.geofence?.radius || 100
    }));

    console.log('API will return:');
    console.log(JSON.stringify(apiProjects, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testLocationFix();
