import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
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

// Get next available ID for a collection
const getNextId = async (Model) => {
  const lastRecord = await Model.findOne().sort({ id: -1 });
  const nextId = lastRecord ? lastRecord.id + 1 : 1;
  
  // Double-check that this ID doesn't exist
  const existing = await Model.findOne({ id: nextId });
  if (existing) {
    // If it exists, find the highest ID and add 1
    const allRecords = await Model.find({}, { id: 1 }).sort({ id: -1 }).limit(10);
    const maxId = Math.max(...allRecords.map(r => r.id), 0);
    return maxId + 1;
  }
  
  return nextId;
};

const createSupervisorUser = async () => {
  try {
    console.log('🔍 Creating supervisor user for testing...\n');

    // Ensure supervisor role exists
    let supervisorRole = await Role.findOne({ name: 'Supervisor' });
    if (!supervisorRole) {
      const roleId = await getNextId(Role);
      supervisorRole = new Role({
        id: roleId,
        name: 'Supervisor',
        level: 3,
        isSystemRole: true
      });
      await supervisorRole.save();
      console.log('✅ Created Supervisor role');
    }

    // Check if supervisor user already exists
    const existingUser = await User.findOne({ email: 'supervisor@company.com' });
    if (existingUser) {
      console.log('⚠️ Supervisor user already exists');
      console.log(`   User ID: ${existingUser.id}, Email: ${existingUser.email}`);
      
      // Update the company user role to supervisor if needed
      const companyUser = await CompanyUser.findOne({ userId: existingUser.id });
      if (companyUser && companyUser.roleId !== supervisorRole.id) {
        companyUser.roleId = supervisorRole.id;
        await companyUser.save();
        console.log('✅ Updated user role to supervisor');
      }
      
      return existingUser;
    }

    // Create a supervisor user
    const userId = await getNextId(User);
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const supervisorUser = new User({
      id: userId,
      email: 'supervisor@company.com',
      passwordHash: hashedPassword,
      isActive: true
    });

    await supervisorUser.save();
    console.log(`✅ Created supervisor user with ID: ${userId}`);
    console.log(`   Email: supervisor@company.com`);
    console.log(`   Password: password123`);

    // Create company user relationship with supervisor role
    const companyUserId = await getNextId(CompanyUser);
    const companyUser = new CompanyUser({
      id: companyUserId,
      userId: userId,
      companyId: 1,
      roleId: supervisorRole.id,
      isActive: true,
      createdAt: new Date()
    });

    await companyUser.save();
    console.log(`✅ Created company user relationship with supervisor role`);

    // Create an employee record for the supervisor
    const employeeId = await getNextId(Employee);
    const supervisorEmployee = new Employee({
      id: employeeId,
      userId: userId,
      fullName: 'John Supervisor',
      employeeCode: `SUP${employeeId.toString().padStart(3, '0')}`,
      companyId: 1,
      isActive: true,
      createdAt: new Date()
    });

    await supervisorEmployee.save();
    console.log(`✅ Created employee record for supervisor: ${supervisorEmployee.fullName}`);

    console.log('\n🎉 Supervisor user setup complete!');
    console.log('📋 Login credentials:');
    console.log('   Email: supervisor@company.com');
    console.log('   Password: password123');
    console.log('   Role: Supervisor');

    return supervisorUser;

  } catch (error) {
    console.error('❌ Error creating supervisor user:', error);
    throw error;
  }
};

// Test the supervisor login and notification access
const testSupervisorAccess = async () => {
  try {
    console.log('\n🧪 Testing supervisor notification access...');
    
    // Import fetch for testing
    const fetch = (await import('node-fetch')).default;
    const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5002';

    // Test login
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'supervisor@company.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();

    if (!loginData.success) {
      console.error('❌ Supervisor login failed:', loginData.message);
      return;
    }

    console.log('✅ Supervisor login successful');
    console.log('User role:', loginData.user.role);

    // Test notification overview endpoint
    const token = loginData.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const overviewResponse = await fetch(`${API_BASE_URL}/api/supervisor/notifications/overview`, { headers });
    const overviewData = await overviewResponse.json();

    if (overviewResponse.ok) {
      console.log('✅ Supervisor notification overview successful!');
      console.log('Response summary:', {
        success: overviewData.success,
        totalNotifications: overviewData.overview?.totalNotifications || 0,
        projects: overviewData.projects?.length || 0
      });
    } else {
      console.error('❌ Supervisor notification overview failed');
      console.error('Status:', overviewResponse.status);
      console.error('Error:', overviewData);
    }

  } catch (error) {
    console.error('❌ Error testing supervisor access:', error.message);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await createSupervisorUser();
  
  // Wait a moment for the server to be ready, then test
  console.log('\n⏳ Waiting 2 seconds before testing...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testSupervisorAccess();
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script execution error:', error);
  process.exit(1);
});