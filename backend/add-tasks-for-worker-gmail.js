// Add Two New Tasks for worker@gmail.com
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Import models
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false, collection: 'projects' }));

async function addTasksForWorkerGmail() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user with email worker@gmail.com
    const user = await User.findOne({ email: 'worker@gmail.com' });
    if (!user) {
      console.log('❌ User not found with email worker@gmail.com');
      process.exit(1);
    }
    console.log('✅ Found user:', {
      userId: user.userId,
      email: user.email,
      name: user.name,
      employeeId: user.employeeId
    });

    // Try to find employee linked to this user
    let employee = await Employee.findOne({ employeeId: user.employeeId });
    if (!employee) {
      console.log('⚠️  Employee record not found, using user data directly');
      // Create a pseudo-employee object from user data
      employee = {
        employeeId: user.employeeId,
        name: user.name || 'Worker User',
        email: user.email
      };
    }
    console.log('✅ Using employee data:', {
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email
    });

    // Find any project
    const projects = await Project.find().limit(5);
    console.log(`\n📊 Found ${projects.length} projects:`);
    projects.forEach(p => {
      console.log(`  - ${p.projectName} (ID: ${p.projectId})`);
    });

    const project = projects[0];
    if (!project) {
      console.log('❌ No projects found');
      process.exit(1);
    }
    console.log(`\n✅ Using project: ${project.projectName} (ID: ${project.projectId})`);

    // Get current max assignment ID
    const maxAssignment = await WorkerTaskAssignment.findOne().sort({ assignmentId: -1 });
    const nextAssignmentId = (maxAssignment?.assignmentId || 7000) + 1;
    console.log('📊 Next assignment ID:', nextAssignmentId);

    // Today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Task 1: Plumbing Installation
    const task1 = {
      assignmentId: nextAssignmentId,
      projectId: project.projectId,
      projectName: project.projectName,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      supervisorId: 4,
      supervisorName: 'Supervisor Gmail',
      supervisorContact: '+65 9876 5432',
      supervisorEmail: 'supervisor.gmail@example.com',
      taskName: 'Plumbing Installation - Level 2',
      description: 'Install water supply and drainage pipes for Level 2 residential units',
      workArea: 'Level 2',
      floor: '2',
      zone: 'North Wing',
      trade: 'Plumbing',
      activity: 'Installation',
      workType: 'Plumbing Works',
      status: 'queued',
      priority: 'high',
      sequence: 1,
      dependencies: [],
      estimatedHours: 6,
      dailyTarget: {
        description: 'Complete plumbing installation for 4 units',
        quantity: 4,
        unit: 'units',
        targetCompletion: 100,
        targetType: 'quantity',
        areaLevel: 'Level 2 - Units 201-204',
        startTime: '08:00',
        expectedFinish: '14:00'
      },
      supervisorInstructions: 'Please ensure all pipe joints are properly sealed and pressure tested. Follow the plumbing layout drawings carefully. Report any discrepancies immediately.',
      instructionAttachments: [],
      requiredTools: ['Pipe Wrench', 'Pipe Cutter', 'Pressure Test Kit', 'Level Tool'],
      requiredMaterials: ['PVC Pipes', 'Pipe Fittings', 'Teflon Tape', 'PVC Cement'],
      assignedDate: today,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Task 2: HVAC Duct Installation
    const task2 = {
      assignmentId: nextAssignmentId + 1,
      projectId: project.projectId,
      projectName: project.projectName,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      supervisorId: 4,
      supervisorName: 'Supervisor Gmail',
      supervisorContact: '+65 9876 5432',
      supervisorEmail: 'supervisor.gmail@example.com',
      taskName: 'HVAC Duct Installation - Level 3',
      description: 'Install air conditioning ductwork and vents for Level 3 common areas',
      workArea: 'Level 3',
      floor: '3',
      zone: 'Common Area',
      trade: 'HVAC',
      activity: 'Installation',
      workType: 'Mechanical Works',
      status: 'queued',
      priority: 'medium',
      sequence: 2,
      dependencies: [nextAssignmentId], // Depends on Task 1
      estimatedHours: 8,
      dailyTarget: {
        description: 'Install ductwork for common corridor',
        quantity: 25,
        unit: 'meters',
        targetCompletion: 100,
        targetType: 'quantity',
        areaLevel: 'Level 3 - Common Corridor',
        startTime: '08:00',
        expectedFinish: '16:00'
      },
      supervisorInstructions: 'Ensure proper duct sealing and insulation. Maintain minimum clearances as per drawings. Coordinate with electrical team for lighting fixtures.',
      instructionAttachments: [],
      requiredTools: ['Duct Cutter', 'Rivet Gun', 'Measuring Tape', 'Drill'],
      requiredMaterials: ['Galvanized Ducts', 'Duct Tape', 'Insulation', 'Screws & Rivets'],
      assignedDate: today,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('\n📝 Creating Task 1: Plumbing Installation...');
    const createdTask1 = await WorkerTaskAssignment.create(task1);
    console.log('✅ Task 1 created:', {
      assignmentId: createdTask1.assignmentId,
      taskName: createdTask1.taskName,
      status: createdTask1.status,
      priority: createdTask1.priority,
      sequence: createdTask1.sequence
    });

    console.log('\n📝 Creating Task 2: HVAC Duct Installation...');
    const createdTask2 = await WorkerTaskAssignment.create(task2);
    console.log('✅ Task 2 created:', {
      assignmentId: createdTask2.assignmentId,
      taskName: createdTask2.taskName,
      status: createdTask2.status,
      priority: createdTask2.priority,
      sequence: createdTask2.sequence,
      dependencies: createdTask2.dependencies
    });

    // Verify tasks
    console.log('\n🔍 Verifying tasks for worker...');
    const workerTasks = await WorkerTaskAssignment.find({
      employeeId: employee.employeeId,
      assignedDate: { $gte: today }
    }).sort({ sequence: 1 });

    console.log(`\n📊 Total tasks for today: ${workerTasks.length}`);
    workerTasks.forEach((task, index) => {
      console.log(`\n${index + 1}. ${task.taskName}`);
      console.log(`   Assignment ID: ${task.assignmentId}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Priority: ${task.priority}`);
      console.log(`   Sequence: ${task.sequence}`);
      console.log(`   Dependencies: ${task.dependencies?.length || 0}`);
      console.log(`   Daily Target: ${task.dailyTarget?.quantity || 'N/A'} ${task.dailyTarget?.unit || ''}`);
    });

    console.log('\n✅ Two new tasks added successfully!');
    console.log('\n📱 You can now test these tasks in the mobile app:');
    console.log('   1. Login as worker@gmail.com / password123');
    console.log('   2. Go to Today\'s Tasks');
    console.log('   3. You should see the new Plumbing and HVAC tasks');
    console.log('\n🧪 Test the START TASK validation flow:');
    console.log('   - Try starting Task 2 (HVAC) before Task 1 → Should show dependency warning');
    console.log('   - Try starting without checking in → Should show "Check In" dialog');
    console.log('   - Start Task 1, then try Task 2 → Should show "Pause and start" dialog');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

addTasksForWorkerGmail();
