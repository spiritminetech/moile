import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Define schemas without strict validation to see actual data
const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', UserSchema);

const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const Employee = mongoose.model('Employee', EmployeeSchema);

const ProjectSchema = new mongoose.Schema({}, { strict: false, collection: 'projects' });
const Project = mongoose.model('Project', ProjectSchema);

async function debugSupervisorProjects() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the supervisor
    const user = await User.findOne({ email: 'supervisor@gmail.com' });
    const supervisor = await Employee.findOne({ userId: user.id }).lean();
    
    if (!supervisor) {
      console.log('❌ Supervisor employee not found!');
      return;
    }
    
    console.log('👤 Supervisor:', {
      id: supervisor.id,
      name: supervisor.fullName,
      userId: supervisor.userId,
      idType: typeof supervisor.id
    });

    // Look for projects assigned to this supervisor
    console.log('\n🔍 Looking for projects with supervisorId:', supervisor.id);
    
    const projects = await Project.find({ supervisorId: supervisor.id }).lean();
    console.log(`📋 Found ${projects.length} projects assigned to supervisor`);
    
    if (projects.length === 0) {
      console.log('\n❌ No projects found! This is why the API returns empty approvals.');
      
      // Check what supervisorIds exist in projects
      const allProjects = await Project.find({}).limit(10);
      console.log('\n📊 Sample projects and their supervisorIds:');
      allProjects.forEach((proj, idx) => {
        console.log(`${idx + 1}. ${proj.name}: supervisorId=${proj.supervisorId} (type: ${typeof proj.supervisorId})`);
      });
      
      // Try to assign a project to our supervisor
      const anyProject = await Project.findOne({});
      if (anyProject) {
        console.log(`\n🔧 Assigning project "${anyProject.name}" to supervisor...`);
        await Project.updateOne(
          { _id: anyProject._id },
          { supervisorId: supervisor.id }
        );
        console.log('✅ Project assigned to supervisor');
      }
    } else {
      projects.forEach((proj, idx) => {
        console.log(`${idx + 1}. ${proj.name} (ID: ${proj.id})`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Debug complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

debugSupervisorProjects();