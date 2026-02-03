// Check supervisor email field in Employee record
import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkSupervisorEmailField() {
  try {
    console.log('📧 Checking supervisor email field...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to database');

    // Find the supervisor (Suresh Kumar, ID: 17)
    const supervisor = await Employee.findOne({ id: 17 });
    if (!supervisor) {
      console.log('❌ Supervisor with ID 17 not found');
      return;
    }

    console.log('👨‍💼 Supervisor details:');
    console.log('  - ID:', supervisor.id);
    console.log('  - Name:', supervisor.fullName);
    console.log('  - Phone:', supervisor.phone || 'N/A');
    console.log('  - Email:', supervisor.email || 'NOT SET');
    console.log('  - Job Title:', supervisor.jobTitle);

    // Check if email field exists and has value
    if (supervisor.email) {
      console.log('✅ Supervisor has email in Employee record');
    } else {
      console.log('⚠️ Supervisor email field is empty, let\'s set one');
      
      // Update supervisor with an email
      const updateResult = await Employee.updateOne(
        { id: 17 },
        { 
          $set: { 
            email: 'suresh.supervisor@company.com',
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('✅ Updated supervisor email:', updateResult.modifiedCount, 'record(s) modified');
      
      // Verify the update
      const updatedSupervisor = await Employee.findOne({ id: 17 });
      console.log('📧 Updated supervisor email:', updatedSupervisor.email);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the check
checkSupervisorEmailField();