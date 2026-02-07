/**
 * Find supervisor by looking up User -> Employee relationship
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

async function findSupervisor() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');

    // Find user
    const user = await User.findOne({ email: 'supervisor@gmail.com' });
    console.log('👤 User:', user ? {
      id: user.id,
      email: user.email,
      role: user.role
    } : 'NOT FOUND');

    if (user) {
      // Find employee linked to this user
      const employee = await Employee.findOne({ userId: user.id });
      console.log('\n📋 Employee:', employee ? {
        id: employee.id,
        fullName: employee.fullName,
        userId: employee.userId,
        companyId: employee.companyId
      } : 'NOT FOUND');

      if (employee) {
        // Find projects assigned to this supervisor
        const projects = await Project.find({ supervisorId: employee.id });
        console.log(`\n📍 Projects (${projects.length}):`);
        projects.forEach(p => {
          console.log(`   - Project ${p.id}: ${p.name}`);
          console.log(`     Supervisor ID: ${p.supervisorId}`);
        });

        // Check if projects exist at all
        const allProjects = await Project.find({ id: { $in: [1, 2] } });
        console.log(`\n📍 Projects 1 and 2 in database (${allProjects.length}):`);
        allProjects.forEach(p => {
          console.log(`   - Project ${p.id}: ${p.name}`);
          console.log(`     Supervisor ID: ${p.supervisorId}`);
        });
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

findSupervisor();
