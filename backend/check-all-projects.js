import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkAllProjects() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');

    const allProjects = await Project.find({}).limit(5);
    
    console.log('\n📋 First 5 Projects (full data):');
    allProjects.forEach((p, index) => {
      console.log(`\n--- Project ${index + 1} ---`);
      console.log(JSON.stringify(p.toObject(), null, 2));
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkAllProjects();
