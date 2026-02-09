import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function debugEmployeeProjectLink() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find supervisor 4
    const supervisor = await Employee.findOne({ id: 4 });
    console.log('Supervisor:', {
      id: supervisor.id,
      userId: supervisor.userId,
      fullName: supervisor.fullName
    });

    // Get supervisor's projects
    const projects = await Project.find({ supervisorId: supervisor.id });
    console.log(`\nSupervisor's Projects: ${projects.length}`);
    projects.forEach(p => {
      console.log(`  - ID: ${p.id}, Name: ${p.name}`);
    });

    const projectIds = projects.map(p => p.id);

    // Try different queries to find employees
    console.log('\n' + '='.repeat(60));
    console.log('Testing different employee queries:');
    console.log('='.repeat(60));

    // Query 1: Using currentProject.id
    const employees1 = await Employee.find({ 
      'currentProject.id': { $in: projectIds } 
    });
    console.log(`\n1. Query with 'currentProject.id': ${employees1.length} employees`);
    if (employees1.length > 0) {
      employees1.forEach(e => {
        console.log(`   - ${e.fullName} (ID: ${e.id})`);
        console.log(`     currentProject:`, e.currentProject);
      });
    }

    // Query 2: Check all employees and their currentProject structure
    const allEmployees = await Employee.find({ companyId: 1 }).limit(10);
    console.log(`\n2. Sample of all employees (first 10):`);
    allEmployees.forEach(e => {
      console.log(`   - ${e.fullName || 'No name'} (ID: ${e.id})`);
      console.log(`     currentProject:`, e.currentProject);
      console.log(`     Has currentProject.id:`, !!e.currentProject?.id);
    });

    // Query 3: Find employees we created in the test data script
    const testEmployees = await Employee.find({
      fullName: { $in: ['Ravi Smith', 'Rahul Nair', 'Suresh Kumar', 'Mahesh', 'Ganesh'] }
    });
    console.log(`\n3. Test employees from setup script: ${testEmployees.length}`);
    testEmployees.forEach(e => {
      console.log(`   - ${e.fullName} (ID: ${e.id})`);
      console.log(`     currentProject:`, e.currentProject);
      console.log(`     Project ID in currentProject:`, e.currentProject?.id);
      console.log(`     Is in supervisor's projects:`, projectIds.includes(e.currentProject?.id));
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

debugEmployeeProjectLink();
