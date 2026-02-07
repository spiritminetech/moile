import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function findSupervisor4() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to database\n');

    // Find all supervisors
    const supervisors = await Employee.find({
      jobTitle: /supervisor/i
    }).sort({ id: 1 });

    console.log(`📋 Found ${supervisors.length} supervisors:\n`);
    
    for (const sup of supervisors) {
      const user = await User.findOne({ id: sup.userId });
      console.log(`Supervisor ID: ${sup.id}`);
      console.log(`  Name: ${sup.fullName}`);
      console.log(`  Email: ${user?.email || 'N/A'}`);
      console.log(`  Company ID: ${sup.companyId}`);
      console.log(`  Project: ${sup.currentProject?.name || 'N/A'} (ID: ${sup.currentProject?.id || 'N/A'})`);
      console.log('');
    }

    // Check if supervisor ID 4 exists
    const sup4 = await Employee.findOne({ id: 4 });
    if (sup4) {
      console.log('✅ Employee ID 4 exists:');
      console.log(`   Name: ${sup4.fullName}`);
      console.log(`   Job Title: ${sup4.jobTitle}`);
    } else {
      console.log('❌ No employee with ID 4 found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

findSupervisor4();
