/**
 * Find which employee is associated with worker@gmail.com
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function findWorkerGmailEmployee() {
  try {
    console.log('🔍 Finding Employee for worker@gmail.com\n');
    console.log('=' .repeat(70));

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Check user
    console.log('1️⃣ Checking User Document...');
    const user = await db.collection('users').findOne({ email: 'worker@gmail.com' });
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Has employeeId:', !!user.employeeId);

    // Find employee by email
    console.log('\n2️⃣ Finding Employee by Email...');
    const employeeByEmail = await db.collection('employees').findOne({ email: 'worker@gmail.com' });
    
    if (employeeByEmail) {
      console.log('✅ Employee Found by Email:');
      console.log('   ID:', employeeByEmail.id);
      console.log('   Name:', employeeByEmail.fullName);
      console.log('   Job Title:', employeeByEmail.jobTitle);
      console.log('   Status:', employeeByEmail.status);
    } else {
      console.log('⚠️  No employee found with email worker@gmail.com');
    }

    // List all workers
    console.log('\n3️⃣ Listing All Worker Employees...');
    const workers = await db.collection('employees').find({
      jobTitle: { $regex: /worker|plumber|electrician|mason|carpenter/i },
      status: 'ACTIVE'
    }).limit(10).toArray();

    console.log(`   Found ${workers.length} worker(s):`);
    workers.forEach((w, idx) => {
      console.log(`   ${idx + 1}. ID: ${w.id}, Name: ${w.fullName}, Title: ${w.jobTitle}, Email: ${w.email || 'NOT SET'}`);
    });

    // Check which employees have task assignments
    console.log('\n4️⃣ Checking Task Assignments...');
    const today = new Date().toISOString().split('T')[0];
    
    for (const worker of workers.slice(0, 5)) {
      const assignments = await db.collection('workertaskassignments').find({
        employeeId: worker.id,
        date: today
      }).toArray();
      
      if (assignments.length > 0) {
        console.log(`   ✅ Employee ${worker.id} (${worker.fullName}): ${assignments.length} task(s) today`);
        
        if (assignments[0].supervisorId) {
          const supervisor = await db.collection('employees').findOne({ id: assignments[0].supervisorId });
          if (supervisor) {
            console.log(`      Supervisor: ${supervisor.fullName}`);
          }
        }
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(70));
    console.log('📊 RECOMMENDATION');
    console.log('=' .repeat(70));
    
    if (employeeByEmail) {
      console.log('✅ Link user to employee:');
      console.log(`   db.users.updateOne(`);
      console.log(`     { email: "worker@gmail.com" },`);
      console.log(`     { $set: { employeeId: ${employeeByEmail.id} } }`);
      console.log(`   )`);
    } else {
      console.log('💡 Options:');
      console.log('   1. Create employee with email worker@gmail.com');
      console.log('   2. Link user to existing employee');
      console.log('   3. Update existing employee email to worker@gmail.com');
      
      if (workers.length > 0) {
        console.log('\n   Suggested employee to link:');
        console.log(`   Employee ID: ${workers[0].id}`);
        console.log(`   Name: ${workers[0].fullName}`);
        console.log(`   Title: ${workers[0].jobTitle}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

findWorkerGmailEmployee();
