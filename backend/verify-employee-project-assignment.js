import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import Project from './src/modules/project/models/Project.js';

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

const verifyEmployeeProjectAssignment = async () => {
  await connectDB();

  try {
    console.log('\n🔍 VERIFYING EMPLOYEE PROJECT ASSIGNMENT\n');

    // 1. Find worker@gmail.com user
    const user = await User.findOne({ email: 'worker@gmail.com' });
    console.log('1. User found:', { id: user.id, email: user.email });

    // 2. Find employee record
    const employee = await Employee.findOne({ userId: user.id });
    console.log('\n2. Employee record:', {
      found: !!employee,
      id: employee?.id,
      userId: employee?.userId,
      currentProject: employee?.currentProject
    });

    if (!employee) {
      console.log('❌ No employee record found');
      return;
    }

    // 3. If no currentProject, assign one
    if (!employee.currentProject) {
      console.log('\n3. No currentProject assigned. Assigning project 1003...');
      
      // Get project 1003 details
      const project = await Project.findOne({ id: 1003 });
      if (!project) {
        console.log('❌ Project 1003 not found');
        return;
      }

      // Update employee with currentProject
      const updateResult = await Employee.updateOne(
        { userId: user.id },
        { 
          currentProject: {
            id: project.id,
            name: project.projectName,
            code: project.projectCode
          }
        }
      );

      console.log('Update result:', updateResult);

      // Verify the update
      const updatedEmployee = await Employee.findOne({ userId: user.id });
      console.log('✅ Updated employee currentProject:', updatedEmployee.currentProject);
    } else {
      console.log('\n3. Employee already has currentProject:', employee.currentProject);
    }

    // 4. Verify the project exists and belongs to the right company
    if (employee.currentProject || employee.currentProject?.id) {
      const projectId = employee.currentProject.id;
      const project = await Project.findOne({ id: projectId });
      
      if (project) {
        console.log('\n4. Assigned project details:', {
          id: project.id,
          name: project.projectName,
          companyId: project.companyId,
          hasGeofence: !!project.geofence
        });
      } else {
        console.log('\n4. ❌ Assigned project not found in database');
      }
    }

    // 5. Test the complete flow
    console.log('\n5. Testing complete auth flow simulation:');
    
    // Simulate what the auth service should return
    const finalEmployee = await Employee.findOne({ userId: user.id });
    const authResponse = {
      user: {
        id: user.id,
        email: user.email,
        currentProject: finalEmployee?.currentProject || null
      },
      employee: {
        id: finalEmployee?.id,
        currentProject: finalEmployee?.currentProject
      }
    };

    console.log('Auth response simulation:', authResponse);

    // Test project ID selection logic
    let projectId = null;
    if (authResponse.user?.currentProject?.id) {
      projectId = authResponse.user.currentProject.id.toString();
      console.log('✅ Would use project ID from user.currentProject:', projectId);
    } else {
      console.log('❌ Would fall back to company ID (wrong)');
    }

  } catch (error) {
    console.error('❌ Verification error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
};

verifyEmployeeProjectAssignment();