const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://anbarasus2410_db_user:Anbu24102002@ac-vtmilrh-shard-00-00.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-01.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-02.hlff2qz.mongodb.net:27017/erp?tls=true&replicaSet=atlas-qbnji8-shard-0&authSource=admin&retryWrites=true&w=majority';

async function checkSupervisorData() {
  try {
    console.log('🔍 Checking Supervisor Data in Tasks...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Access the collection directly
    const db = mongoose.connection.db;
    const tasksCollection = db.collection('workertaskassignments');
    
    // Get total count
    const totalTasks = await tasksCollection.countDocuments();
    console.log(`📊 Total tasks in database: ${totalTasks}\n`);
    
    // Find sample tasks
    const sampleTasks = await tasksCollection.find({}).limit(3).toArray();
    
    console.log('📋 Sample Tasks:\n');
    sampleTasks.forEach((task, index) => {
      console.log(`--- Task ${index + 1} ---`);
      console.log('Assignment ID:', task.assignmentId);
      console.log('Task Name:', task.taskName);
      console.log('Status:', task.status);
      console.log('\n🔍 Supervisor Fields:');
      console.log('  supervisorName:', task.supervisorName || '❌ NOT SET');
      console.log('  supervisorContact:', task.supervisorContact || '❌ NOT SET');
      console.log('  supervisorId:', task.supervisorId || '❌ NOT SET');
      console.log('  reportingTo:', task.reportingTo || '❌ NOT SET');
      console.log('\n📋 Available fields:', Object.keys(task).join(', '));
      console.log('\n');
    });

    // Count tasks with supervisor data
    const tasksWithSupervisorName = await tasksCollection.countDocuments({ 
      supervisorName: { $exists: true, $ne: null, $ne: '' } 
    });
    const tasksWithSupervisorContact = await tasksCollection.countDocuments({ 
      supervisorContact: { $exists: true, $ne: null, $ne: '' } 
    });
    
    console.log('\n📊 Summary:');
    console.log(`Tasks with supervisorName: ${tasksWithSupervisorName} / ${totalTasks}`);
    console.log(`Tasks with supervisorContact: ${tasksWithSupervisorContact} / ${totalTasks}`);

    // Check Employee collection for supervisors
    console.log('\n\n🔍 Checking Employee collection for supervisors...');
    const employeesCollection = db.collection('employees');
    const supervisors = await employeesCollection.find({ 
      role: { $in: ['supervisor', 'Supervisor'] }
    }).limit(3).toArray();
    
    console.log(`\nFound ${supervisors.length} supervisors:`);
    supervisors.forEach(sup => {
      console.log(`\n  - ${sup.name}`);
      console.log(`    ID: ${sup.employeeId}`);
      console.log(`    Phone: ${sup.phone || '❌ NOT SET'}`);
      console.log(`    Email: ${sup.email || '❌ NOT SET'}`);
    });

    // Check if we need to add supervisor data
    if (tasksWithSupervisorContact === 0 && supervisors.length > 0) {
      console.log('\n\n⚠️ ISSUE FOUND:');
      console.log('Tasks do NOT have supervisor contact information!');
      console.log('But supervisors exist in the database.');
      console.log('\n💡 SOLUTION: Need to add supervisor data to tasks.');
    } else if (tasksWithSupervisorContact > 0) {
      console.log('\n\n✅ Tasks have supervisor contact information!');
    }

    await mongoose.disconnect();
    console.log('\n\n✅ Check complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSupervisorData();
