import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';
import Company from './src/modules/company/Company.js';
import Role from './src/modules/role/Role.js';

dotenv.config();

async function debugSupervisorLogin() {
  try {
    console.log('🔍 Debugging Supervisor Login Issue...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = 'supervisor@gmail.com';
    const password = 'password123';

    // Step 1: Check if user exists
    console.log('1️⃣ Checking User...');
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      console.log('\n💡 Solution: Run the fix-user-password.js script or create the user');
      return;
    }
    
    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   isActive:', user.isActive);
    
    // Step 2: Check password
    console.log('\n2️⃣ Checking Password...');
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    console.log(`   Password '${password}':`, passwordMatch ? '✅ VALID' : '❌ INVALID');
    
    if (!passwordMatch) {
      console.log('\n💡 Solution: Run fix-user-password.js to reset the password');
      return;
    }
    
    // Step 3: Check CompanyUser mappings
    console.log('\n3️⃣ Checking Company Mappings...');
    const mappings = await CompanyUser.find({ userId: user.id });
    
    if (mappings.length === 0) {
      console.log('❌ No company mappings found for user');
      console.log('\n💡 Solution: Create a CompanyUser mapping for this user');
      return;
    }
    
    console.log(`✅ Found ${mappings.length} company mapping(s):`);
    
    for (const mapping of mappings) {
      console.log(`\n   Mapping ID: ${mapping.id}`);
      console.log(`   Company ID: ${mapping.companyId}`);
      console.log(`   Role ID: ${mapping.roleId}`);
      console.log(`   isActive: ${mapping.isActive}`);
      
      // Check if company exists
      const company = await Company.findOne({ id: mapping.companyId });
      if (company) {
        console.log(`   ✅ Company: ${company.name} (Active: ${company.isActive})`);
      } else {
        console.log(`   ❌ Company not found with ID: ${mapping.companyId}`);
      }
      
      // Check if role exists
      const role = await Role.findOne({ id: mapping.roleId });
      if (role) {
        console.log(`   ✅ Role: ${role.name}`);
      } else {
        console.log(`   ❌ Role not found with ID: ${mapping.roleId}`);
      }
    }
    
    // Step 4: Check active mappings
    console.log('\n4️⃣ Checking Active Mappings...');
    const activeMappings = await CompanyUser.find({
      userId: user.id,
      isActive: true
    });
    
    if (activeMappings.length === 0) {
      console.log('❌ No active company mappings found');
      console.log('\n💡 Solution: Set isActive: true on CompanyUser mapping');
      return;
    }
    
    console.log(`✅ Found ${activeMappings.length} active mapping(s)`);
    
    // Step 5: Verify complete login flow
    console.log('\n5️⃣ Verifying Complete Login Flow...');
    let hasValidMapping = false;
    
    for (const mapping of activeMappings) {
      const company = await Company.findOne({ id: mapping.companyId, isActive: true });
      const role = await Role.findOne({ id: mapping.roleId });
      
      if (company && role) {
        console.log(`✅ Valid mapping found:`);
        console.log(`   Company: ${company.name}`);
        console.log(`   Role: ${role.name}`);
        hasValidMapping = true;
      }
    }
    
    if (!hasValidMapping) {
      console.log('❌ No valid active company/role combination found');
      console.log('\n💡 Solution: Ensure company is active and role exists');
    } else {
      console.log('\n🎉 Login should work! If still failing, check:');
      console.log('   - Backend server is running');
      console.log('   - Frontend API URL is correct');
      console.log('   - Network requests are reaching the backend');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugSupervisorLogin();
