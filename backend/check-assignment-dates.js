/**
 * Check what dates exist in WorkerTaskAssignment
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function checkDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');

    const assignments = await WorkerTaskAssignment.find({ projectId: { $in: [1, 2] } }).limit(10);
    
    console.log(`📋 Found ${assignments.length} assignments for projects 1 and 2:\n`);
    
    assignments.forEach(a => {
      console.log(`ID: ${a.id}, Employee: ${a.employeeId}, Project: ${a.projectId}, Date: ${a.date}, Status: ${a.status}`);
    });
    
    console.log(`\n📅 Today's date (YYYY-MM-DD): ${new Date().toISOString().split('T')[0]}`);

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDates();
