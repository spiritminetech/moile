import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function setupSupervisorTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Get the supervisor@gmail.com user
    const user = await db.collection('users').findOne({ email: 'supervisor@gmail.com' });
    
    if (!user) {
      console.log('❌ supervisor@gmail.com not found');
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})\n`);

    // Create or update employee for supervisor
    console.log('Step 1: Creating/updating employee...');
    
    const existingEmployee = await db.collection('employees').findOne({ id: 100 });
    
    if (!existingEmployee) {
      await db.collection('employees').insertOne({
        id: 100,
        fullName: 'John Supervisor',
        employeeCode: 'SUP100',
        email: 'supervisor@gmail.com',
        phone: '1234567890',
        companyId: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Created employee ID 100\n');
    } else {
      console.log('✅ Employee ID 100 already exists\n');
    }

    // Create supervisor record
    console.log('Step 2: Creating supervisor record...');
    
    const existingSupervisor = await db.collection('supervisors').findOne({ userId: user.id });
    
    let supervisorId;
    if (!existingSupervisor) {
      // Get next supervisor ID
      const lastSupervisor = await db.collection('supervisors')
        .find({})
        .sort({ id: -1 })
        .limit(1)
        .toArray();
      
      supervisorId = lastSupervisor.length > 0 ? lastSupervisor[0].id + 1 : 1;

      await db.collection('supervisors').insertOne({
        id: supervisorId,
        userId: user.id,
        employeeId: 100,
        companyId: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Created supervisor record (ID: ${supervisorId})\n`);
    } else {
      supervisorId = existingSupervisor.id;
      console.log(`✅ Supervisor record already exists (ID: ${supervisorId})\n`);
    }

    // Create/update projects
    console.log('Step 3: Creating/updating projects...');
    
    const projects = [
      {
        id: 1,
        projectName: 'Downtown Construction',
        location: 'Downtown Area',
        supervisorId: supervisorId,
        companyId: 1,
        isActive: true
      },
      {
        id: 2,
        projectName: 'Highway Bridge',
        location: 'Highway 101',
        supervisorId: supervisorId,
        companyId: 1,
        isActive: true
      }
    ];

    for (const project of projects) {
      await db.collection('projects').updateOne(
        { id: project.id },
        { 
          $set: { 
            ...project,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log(`✅ Project ${project.id}: ${project.projectName}`);
    }

    // Create workers
    console.log('\nStep 4: Creating workers...');
    
    const workers = [
      { id: 101, fullName: 'Worker One', employeeCode: 'WRK101', email: 'worker1@test.com' },
      { id: 102, fullName: 'Worker Two', employeeCode: 'WRK102', email: 'worker2@test.com' },
      { id: 103, fullName: 'Worker Three', employeeCode: 'WRK103', email: 'worker3@test.com' }
    ];

    for (const worker of workers) {
      await db.collection('employees').updateOne(
        { id: worker.id },
        {
          $set: {
            ...worker,
            companyId: 1,
            isActive: true,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log(`✅ Worker ${worker.id}: ${worker.fullName}`);
    }

    // Create tasks
    console.log('\nStep 5: Creating tasks...');
    
    const tasks = [
      { id: 1, taskName: 'Concrete Pouring', description: 'Pour concrete foundation' },
      { id: 2, taskName: 'Steel Fixing', description: 'Install steel reinforcement' },
      { id: 3, taskName: 'Bricklaying', description: 'Build brick walls' }
    ];

    for (const task of tasks) {
      await db.collection('tasks').updateOne(
        { id: task.id },
        {
          $set: {
            ...task,
            companyId: 1,
            isActive: true,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log(`✅ Task ${task.id}: ${task.taskName}`);
    }

    // Create task assignments
    console.log('\nStep 6: Creating task assignments...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get next assignment ID
    const lastAssignment = await db.collection('workertaskassignments')
      .find({})
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    
    let nextId = lastAssignment.length > 0 ? lastAssignment[0].id + 1 : 1;

    const assignments = [
      {
        id: nextId++,
        employeeId: 101,
        taskId: 1,
        projectId: 1,
        date: today,
        status: 'queued',
        sequence: 1,
        dailyTarget: { quantity: 30, unit: 'cubic meters' },
        priority: 'HIGH',
        timeEstimate: 240
      },
      {
        id: nextId++,
        employeeId: 102,
        taskId: 2,
        projectId: 1,
        date: today,
        status: 'queued',
        sequence: 1,
        dailyTarget: { quantity: 50, unit: 'steel bars' },
        priority: 'MEDIUM',
        timeEstimate: 180
      },
      {
        id: nextId++,
        employeeId: 103,
        taskId: 3,
        projectId: 1,
        date: today,
        status: 'queued',
        sequence: 1,
        dailyTarget: { quantity: 100, unit: 'bricks' },
        priority: 'MEDIUM',
        timeEstimate: 300
      }
    ];

    for (const assignment of assignments) {
      await db.collection('workertaskassignments').insertOne({
        ...assignment,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Assignment ${assignment.id}: Worker ${assignment.employeeId} → Task ${assignment.taskId}`);
    }

    // Verify setup
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('✅ SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📧 Login Credentials:');
    console.log('   Email: supervisor@gmail.com');
    console.log('   Password: password123\n');

    console.log('📋 Test Data Created:');
    console.log(`   - Supervisor ID: ${supervisorId}`);
    console.log(`   - Projects: 2 (IDs: 1, 2)`);
    console.log(`   - Workers: 3 (IDs: 101, 102, 103)`);
    console.log(`   - Tasks: 3 (IDs: 1, 2, 3)`);
    console.log(`   - Task Assignments: 3 (for today)\n`);

    console.log('🧪 Test the API:');
    console.log('   1. Login: POST http://192.168.0.3:5002/api/auth/login');
    console.log('   2. Get Tasks: GET http://192.168.0.3:5002/api/supervisor/active-tasks/1');
    console.log('   3. Update Targets: PUT http://192.168.0.3:5002/api/supervisor/daily-targets\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

setupSupervisorTestData();
