import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';
import Company from './src/modules/company/Company.js';
import Role from './src/modules/role/Role.js';
import Project from './src/modules/project/models/Project.js';
import Employee from './src/modules/employee/Employee.js';

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

const checkWorkerGmailProjectMapping = async () => {
  await connectDB();

  try {
    console.log('\n🔍 CHECKING WORKER@GMAIL.COM PROJECT MAPPING\n');

    // 1. Find the worker@gmail.com user
    const workerUser = await User.findOne({ email: 'worker@gmail.com' });
    if (!workerUser) {
      console.log('❌ worker@gmail.com user not found');
      return;
    }

    console.log('1. Worker user found:', {
      id: workerUser.id,
      email: workerUser.email,
      isActive: workerUser.isActive
    });

    // 2. Check CompanyUser mapping
    const companyMapping = await CompanyUser.findOne({ 
      userId: workerUser.id, 
      isActive: true 
    });

    if (!companyMapping) {
      console.log('❌ No company mapping found for worker@gmail.com');
      
      // Let's create one
      console.log('\n2. Creating company mapping for worker@gmail.com...');
      
      // Find a company and worker role
      const company = await Company.findOne({ isActive: true });
      const workerRole = await Role.findOne({ name: { $regex: /worker/i } });
      
      if (!company || !workerRole) {
        console.log('❌ Cannot create mapping - missing company or role');
        return;
      }
      
      // Get next ID
      const lastCompanyUser = await CompanyUser.findOne({}, {}, { sort: { id: -1 } });
      const nextId = lastCompanyUser ? lastCompanyUser.id + 1 : 1;
      
      const newMapping = new CompanyUser({
        id: nextId,
        userId: workerUser.id,
        companyId: company.id,
        roleId: workerRole.id,
        isActive: true
      });
      
      await newMapping.save();
      console.log('✅ Created company mapping:', {
        userId: workerUser.id,
        companyId: company.id,
        roleId: workerRole.id,
        role: workerRole.name
      });
      
      // Update companyMapping for further checks
      companyMapping = newMapping;
    } else {
      console.log('✅ Company mapping found:', {
        userId: companyMapping.userId,
        companyId: companyMapping.companyId,
        roleId: companyMapping.roleId,
        isActive: companyMapping.isActive
      });
    }

    // 3. Get company and role details
    const company = await Company.findOne({ id: companyMapping.companyId });
    const role = await Role.findOne({ id: companyMapping.roleId });

    console.log('\n3. Company and role details:', {
      company: company ? { id: company.id, name: company.name } : 'Not found',
      role: role ? { id: role.id, name: role.name } : 'Not found'
    });

    // 4. Check Employee record (for currentProject)
    const employee = await Employee.findOne({ userId: workerUser.id });
    console.log('\n4. Employee record:', {
      found: !!employee,
      employeeId: employee?.id,
      currentProject: employee?.currentProject
    });

    // 5. Check what projects are available for this company
    const availableProjects = await Project.find({ 
      companyId: companyMapping.companyId 
    }).select('id projectName projectCode geofence latitude longitude geofenceRadius');

    console.log(`\n5. Available projects for company ${companyMapping.companyId}:`);
    if (availableProjects.length === 0) {
      console.log('❌ No projects found for this company');
    } else {
      availableProjects.forEach(project => {
        console.log(`   - ID: ${project.id}, Name: ${project.projectName}, Code: ${project.projectCode}`);
        console.log(`     Geofence: ${project.geofence ? 'Yes' : 'Legacy'} (${project.latitude}, ${project.longitude}) radius: ${project.geofenceRadius || project.geofence?.radius}m`);
      });
    }

    // 6. Test the validate-location API call simulation
    console.log('\n6. Simulating validate-location API calls:');
    
    const testProjectIds = [1, 2, ...availableProjects.map(p => p.id).filter(Boolean)];
    
    for (const projectId of testProjectIds) {
      const project = await Project.findOne({ 
        id: projectId, 
        companyId: companyMapping.companyId 
      });
      
      if (project) {
        console.log(`   ✅ Project ${projectId}: Available - ${project.projectName}`);
        console.log(`      Geofence center: (${project.geofence?.center?.latitude || project.latitude}, ${project.geofence?.center?.longitude || project.longitude})`);
        console.log(`      Radius: ${project.geofence?.radius || project.geofenceRadius}m`);
      } else {
        console.log(`   ❌ Project ${projectId}: Not available for this company`);
        
        // Check if it exists for other companies
        const otherProject = await Project.findOne({ id: projectId });
        if (otherProject) {
          console.log(`      (Exists for company ${otherProject.companyId})`);
        }
      }
    }

    // 7. Create a proper project assignment if needed
    if (employee && !employee.currentProject) {
      console.log('\n7. Employee has no current project assigned');
      
      if (availableProjects.length > 0) {
        const assignProject = availableProjects[0];
        console.log(`   Assigning project ${assignProject.id} (${assignProject.projectName}) to employee`);
        
        await Employee.updateOne(
          { userId: workerUser.id },
          { 
            currentProject: {
              id: assignProject.id,
              name: assignProject.projectName,
              code: assignProject.projectCode
            }
          }
        );
        
        console.log('✅ Project assigned to employee');
      }
    } else if (employee?.currentProject) {
      console.log('\n7. Employee current project:', employee.currentProject);
      
      // Verify the assigned project exists for the company
      const assignedProject = await Project.findOne({
        id: employee.currentProject.id,
        companyId: companyMapping.companyId
      });
      
      if (assignedProject) {
        console.log('✅ Assigned project is valid for user\'s company');
      } else {
        console.log('❌ Assigned project is not valid for user\'s company');
      }
    }

    // 8. Summary for mobile app usage
    console.log('\n8. SUMMARY FOR MOBILE APP:');
    console.log(`   User: ${workerUser.email}`);
    console.log(`   Company ID: ${companyMapping.companyId}`);
    console.log(`   Role: ${role?.name}`);
    console.log(`   Available Projects: ${availableProjects.map(p => p.id).join(', ')}`);
    console.log(`   Recommended Project ID: ${availableProjects[0]?.id || 1}`);

  } catch (error) {
    console.error('❌ Check error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
};

checkWorkerGmailProjectMapping();