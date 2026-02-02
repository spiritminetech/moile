import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/modules/project/models/Project.js';
import User from './src/modules/user/User.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';
import Company from './src/modules/company/Company.js';

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

const fixProjectCompanyAssignment = async () => {
  await connectDB();

  try {
    console.log('\n🔧 FIXING PROJECT-COMPANY ASSIGNMENT ISSUE\n');

    // 1. Find the user that's having issues (likely the one being used in mobile app)
    const testUser = await User.findOne({ email: { $regex: 'gmail' } });
    const companyMapping = await CompanyUser.findOne({ userId: testUser.id, isActive: true });
    
    console.log('1. User details:', {
      email: testUser.email,
      userId: testUser.id,
      companyId: companyMapping?.companyId
    });

    if (!companyMapping) {
      console.log('❌ User has no company mapping');
      return;
    }

    const userCompanyId = companyMapping.companyId;

    // 2. Check if there are any projects for this company
    const existingProjects = await Project.find({ companyId: userCompanyId });
    console.log(`\n2. Existing projects for company ${userCompanyId}:`, existingProjects.length);

    if (existingProjects.length === 0) {
      console.log('❌ No projects found for user\'s company. Creating a test project...');
      
      // Get next project ID
      const lastProject = await Project.findOne({}, {}, { sort: { id: -1 } });
      const nextProjectId = lastProject ? Math.max(lastProject.id || 0, 1013) + 1 : 1014;
      
      // Create a test project for the user's company
      const testProject = new Project({
        id: nextProjectId,
        companyId: userCompanyId,
        projectCode: `TEST-${nextProjectId}`,
        projectName: 'Mobile App Test Project',
        description: 'Test project for mobile app attendance validation',
        jobNature: 'Construction',
        jobSubtype: 'General',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        budgetLabor: 50000,
        budgetMaterials: 30000,
        // Add geofence data for testing
        latitude: 1.3521, // Singapore coordinates
        longitude: 103.8198,
        geofenceRadius: 100,
        geofence: {
          center: {
            latitude: 1.3521,
            longitude: 103.8198
          },
          radius: 100,
          strictMode: false, // Make it less strict for testing
          allowedVariance: 20
        }
      });

      await testProject.save();
      console.log('✅ Created test project:', {
        id: testProject.id,
        companyId: testProject.companyId,
        name: testProject.projectName,
        geofence: testProject.geofence
      });
    } else {
      console.log('✅ Projects already exist for user\'s company:', 
        existingProjects.map(p => ({ id: p.id, name: p.projectName }))
      );
    }

    // 3. Also create a project with ID 1 for the fallback case
    const project1 = await Project.findOne({ id: 1 });
    if (!project1) {
      console.log('\n3. Creating fallback project with ID 1...');
      
      const fallbackProject = new Project({
        id: 1,
        companyId: userCompanyId, // Assign to user's company
        projectCode: 'FALLBACK-001',
        projectName: 'Default Mobile App Project',
        description: 'Default project for mobile app when no specific project is assigned',
        jobNature: 'General',
        jobSubtype: 'Mobile Testing',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        budgetLabor: 100000,
        budgetMaterials: 50000,
        // Add geofence data
        latitude: 1.3521, // Singapore coordinates
        longitude: 103.8198,
        geofenceRadius: 150,
        geofence: {
          center: {
            latitude: 1.3521,
            longitude: 103.8198
          },
          radius: 150,
          strictMode: false, // Make it less strict for testing
          allowedVariance: 30
        }
      });

      await fallbackProject.save();
      console.log('✅ Created fallback project with ID 1:', {
        id: fallbackProject.id,
        companyId: fallbackProject.companyId,
        name: fallbackProject.projectName
      });
    } else {
      console.log('\n3. Project with ID 1 already exists:', {
        id: project1.id,
        companyId: project1.companyId,
        name: project1.projectName
      });
      
      // If project 1 exists but belongs to different company, update it
      if (project1.companyId !== userCompanyId) {
        console.log(`   Updating project 1 to belong to company ${userCompanyId}...`);
        await Project.updateOne(
          { id: 1 },
          { companyId: userCompanyId }
        );
        console.log('✅ Updated project 1 company assignment');
      }
    }

    // 4. Verify the fix
    console.log('\n4. Verifying the fix...');
    const testProjectIds = [1, 2];
    
    for (const projectId of testProjectIds) {
      const project = await Project.findOne({ id: projectId, companyId: userCompanyId });
      if (project) {
        console.log(`✅ Project ${projectId} now accessible for company ${userCompanyId}: ${project.projectName}`);
      } else {
        console.log(`❌ Project ${projectId} still not accessible for company ${userCompanyId}`);
      }
    }

    // 5. Show all projects for the user's company
    const allUserProjects = await Project.find({ companyId: userCompanyId });
    console.log(`\n5. All projects now available for company ${userCompanyId}:`);
    allUserProjects.forEach(project => {
      console.log(`   - ID: ${project.id}, Name: ${project.projectName}, Geofence: ${project.geofence ? 'Yes' : 'No'}`);
    });

  } catch (error) {
    console.error('❌ Fix error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
};

fixProjectCompanyAssignment();