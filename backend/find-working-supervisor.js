import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function findWorkingSupervisor() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Find all supervisors with projects
    console.log('🔍 Finding supervisors with projects...\n');
    
    const supervisors = await db.collection('supervisors').find({}).toArray();
    console.log(`Found ${supervisors.length} supervisor records\n`);

    for (const supervisor of supervisors) {
      const projects = await db.collection('projects').find({ 
        supervisorId: supervisor.id 
      }).toArray();

      if (projects.length > 0) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`✅ Supervisor ID: ${supervisor.id} (${projects.length} projects)`);
        console.log('═══════════════════════════════════════════════════════════');
        
        // Find user
        const user = await db.collection('users').findOne({ id: supervisor.userId });
        
        if (user) {
          console.log(`\n📧 Email: ${user.email}`);
          console.log(`   User ID: ${user.id}`);
          console.log(`   Active: ${user.isActive}`);
          
          // Test password
          if (user.passwordHash) {
            const passwords = ['password123', 'Password123', 'admin123', 'supervisor123'];
            for (const pwd of passwords) {
              const isValid = await bcrypt.compare(pwd, user.passwordHash);
              if (isValid) {
                console.log(`   ✅ Password: ${pwd}`);
                break;
              }
            }
          }
        } else {
          console.log(`\n⚠️ No user found for supervisor`);
        }

        // Find employee
        const employee = await db.collection('employees').findOne({ id: supervisor.employeeId });
        if (employee) {
          console.log(`\n👤 Employee: ${employee.fullName} (${employee.employeeCode})`);
        }

        console.log(`\n📍 Projects:`);
        projects.forEach(p => {
          console.log(`   - Project ${p.id}: ${p.projectName} (${p.location || 'N/A'})`);
        });

        // Check for task assignments
        const assignments = await db.collection('workertaskassignments').countDocuments({
          projectId: { $in: projects.map(p => p.id) }
        });
        console.log(`\n📋 Task Assignments: ${assignments}`);

        console.log('\n');
      }
    }

    // If no supervisors with projects, show all supervisors
    const supervisorsWithProjects = await Promise.all(
      supervisors.map(async (s) => {
        const projectCount = await db.collection('projects').countDocuments({ supervisorId: s.id });
        return { ...s, projectCount };
      })
    );

    const withProjects = supervisorsWithProjects.filter(s => s.projectCount > 0);
    
    if (withProjects.length === 0) {
      console.log('⚠️ NO SUPERVISORS WITH PROJECTS FOUND!\n');
      console.log('All supervisors:');
      supervisorsWithProjects.forEach(s => {
        console.log(`   - Supervisor ID ${s.id}: ${s.projectCount} projects`);
      });
      
      console.log('\n💡 You need to assign projects to a supervisor first!');
    }

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

findWorkingSupervisor();
