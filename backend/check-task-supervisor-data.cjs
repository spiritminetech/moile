const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://anbarasus2410_db_user:Anbu24102002@ac-vtmilrh-shard-00-00.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-01.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-02.hlff2qz.mongodb.net:27017/erp?tls=true&replicaSet=atlas-qbnji8-shard-0&authSource=admin&retryWrites=true&w=majority';

async function checkTaskSupervisorData() {
  try {
    console.log('🔍 Checking Task Supervisor Data...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get WorkerTaskAssignment model
    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment');
    
    // Find all tasks
    const tasks = await WorkerTaskAssignment.find({}).limit(5);
    
    console.log(`📊 Found ${tasks.length} tasks\n`);
    
    tasks.forEach((task, index) => {
      console.log(`\n--- Task ${index + 1} ---`);
      console.log('Assignment ID:', task.assignmentId);
      console.log('Task Name:', task.taskName);
      console.log('Status:', task.status);
      console.log('\n🔍 Supervisor Fields:');
      console.log('  supervisorName:', task.supervisorName || '❌ NOT SET');
      console.log('  supervisorContact:', task.supervisorContact || '❌ NOT SET');
      console.log('  supervisorId:', task.supervisorId || '❌ NOT SET');
      console.log('  reportingTo:', task.reportingTo || '❌ NOT SET');
      
      console.log('\n📋 All fields in task:');
      console.log(Object.keys(task.toObject()));
    });

    // Check if any tasks have supervisor data
    const tasksWithSupervisorName = await WorkerTaskAssignment.countDocuments({ 
      supervisorName: { $exists: true, $ne: null, $ne: '' } 
    });
    const tasksWithSupervisorContact = await WorkerTaskAssignment.countDocuments({ 
      supervisorContact: { $exists: true, $ne: null, $ne: '' } 
    });
    
    console.log('\n\n📊 Summary:');
    console.log(`Total tasks: ${await WorkerTaskAssignment.countDocuments({})}`);
    console.log(`Tasks with supervisorName: ${tasksWithSupervisorName}`);
    console.log(`Tasks with supervisorContact: ${tasksWithSupervisorContact}`);

    // Check Employee collection for supervisor data
    console.log('\n\n🔍 Checking Employee collection for supervisors...');
    const Employee = mongoose.model('Employee');
    const supervisors = await Employee.find({ 
      role: { $in: ['supervisor', 'Supervisor'] }
    }).limit(3);
    
    console.log(`\nFound ${supervisors.length} supervisors:`);
    supervisors.forEach(sup => {
      console.log(`\n  - ${sup.name}`);
      console.log(`    ID: ${sup.employeeId}`);
      console.log(`    Phone: ${sup.phone || '❌ NOT SET'}`);
      console.log(`    Email: ${sup.email || '❌ NOT SET'}`);
    });

    await mongoose.disconnect();
    console.log('\n\n✅ Check complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTaskSupervisorData();
