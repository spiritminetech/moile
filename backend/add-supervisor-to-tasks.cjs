const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://anbarasus2410_db_user:Anbu24102002@ac-vtmilrh-shard-00-00.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-01.hlff2qz.mongodb.net:27017,ac-vtmilrh-shard-00-02.hlff2qz.mongodb.net:27017/erp?tls=true&replicaSet=atlas-qbnji8-shard-0&authSource=admin&retryWrites=true&w=majority';

async function addSupervisorToTasks() {
  try {
    console.log('🔧 Adding Supervisor Data to Tasks...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const tasksCollection = db.collection('workertaskassignments');
    const employeesCollection = db.collection('employees');
    const projectsCollection = db.collection('projects');
    
    // Find a supervisor from employees
    let supervisor = await employeesCollection.findOne({ 
      role: { $in: ['supervisor', 'Supervisor'] }
    });
    
    // If no supervisor found, check users collection
    if (!supervisor) {
      console.log('⚠️ No supervisor found in employees, checking users...');
      const usersCollection = db.collection('users');
      const supervisorUser = await usersCollection.findOne({ 
        role: { $in: ['supervisor', 'Supervisor'] }
      });
      
      if (supervisorUser) {
        // Find corresponding employee
        supervisor = await employeesCollection.findOne({ 
          userId: supervisorUser._id 
        });
        
        if (!supervisor) {
          // Create a default supervisor entry
          console.log('📝 Creating default supervisor data...');
          supervisor = {
            employeeId: 4,
            name: 'Site Supervisor',
            phone: '+65 9123 4567',
            email: 'supervisor@gmail.com',
            role: 'supervisor'
          };
        }
      }
    }
    
    // If still no supervisor, create a default one
    if (!supervisor) {
      console.log('📝 Creating default supervisor data...');
      supervisor = {
        employeeId: 4,
        name: 'Site Supervisor',
        phone: '+65 9123 4567',
        email: 'supervisor@gmail.com',
        role: 'supervisor'
      };
    }
    
    console.log('👨‍🔧 Using Supervisor:');
    console.log(`  Name: ${supervisor.name}`);
    console.log(`  Phone: ${supervisor.phone || 'N/A'}`);
    console.log(`  Email: ${supervisor.email || 'N/A'}`);
    console.log(`  Employee ID: ${supervisor.employeeId || 'N/A'}\n`);
    
    // Update all tasks with supervisor information
    const result = await tasksCollection.updateMany(
      {}, // Update all tasks
      {
        $set: {
          supervisorName: supervisor.name,
          supervisorContact: supervisor.phone || '+65 9123 4567',
          supervisorId: supervisor.employeeId || 4,
          supervisorEmail: supervisor.email || 'supervisor@gmail.com'
        }
      }
    );
    
    console.log(`\n✅ Updated ${result.modifiedCount} tasks with supervisor data`);
    
    // Verify the update
    const sampleTask = await tasksCollection.findOne({});
    console.log('\n📋 Sample Task After Update:');
    console.log('  supervisorName:', sampleTask.supervisorName);
    console.log('  supervisorContact:', sampleTask.supervisorContact);
    console.log('  supervisorId:', sampleTask.supervisorId);
    console.log('  supervisorEmail:', sampleTask.supervisorEmail);
    
    await mongoose.disconnect();
    console.log('\n\n✅ Supervisor data added successfully!');
    console.log('\n💡 Now restart your mobile app to see the supervisor contact buttons.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addSupervisorToTasks();
