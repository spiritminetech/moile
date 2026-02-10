/**
 * Create task assignment for employeeId=2 with supervisor
 * This will allow testing the supervisor display in the dashboard
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

// Define schemas
const employeeSchema = new mongoose.Schema({
  id: Number,
  fullName: String,
  email: String,
  phone: String,
  jobTitle: String,
  status: String,
  companyId: Number
}, { collection: 'employees' });

const workerTaskAssignmentSchema = new mongoose.Schema({
  id: Number,
  employeeId: Number,
  projectId: Number,
  taskId: Number,
  supervisorId: Number,
  date: String,
  status: String,
  sequence: Number,
  priority: String,
  workArea: String,
  floor: String,
  zone: String,
  progressPercent: Number,
  dailyTarget: Object,
  timeEstimate: Object,
  dependencies: Array,
  startTime: String
}, { collection: 'workertaskassignments' });

const projectSchema = new mongoose.Schema({
  id: Number,
  projectName: String,
  projectCode: String,
  address: String,
  companyId: Number,
  status: String,
  latitude: Number,
  longitude: Number,
  geofenceRadius: Number
}, { collection: 'projects' });

const taskSchema = new mongoose.Schema({
  id: Number,
  taskName: String,
  taskType: String,
  description: String,
  projectId: Number,
  companyId: Number
}, { collection: 'tasks' });

const Employee = mongoose.model('Employee', employeeSchema);
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', workerTaskAssignmentSchema);
const Project = mongoose.model('Project', projectSchema);
const Task = mongoose.model('Task', taskSchema);

async function createTaskForEmployee2() {
  try {
    console.log('🔧 Creating Task Assignment for employeeId=2\n');
    console.log('=' .repeat(70));

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Find the employee
    console.log('1️⃣ Finding Employee with id=2...');
    const employee = await Employee.findOne({ id: 2 });
    
    if (!employee) {
      console.log('❌ Employee with id=2 not found!');
      return;
    }

    console.log('✅ Employee Found:');
    console.log('   Name:', employee.fullName);
    console.log('   Company ID:', employee.companyId);

    // Step 2: Find or create a project
    console.log('\n2️⃣ Finding Project...');
    let project = await Project.findOne({ 
      companyId: employee.companyId,
      status: 'ACTIVE'
    });

    if (!project) {
      console.log('⚠️  No active project found, checking all projects...');
      project = await Project.findOne({ companyId: employee.companyId });
    }

    if (!project) {
      console.log('❌ No project found for company:', employee.companyId);
      console.log('   Please create a project first');
      return;
    }

    console.log('✅ Project Found:');
    console.log('   ID:', project.id);
    console.log('   Name:', project.projectName);

    // Step 3: Find or create a task
    console.log('\n3️⃣ Finding Task...');
    let task = await Task.findOne({ 
      projectId: project.id,
      companyId: employee.companyId
    });

    if (!task) {
      console.log('⚠️  No task found, checking all tasks...');
      task = await Task.findOne({ companyId: employee.companyId });
    }

    if (!task) {
      console.log('❌ No task found for company:', employee.companyId);
      console.log('   Please create a task first');
      return;
    }

    console.log('✅ Task Found:');
    console.log('   ID:', task.id);
    console.log('   Name:', task.taskName);

    // Step 4: Find a supervisor
    console.log('\n4️⃣ Finding Supervisor...');
    const supervisors = await Employee.find({
      companyId: employee.companyId,
      status: 'ACTIVE',
      $or: [
        { jobTitle: /supervisor/i },
        { jobTitle: /manager/i },
        { jobTitle: /foreman/i },
        { jobTitle: /lead/i }
      ]
    });

    let supervisor = null;
    if (supervisors.length > 0) {
      supervisor = supervisors[0];
      console.log('✅ Supervisor Found:');
      console.log('   ID:', supervisor.id);
      console.log('   Name:', supervisor.fullName);
      console.log('   Title:', supervisor.jobTitle);
    } else {
      console.log('⚠️  No supervisor found with supervisor/manager title');
      console.log('   Looking for any other employee to use as supervisor...');
      
      const otherEmployees = await Employee.find({
        companyId: employee.companyId,
        status: 'ACTIVE',
        id: { $ne: employee.id } // Not the same employee
      }).limit(1);

      if (otherEmployees.length > 0) {
        supervisor = otherEmployees[0];
        console.log('✅ Using employee as supervisor:');
        console.log('   ID:', supervisor.id);
        console.log('   Name:', supervisor.fullName);
        console.log('   Title:', supervisor.jobTitle);
      } else {
        console.log('❌ No other employees found to assign as supervisor');
        console.log('   Creating assignment without supervisor...');
      }
    }

    // Step 5: Get next assignment ID
    console.log('\n5️⃣ Creating Task Assignment...');
    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 });
    const nextId = lastAssignment ? lastAssignment.id + 1 : 1;

    const today = new Date().toISOString().split('T')[0];

    const newAssignment = {
      id: nextId,
      employeeId: employee.id,
      projectId: project.id,
      taskId: task.id,
      supervisorId: supervisor ? supervisor.id : null,
      date: today,
      status: 'queued',
      sequence: 1,
      priority: 'medium',
      workArea: 'Main Building',
      floor: 'Ground Floor',
      zone: 'Zone A',
      progressPercent: 0,
      dailyTarget: {
        description: 'Complete plumbing installation',
        quantity: 10,
        unit: 'units',
        targetCompletion: 100
      },
      timeEstimate: {
        estimated: 480, // 8 hours in minutes
        elapsed: 0,
        remaining: 480
      },
      dependencies: [],
      startTime: null
    };

    const result = await WorkerTaskAssignment.create(newAssignment);
    console.log('✅ Task Assignment Created:');
    console.log('   Assignment ID:', result.id);
    console.log('   Employee:', employee.fullName);
    console.log('   Task:', task.taskName);
    console.log('   Project:', project.projectName);
    console.log('   Supervisor:', supervisor ? supervisor.fullName : 'None');
    console.log('   Date:', today);

    // Step 6: Verify
    console.log('\n6️⃣ Verifying Assignment...');
    const verify = await WorkerTaskAssignment.findOne({ id: nextId });
    
    if (verify) {
      console.log('✅ Assignment verified in database');
      
      if (verify.supervisorId) {
        const verifySupervisor = await Employee.findOne({ id: verify.supervisorId });
        if (verifySupervisor) {
          console.log('✅ Supervisor verified:');
          console.log('   Name:', verifySupervisor.fullName);
          console.log('   Phone:', verifySupervisor.phone || 'N/A');
          console.log('   Email:', verifySupervisor.email || 'N/A');
        }
      } else {
        console.log('⚠️  No supervisor assigned to this task');
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(70));
    console.log('📊 SUMMARY');
    console.log('=' .repeat(70));
    console.log('✅ Task assignment created successfully');
    console.log(`   Employee: ${employee.fullName} (ID: ${employee.id})`);
    console.log(`   Task: ${task.taskName}`);
    console.log(`   Project: ${project.projectName}`);
    console.log(`   Supervisor: ${supervisor ? supervisor.fullName : 'None'}`);
    console.log(`   Date: ${today}`);
    console.log('\n🧪 Next Steps:');
    console.log('   1. Run: node check-employee2-supervisor.js');
    console.log('   2. Run: node test-supervisor-display-fix.js');
    console.log('   3. Test in mobile app dashboard');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
createTaskForEmployee2();
