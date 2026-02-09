import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { 
  collection: 'workertaskassignments',
  strict: false 
});
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

const EmployeeSchema = new mongoose.Schema({}, { 
  collection: 'employees',
  strict: false 
});
const Employee = mongoose.model('Employee', EmployeeSchema);

const ProjectSchema = new mongoose.Schema({}, { 
  collection: 'projects',
  strict: false 
});
const Project = mongoose.model('Project', ProjectSchema);

async function createTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = '2026-02-06';

    // Check if project 1 exists
    let project1 = await Project.findOne({ id: 1 });
    if (!project1) {
      console.log('Creating Project 1...');
      project1 = await Project.create({
        id: 1,
        projectName: 'Downtown Construction Site',
        location: 'Downtown, City Center',
        status: 'active',
        createdAt: new Date()
      });
      console.log('✅ Project 1 created');
    } else {
      console.log('✅ Project 1 already exists');
    }

    // Check if employee 104 exists (we'll use this for testing)
    let employee104 = await Employee.findOne({ id: 104 });
    if (!employee104) {
      console.log('\nCreating Employee 104...');
      employee104 = await Employee.create({
        id: 104,
        name: 'Sarah Williams',
        email: 'sarah.williams@example.com',
        phone: '+1234567104',
        role: 'worker',
        status: 'active',
        createdAt: new Date()
      });
      console.log('✅ Employee 104 created');
    } else {
      console.log('\n✅ Employee 104 already exists');
    }

    // Create task assignment for employee 104 on project 1 for today
    const existingAssignment = await WorkerTaskAssignment.findOne({
      employeeId: 104,
      projectId: 1,
      date: today
    });

    if (!existingAssignment) {
      console.log('\nCreating task assignment for Employee 104...');
      await WorkerTaskAssignment.create({
        employeeId: 104,
        projectId: 1,
        taskName: 'Concrete Pouring',
        date: today,
        startTime: '08:00',
        endTime: '17:00',
        status: 'assigned',
        createdAt: new Date()
      });
      console.log('✅ Task assignment created');
    } else {
      console.log('\n✅ Task assignment already exists');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST DATA READY!');
    console.log('='.repeat(60));
    console.log('\n📋 You can now test manual attendance override with:');
    console.log('\nPOST http://192.168.1.8:5002/api/supervisor/manual-attendance-override');
    console.log('\nBody:');
    console.log(JSON.stringify({
      employeeId: 104,
      projectId: 1,
      date: '2026-02-06',
      checkInTime: '2026-02-06T08:00:00.000Z',
      checkOutTime: '2026-02-06T17:00:00.000Z',
      reason: 'Network issue prevented automatic check-in',
      overrideType: 'FULL_DAY'
    }, null, 2));

    await mongoose.connection.close();
    console.log('\n✅ Done');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestData();
