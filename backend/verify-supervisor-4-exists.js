import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

async function verifySupervisor() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check supervisor with ID 4
    console.log('\n🔍 Looking for supervisor with ID 4...');
    
    const supervisor = await Employee.findOne({ id: 4 });
    
    if (supervisor) {
      console.log('✅ Found supervisor:');
      console.log(`  ID: ${supervisor.id}`);
      console.log(`  Name: ${supervisor.fullName}`);
      console.log(`  Phone: ${supervisor.phone}`);
      console.log(`  Email: ${supervisor.email || 'NOT SET'}`);
      console.log(`  Status: ${supervisor.status}`);
      console.log(`  Job Title: ${supervisor.jobTitle}`);
    } else {
      console.log('❌ Supervisor with ID 4 not found');
      
      // Check if there are any employees with similar names
      const kawaja = await Employee.find({ 
        fullName: { $regex: /kawaja/i } 
      }).lean();
      
      console.log(`\nFound ${kawaja.length} employees with "Kawaja" in name:`);
      kawaja.forEach(e => {
        console.log(`  - ID: ${e.id}, Name: ${e.fullName}, Status: ${e.status}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

verifySupervisor();
