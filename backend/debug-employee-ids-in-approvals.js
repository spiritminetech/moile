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

async function debugEmployeeIdsInApprovals() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Simulate the same logic as getPendingApprovalsSummary
    console.log('🔍 Simulating getPendingApprovalsSummary logic...\n');

    // Find supervisor by userId (using supervisor@gmail.com user)
    const supervisor = await Employee.findOne({ userId: "693bb90c27d90084304ed3e8" }).lean();
    
    if (!supervisor) {
      console.log('❌ Supervisor not found');
      return;
    }

    console.log('👤 Supervisor found:', {
      id: supervisor.id,
      name: supervisor.fullName,
      userId: supervisor.userId,
      idType: typeof supervisor.id
    });

    // Get all projects assigned to this supervisor
    const projects = await Project.find({ supervisorId: supervisor.id }).lean();
    console.log(`\n📋 Found ${projects.length} projects for supervisor`);
    
    if (projects.length === 0) {
      console.log('❌ No projects found for supervisor');
      return;
    }

    const projectIds = projects.map(p => p.id);
    console.log('Project IDs:', projectIds);

    // Get all employees assigned to supervisor's projects
    const employees = await Employee.find({ 
      $or: [
        { 'currentProject.id': { $in: projectIds } },
        { currentProjectId: { $in: projectIds } }
      ]
    }).lean();

    console.log(`\n👷 Found ${employees.length} employees assigned to projects`);

    // Show all employee IDs and their types
    const allEmployeeIds = employees.map(e => e.id);
    console.log('\n🔍 All Employee IDs:');
    allEmployeeIds.forEach((id, idx) => {
      console.log(`   ${idx + 1}. ${id} (type: ${typeof id})`);
    });

    // Filter employeeIds to only include numeric values
    const numericEmployeeIds = allEmployeeIds.filter(id => typeof id === 'number' && !isNaN(id));
    const stringEmployeeIds = allEmployeeIds.filter(id => typeof id === 'string');

    console.log('\n📊 Employee ID Analysis:');
    console.log(`   Total employees: ${employees.length}`);
    console.log(`   Numeric IDs: ${numericEmployeeIds.length}`);
    console.log(`   String IDs: ${stringEmployeeIds.length}`);
    
    console.log('\n🔢 Numeric Employee IDs:', numericEmployeeIds);
    console.log('🔤 String Employee IDs:', stringEmployeeIds.slice(0, 5)); // Show first 5

    // Check if the problematic ID is in the list
    const problematicId = "6988a902414b8c4f1158468b1";
    const hasProblematicId = allEmployeeIds.includes(problematicId);
    console.log(`\n🚨 Contains problematic ID "${problematicId}": ${hasProblematicId ? 'YES' : 'NO'}`);

    if (hasProblematicId) {
      console.log('❌ The problematic ID is still in the employee list!');
      console.log('   This means the filtering is not working or the ID is coming from elsewhere.');
    }

    await mongoose.disconnect();
    console.log('\n✅ Debug complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

debugEmployeeIdsInApprovals();