/**
 * Check all employees in database
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

async function checkEmployees() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all employees
    const employees = await Employee.find({}).sort({ id: 1 });
    console.log(`📋 Total Employees: ${employees.length}\n`);

    // Group by role
    const byRole = {};
    employees.forEach(emp => {
      const role = emp.role || 'unknown';
      if (!byRole[role]) byRole[role] = [];
      byRole[role].push(emp);
    });

    Object.keys(byRole).forEach(role => {
      console.log(`\n${role.toUpperCase()}S (${byRole[role].length}):`);
      byRole[role].forEach(emp => {
        console.log(`   ID: ${emp.id}, Name: ${emp.fullName}, Email: ${emp.email}, Project: ${emp.currentProjectId || 'none'}`);
      });
    });

    // Find supervisor specifically
    console.log('\n\n🔍 Searching for supervisor@gmail.com...');
    const supervisor = await Employee.findOne({ email: 'supervisor@gmail.com' });
    if (supervisor) {
      console.log('✅ Found:', JSON.stringify(supervisor.toObject(), null, 2));
    } else {
      console.log('❌ NOT FOUND');
      
      // Try finding by role
      const supervisors = await Employee.find({ role: 'supervisor' });
      console.log(`\nFound ${supervisors.length} employees with role='supervisor':`);
      supervisors.forEach(s => {
        console.log(`   ID: ${s.id}, Name: ${s.fullName}, Email: ${s.email}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkEmployees();
