import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/modules/project/models/Project.js';
import User from './src/modules/user/User.js';
import jwt from 'jsonwebtoken';

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

const debugProjectNotFound = async () => {
  await connectDB();

  try {
    console.log('\n🔍 DEBUGGING PROJECT NOT FOUND ERROR\n');

    // 1. Check all projects in database
    console.log('1. All projects in database:');
    const allProjects = await Project.find({}).select('id companyId projectName projectCode');
    console.log('Total projects:', allProjects.length);
    allProjects.forEach(project => {
      console.log(`  - Project ID: ${project.id}, Company ID: ${project.companyId}, Name: ${project.projectName}`);
    });

    // 2. Check all users and their company assignments
    console.log('\n2. All users and their companies:');
    const allUsers = await User.find({}).select('id email companyId currentProject');
    console.log('Total users:', allUsers.length);
    allUsers.forEach(user => {
      console.log(`  - User: ${user.email}, Company ID: ${user.companyId}, Current Project: ${user.currentProject?.id || 'None'}`);
    });

    // 3. Try to find a specific project that might be causing issues
    console.log('\n3. Looking for project with ID 1:');
    const project1 = await Project.findOne({ id: 1 });
    if (project1) {
      console.log('✅ Project 1 found:', {
        id: project1.id,
        companyId: project1.companyId,
        projectName: project1.projectName,
        hasGeofence: !!project1.geofence,
        latitude: project1.latitude,
        longitude: project1.longitude,
        geofenceRadius: project1.geofenceRadius
      });
    } else {
      console.log('❌ Project 1 not found');
    }

    // 4. Check for common project-company mismatches
    console.log('\n4. Checking for project-company mismatches:');
    for (const user of allUsers) {
      if (user.currentProject?.id) {
        const userProject = await Project.findOne({ 
          id: user.currentProject.id, 
          companyId: user.companyId 
        });
        if (!userProject) {
          console.log(`❌ MISMATCH: User ${user.email} (company ${user.companyId}) assigned to project ${user.currentProject.id} but project not found for their company`);
          
          // Check if project exists for different company
          const projectDifferentCompany = await Project.findOne({ id: user.currentProject.id });
          if (projectDifferentCompany) {
            console.log(`   Project ${user.currentProject.id} exists but belongs to company ${projectDifferentCompany.companyId}`);
          }
        } else {
          console.log(`✅ User ${user.email} correctly assigned to project ${user.currentProject.id}`);
        }
      }
    }

    // 5. Simulate the exact query that's failing
    console.log('\n5. Simulating the failing API call:');
    
    // Get a test user (assuming the one having issues)
    const testUser = allUsers.find(u => u.email.includes('gmail') || u.email.includes('test'));
    if (testUser) {
      console.log(`Testing with user: ${testUser.email} (company: ${testUser.companyId})`);
      
      // Try different project IDs
      const testProjectIds = [1, 2, testUser.currentProject?.id].filter(Boolean);
      
      for (const projectId of testProjectIds) {
        console.log(`\n  Testing projectId: ${projectId}`);
        const project = await Project.findOne({ id: projectId, companyId: testUser.companyId });
        if (project) {
          console.log(`  ✅ Project found: ${project.projectName}`);
        } else {
          console.log(`  ❌ Project not found for user's company`);
          
          // Check if project exists for any company
          const anyProject = await Project.findOne({ id: projectId });
          if (anyProject) {
            console.log(`     Project exists but belongs to company ${anyProject.companyId}, user is in company ${testUser.companyId}`);
          } else {
            console.log(`     Project ${projectId} doesn't exist at all`);
          }
        }
      }
    }

    // 6. Check JWT token structure (if we have one)
    console.log('\n6. JWT Token Analysis:');
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    // Create a sample token to see structure
    if (testUser) {
      const sampleToken = jwt.sign(
        { 
          id: testUser.id, 
          email: testUser.email, 
          companyId: testUser.companyId 
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const decoded = jwt.verify(sampleToken, process.env.JWT_SECRET);
      console.log('Sample token payload:', decoded);
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
};

debugProjectNotFound();