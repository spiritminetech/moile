import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from './src/modules/user/User.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';
import Company from './src/modules/company/Company.js';
import Role from './src/modules/role/Role.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const debugJWTStructure = async () => {
  await connectDB();

  try {
    console.log('\n🔍 DEBUGGING JWT TOKEN STRUCTURE\n');

    // 1. Find a user to test with
    const testUser = await User.findOne({ email: { $regex: 'gmail' } });
    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }

    console.log('1. Test user found:', {
      id: testUser.id,
      email: testUser.email
    });

    // 2. Check if user has company mappings
    const companyMappings = await CompanyUser.find({ userId: testUser.id, isActive: true });
    console.log('\n2. Company mappings for user:', companyMappings.length);
    
    if (companyMappings.length === 0) {
      console.log('❌ User has no company mappings - this is the problem!');
      
      // Let's create a company mapping for this user
      console.log('\n3. Creating company mapping...');
      
      // Find an existing company
      const company = await Company.findOne({ isActive: true });
      if (!company) {
        console.log('❌ No active company found');
        return;
      }
      
      // Find a worker role
      const workerRole = await Role.findOne({ name: { $regex: /worker/i } });
      if (!workerRole) {
        console.log('❌ No worker role found');
        return;
      }
      
      // Get next ID for CompanyUser
      const lastCompanyUser = await CompanyUser.findOne({}, {}, { sort: { id: -1 } });
      const nextId = lastCompanyUser ? lastCompanyUser.id + 1 : 1;
      
      const newCompanyUser = new CompanyUser({
        id: nextId,
        userId: testUser.id,
        companyId: company.id,
        roleId: workerRole.id,
        isActive: true
      });
      
      await newCompanyUser.save();
      console.log('✅ Created company mapping:', {
        userId: testUser.id,
        companyId: company.id,
        roleId: workerRole.id
      });
      
      // Update companyMappings for token creation
      companyMappings.push(newCompanyUser);
    }

    // 3. Create a JWT token like the auth service does
    const mapping = companyMappings[0];
    const company = await Company.findOne({ id: mapping.companyId });
    const role = await Role.findOne({ id: mapping.roleId });

    console.log('\n4. Token creation data:', {
      userId: testUser.id,
      companyId: company.id,
      roleId: role.id,
      role: role.name,
      email: testUser.email
    });

    const tokenPayload = {
      userId: testUser.id,
      companyId: company.id,
      roleId: role.id,
      role: role.name,
      email: testUser.email,
      permissions: []
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '8h' });
    console.log('\n5. Generated token:', token.substring(0, 50) + '...');

    // 4. Decode the token to see its structure
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('\n6. Decoded token payload:', decoded);

    // 5. Test the auth middleware logic
    console.log('\n7. Testing auth middleware logic:');
    console.log('decoded.userId:', decoded.userId);
    console.log('decoded.companyId:', decoded.companyId);
    console.log('decoded.role:', decoded.role);
    console.log('decoded.email:', decoded.email);

    // 6. Simulate the req.user object that should be created
    const reqUser = {
      userId: decoded.userId,
      companyId: decoded.companyId,
      role: decoded.role,
      email: decoded.email,
      name: testUser.name
    };

    console.log('\n8. req.user object that should be created:', reqUser);

    // 7. Test the project query that's failing
    console.log('\n9. Testing project queries:');
    const Project = (await import('./src/modules/project/models/Project.js')).default;
    
    // Test with different project IDs
    const testProjectIds = [1, 2, 1001, 1002, 1003];
    
    for (const projectId of testProjectIds) {
      const project = await Project.findOne({ id: projectId, companyId: decoded.companyId });
      if (project) {
        console.log(`✅ Project ${projectId} found for company ${decoded.companyId}: ${project.projectName}`);
      } else {
        console.log(`❌ Project ${projectId} not found for company ${decoded.companyId}`);
        
        // Check if project exists for any company
        const anyProject = await Project.findOne({ id: projectId });
        if (anyProject) {
          console.log(`   Project ${projectId} exists but belongs to company ${anyProject.companyId}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
};

debugJWTStructure();