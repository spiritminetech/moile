/**
 * Check worker@gmail.com with raw MongoDB query
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkWorkerGmailRaw() {
  try {
    console.log('🔍 Checking worker@gmail.com (Raw Query)\n');
    console.log('=' .repeat(70));

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Find user
    console.log('1️⃣ Finding User...');
    const user = await db.collection('users').findOne({ email: 'worker@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User Document:');
    console.log(JSON.stringify(user, null, 2));

    const employeeId = user.employeeId || user.employee_id;
    
    if (!employeeId) {
      console.log('\n❌ No employeeId found in user document');
      return;
    }

    // Find employee
    console.log('\n2️⃣ Finding Employee (ID: ' + employeeId + ')...');
    const employee = await db.collection('employees').findOne({ id: employeeId });
    
    if (!employee) {
      console.log('❌ Employee not found');
      return;
    }

    console.log('✅ Employee Document:');
    console.log(JSON.stringify(employee, null, 2));

    // Check today's assignments
    console.log('\n3️⃣ Checking Task Assignments...');
    const today = new Date().toISOString().split('T')[0];
    
    const assignments = await db.collection('workertaskassignments').find({
      employeeId: employeeId,
      date: today
    }).toArray();

    console.log('   Today\'s assignments:', assignments.length);

    if (assignments.length === 0) {
      // Check all assignments
      const allAssignments = await db.collection('workertaskassignments').find({
        employeeId: employeeId
      }).sort({ date: -1 }).limit(5).toArray();
      
      console.log('   Total assignments:', allAssignments.length);
      
      if (allAssignments.length > 0) {
        console.log('\n   Recent assignments:');
        allAssignments.forEach((a, idx) => {
          console.log(`   ${idx + 1}. Date: ${a.date}, SupervisorId: ${a.supervisorId || 'NOT SET'}`);
        });
      }
    } else {
      console.log('\n   Today\'s assignments:');
      assignments.forEach((a, idx) => {
        console.log(`   ${idx + 1}. Assignment ID: ${a.id}, SupervisorId: ${a.supervisorId || 'NOT SET'}`);
      });

      // Check supervisor
      if (assignments[0].supervisorId) {
        console.log('\n4️⃣ Checking Supervisor (ID: ' + assignments[0].supervisorId + ')...');
        const supervisor = await db.collection('employees').findOne({ id: assignments[0].supervisorId });
        
        if (supervisor) {
          console.log('✅ Supervisor Found:');
          console.log('   Name:', supervisor.fullName);
          console.log('   Phone:', supervisor.phone || 'N/A');
          console.log('   Email:', supervisor.email || 'N/A');
          console.log('   Status:', supervisor.status);
        } else {
          console.log('❌ Supervisor NOT FOUND');
        }
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(70));
    console.log('📊 SUMMARY');
    console.log('=' .repeat(70));
    console.log('   Email: worker@gmail.com');
    console.log('   Employee ID:', employeeId);
    console.log('   Employee Name:', employee.fullName);
    console.log('   Today\'s Tasks:', assignments.length);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkWorkerGmailRaw();
