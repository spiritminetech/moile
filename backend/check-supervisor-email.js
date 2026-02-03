// Check supervisor email issue
import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkSupervisorEmail() {
  try {
    console.log('📧 Checking supervisor email...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to database');

    // Find the supervisor (Suresh Kumar, ID: 17)
    const supervisor = await Employee.findOne({ id: 17 });
    if (!supervisor) {
      console.log('❌ Supervisor with ID 17 not found');
      return;
    }

    console.log('👨‍💼 Supervisor Employee record:');
    console.log('  - ID:', supervisor.id);
    console.log('  - Name:', supervisor.fullName);
    console.log('  - Phone:', supervisor.phone || 'N/A');
    console.log('  - User ID:', supervisor.userId);
    console.log('  - Job Title:', supervisor.jobTitle);
    console.log('  - Employee object keys:', Object.keys(supervisor.toObject()));

    // Check if supervisor has a user account
    if (supervisor.userId) {
      const user = await User.findOne({ id: supervisor.userId });
      if (user) {
        console.log('\n👤 Supervisor User record:');
        console.log('  - ID:', user.id);
        console.log('  - Email:', user.email);
        console.log('  - Active:', user.isActive);
      } else {
        console.log('\n❌ No user record found for supervisor userId:', supervisor.userId);
      }
    } else {
      console.log('\n⚠️ Supervisor has no userId assigned');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the check
checkSupervisorEmail();