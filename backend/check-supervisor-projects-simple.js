import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Define schemas without strict validation to see actual data
const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const Employee = mongoose.model('Employee', EmployeeSchema);

const ProjectSchema = new mongoose.Schema({}, { strict: false, collection: 'projects' });
const Project = mongoose.model('Project', ProjectSchema);

async function checkSupervisorProjectsSimple() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the supervisor (Kawaja with id: 4)
    const supervisor = await Employee.findOne({ fullName: 'Kawaja' });
    console.log('👤 Supervisor:', {
      id: supervisor.id,
      name: supervisor.fullName,
      idType: typeof supervisor.id
    });

    // Check projects with supervisorId: 4
    const projects = await Project.find({ supervisorId: 4 });
    console.log(`\n📋 Projects with supervisorId: 4 → ${projects.length} found`);

    if (projects.length === 0) {
      // Assign a project to this supervisor
      const anyProject = await Project.findOne({});
      if (anyProject) {
        console.log(`\n🔧 Assigning project "${anyProject.name}" to supervisor (id: 4)...`);
        await Project.updateOne(
          { _id: anyProject._id },
          { supervisorId: 4 }
        );
        console.log('✅ Project assigned');
      }
    } else {
      projects.forEach((proj, idx) => {
        console.log(`${idx + 1}. ${proj.name} (ID: ${proj.id})`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

checkSupervisorProjectsSimple();