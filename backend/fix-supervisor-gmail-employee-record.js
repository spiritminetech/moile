import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const Employee = (await import('./src/modules/employee/Employee.js')).default;
const User = (await import('./src/modules/user/User.js')).default;
const CompanyUser = (await import('./src/modules/companyUser/CompanyUser.js')).default;
const Project = (await import('./src/modules/project/models/Project.js')).default;

async function fixSupervisorEmployee() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to MongoDB\n');

    // Find the supervisor user
    const user = await User.findOne({ email: 'supervisor@gmail.com' });
    if (!user) {
      console.error('❌ User supervisor@gmail.com not found');
      return;
    }

    console.log('Found user:', {
      id: user.id,
      email: user.email
    });

    // Check if employee record exists
    let employee = await Employee.findOne({ userId: user.id });
    
    if (employee) {
      console.log('✅ Employee record already exists:', {
        id: employee.id,
        fullName: employee.fullName,
        userId: employee.userId
      });
    } else {
      console.log('⚠️ No employee record found, creating one...');
      
      // Get the next employee ID
      const lastEmployee = await Employee.findOne().sort({ id: -1 });
      const nextId = lastEmployee ? lastEmployee.id + 1 : 1;
      
      // Create employee record
      employee = new Employee({
        id: nextId,
        userId: user.id,
        fullName: 'Supervisor Gmail',
        email: 'supervisor@gmail.com',
        phone: '+65 9000 0000',
        role: 'supervisor',
        companyId: 1,
        isActive: true,
        createdAt: new Date()
      });
      
      await employee.save();
      console.log('✅ Created employee record:', {
        id: employee.id,
        fullName: employee.fullName,
        userId: employee.userId
      });
    }

    // Check if any projects are assigned to this supervisor
    const projects = await Project.find({ supervisorId: employee.id });
    console.log(`\n📋 Projects assigned to supervisor ${employee.id}:`, projects.length);
    
    if (projects.length === 0) {
      console.log('\n⚠️ No projects assigned to this supervisor');
      console.log('Checking all projects...');
      
      const allProjects = await Project.find();
      console.log(`\nTotal projects in database: ${allProjects.length}`);
      
      if (allProjects.length > 0) {
        console.log('\nAssigning first project to supervisor...');
        const firstProject = allProjects[0];
        firstProject.supervisorId = employee.id;
        await firstProject.save();
        
        console.log('✅ Assigned project:', {
          projectId: firstProject.id,
          projectName: firstProject.projectName || firstProject.name,
          supervisorId: employee.id
        });
      }
    } else {
      projects.forEach(project => {
        console.log(`  - ${project.projectName || project.name} (ID: ${project.id})`);
      });
    }

    console.log('\n✅ Fix complete!');
    console.log('\nYou can now login with:');
    console.log('  Email: supervisor@gmail.com');
    console.log('  Password: password123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixSupervisorEmployee();
