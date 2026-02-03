import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import Project from './src/modules/project/models/Project.js';

dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function checkAndCreateProjects() {
  await connectDB();
  
  try {
    console.log('🔍 Checking available projects...');
    
    // Check existing projects
    const existingProjects = await Project.find();
    console.log(`📊 Found ${existingProjects.length} existing projects:`);
    existingProjects.forEach(p => {
      console.log(`   - ${p.projectName} (ID: ${p.id}, Status: ${p.status})`);
    });
    
    // Check active projects
    const activeProjects = await Project.find({ status: 'Ongoing' });
    console.log(`\n✅ Active projects: ${activeProjects.length}`);
    
    if (activeProjects.length >= 2) {
      console.log('✅ Sufficient active projects available');
      return;
    }
    
    // Create additional projects if needed
    console.log('\n🏗️ Creating additional projects...');
    
    // Get next project ID
    const lastProject = await Project.findOne().sort({ id: -1 });
    let nextProjectId = lastProject ? lastProject.id + 1 : 2000;
    
    const newProjects = [
      {
        id: nextProjectId++,
        projectName: 'Employee 107 Test Project A',
        projectCode: 'EMP107-A',
        description: 'Test project A for employee 107 assignments',
        address: '123 Test Street, Singapore',
        companyId: 1,
        status: 'Ongoing', // Use valid enum value
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        budgetLabor: 50000,
        budgetMaterials: 30000,
        budgetTools: 10000,
        budgetTransport: 5000,
        budgetWarranty: 5000,
        latitude: 1.3521,
        longitude: 103.8198,
        geofenceRadius: 100,
        // Correct geofence format
        geofence: {
          center: {
            latitude: 1.3521,
            longitude: 103.8198
          },
          radius: 100,
          strictMode: true,
          allowedVariance: 10
        },
        projectManagerId: 1,
        supervisorId: 1,
        createdBy: 1
      },
      {
        id: nextProjectId++,
        projectName: 'Employee 107 Test Project B',
        projectCode: 'EMP107-B',
        description: 'Test project B for employee 107 assignments',
        address: '456 Test Avenue, Singapore',
        companyId: 1,
        status: 'Ongoing', // Use valid enum value
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        budgetLabor: 75000,
        budgetMaterials: 45000,
        budgetTools: 15000,
        budgetTransport: 7500,
        budgetWarranty: 7500,
        latitude: 1.3621,
        longitude: 103.8298,
        geofenceRadius: 150,
        // Correct geofence format
        geofence: {
          center: {
            latitude: 1.3621,
            longitude: 103.8298
          },
          radius: 150,
          strictMode: true,
          allowedVariance: 15
        },
        projectManagerId: 1,
        supervisorId: 1,
        createdBy: 1
      }
    ];
    
    // Insert new projects
    await Project.insertMany(newProjects);
    console.log(`✅ Created ${newProjects.length} new projects`);
    
    // Verify total active projects
    const totalActiveProjects = await Project.find({ status: 'Ongoing' });
    console.log(`\n📊 Total active projects now: ${totalActiveProjects.length}`);
    totalActiveProjects.forEach(p => {
      console.log(`   - ${p.projectName} (ID: ${p.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAndCreateProjects();