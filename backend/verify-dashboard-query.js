import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import MaterialRequest from './src/modules/project/models/MaterialRequest.js';

dotenv.config();

async function verifyDashboardQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find supervisor 4 (the one being used)
    const supervisor = await Employee.findOne({ id: 4 }).lean();
    
    console.log('\n📋 Supervisor:', supervisor.fullName, '(ID:', supervisor.id, ')');

    // Get supervisor's projects
    const projects = await Project.find({ supervisorId: supervisor.id }).lean();
    const projectIds = projects.map(p => p.id);
    
    console.log('\n📁 Supervisor Projects:', projectIds);

    // Check the tool request that's showing up
    const allToolRequests = await MaterialRequest.find({ 
      requestType: 'TOOL',
      status: 'PENDING' 
    }).lean();

    console.log('\n🔧 All Pending Tool Requests:');
    allToolRequests.forEach(req => {
      const inSupervisorProjects = projectIds.includes(req.projectId);
      console.log(`  - Request ID: ${req.id}`);
      console.log(`    Project ID: ${req.projectId}`);
      console.log(`    In Supervisor Projects: ${inSupervisorProjects}`);
      console.log(`    Item: ${req.itemName}`);
      console.log(`    Status: ${req.status}`);
      console.log('');
    });

    // Count tool requests correctly
    const correctToolCount = await MaterialRequest.countDocuments({ 
      projectId: { $in: projectIds },
      requestType: 'TOOL',
      status: 'PENDING' 
    });

    console.log('✅ Correct Tool Request Count for this Supervisor:', correctToolCount);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

verifyDashboardQuery();
