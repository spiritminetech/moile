import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';
import Employee from './src/modules/employee/Employee.js';
import Role from './src/modules/role/Role.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkAllUsers = async () => {
  try {
    console.log('🔍 Checking all users in the system...\n');

    // Get all users
    const users = await User.find({}, 'id email isActive').lean();
    console.log(`Found ${users.length} users:`);
    
    for (const user of users) {
      console.log(`\n👤 User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Active: ${user.isActive}`);
      
      // Get company user info
      const companyUser = await CompanyUser.findOne({ userId: user.id });
      if (companyUser) {
        console.log(`   Company ID: ${companyUser.companyId}`);
        console.log(`   Role ID: ${companyUser.roleId}`);
        
        // Get role name
        const role = await Role.findOne({ id: companyUser.roleId });
        if (role) {
          console.log(`   Role Name: ${role.name}`);
        }
        
        // Get employee info
        const employee = await Employee.findOne({ userId: user.id });
        if (employee) {
          console.log(`   Employee: ${employee.fullName} (${employee.employeeCode})`);
        }
      } else {
        console.log(`   ⚠️ No company association found`);
      }
    }

    // Check specifically for supervisor user
    console.log('\n🔍 Checking supervisor user specifically...');
    const supervisorUser = await User.findOne({ email: 'supervisor@company.com' });
    
    if (supervisorUser) {
      console.log('✅ Supervisor user found:');
      console.log(`   ID: ${supervisorUser.id}`);
      console.log(`   Email: ${supervisorUser.email}`);
      console.log(`   Active: ${supervisorUser.isActive}`);
      console.log(`   Password Hash: ${supervisorUser.passwordHash ? 'Present' : 'Missing'}`);
      
      // Test password verification
      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.default.compare('password123', supervisorUser.passwordHash);
      console.log(`   Password 'password123' valid: ${isValidPassword}`);
      
    } else {
      console.log('❌ Supervisor user not found');
    }

    // List all roles
    console.log('\n🔍 Available roles:');
    const roles = await Role.find({}, 'id name level').lean();
    roles.forEach(role => {
      console.log(`   ${role.id}: ${role.name} (Level ${role.level})`);
    });

  } catch (error) {
    console.error('❌ Error checking users:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await checkAllUsers();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script execution error:', error);
  process.exit(1);
});