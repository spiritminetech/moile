/**
 * Check worker@gmail.com using userId relationship
 * users.id -> employees.userId
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkWorkerGmailUserId() {
  try {
    console.log('🔍 Checking worker@gmail.com with userId Relationship\n');
    console.log('=' .repeat(70));

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Step 1: Find user
    console.log('1️⃣ Finding User...');
    const user = await db.collection('users').findOne({ email: 'worker@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User Found:');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);

    // Step 2: Find employee by userId
    console.log('\n2️⃣ Finding Employee (userId = ' + user.id + ')...');
    const employee = await db.collection('employees').findOne({ userId: user.id });
    
    if (!employee) {
      console.log('❌ Employee not found with userId:', user.id);
      
      // Check if there's an employee with id = user.id
      console.log('\n   Trying with id field...');
      const employeeById = await db.collection('employees').findOne({ id: user.id });
      
      if (employeeById) {
        console.log('✅ Employee Found by id:');
        console.log('   ID:', employeeById.id);
        console.log('   Name:', employeeById.fullName);
        console.log('   Job Title:', employeeById.jobTitle);
        console.log('   Status:', employeeById.status);
        console.log('   userId:', employeeById.userId || 'NOT SET');
        
        // Use this employee
        return await checkEmployeeDetails(db, employeeById);
      }
      
      return;
    }

    console.log('✅ Employee Found:');
    console.log('   ID:', employee.id);
    console.log('   Name:', employee.fullName);
    console.log('   Email:', employee.email || 'NOT SET');
    console.log('   Phone:', employee.phone || 'NOT SET');
    console.log('   Job Title:', employee.jobTitle);
    console.log('   Status:', employee.status);
    console.log('   userId:', employee.userId);

    await checkEmployeeDetails(db, employee);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

async function checkEmployeeDetails(db, employee) {
  // Step 3: Check task assignments
  console.log('\n3️⃣ Checking Task Assignments...');
  const today = new Date().toISOString().split('T')[0];
  
  const todayAssignments = await db.collection('workertaskassignments').find({
    employeeId: employee.id,
    date: today
  }).toArray();

  console.log('   Today\'s assignments:', todayAssignments.length);

  if (todayAssignments.length === 0) {
    console.log('   ⚠️  No assignments for today');
    
    // Check all assignments
    const allAssignments = await db.collection('workertaskassignments').find({
      employeeId: employee.id
    }).sort({ date: -1 }).limit(5).toArray();
    
    console.log('   Total assignments (all time):', allAssignments.length);
    
    if (allAssignments.length > 0) {
      console.log('\n   Recent assignments:');
      allAssignments.forEach((a, idx) => {
        console.log(`   ${idx + 1}. Date: ${a.date}, SupervisorId: ${a.supervisorId || 'NOT SET'}`);
      });
      
      // Check supervisor from most recent assignment
      if (allAssignments[0].supervisorId) {
        console.log('\n4️⃣ Checking Supervisor from Recent Assignment...');
        const supervisor = await db.collection('employees').findOne({ id: allAssignments[0].supervisorId });
        
        if (supervisor) {
          console.log('✅ Supervisor Found:');
          console.log('   ID:', supervisor.id);
          console.log('   Name:', supervisor.fullName);
          console.log('   Phone:', supervisor.phone || 'N/A');
          console.log('   Email:', supervisor.email || 'N/A');
          console.log('   Status:', supervisor.status);
        } else {
          console.log('❌ Supervisor NOT FOUND for ID:', allAssignments[0].supervisorId);
        }
      }
    }
  } else {
    console.log('\n   Today\'s assignments:');
    todayAssignments.forEach((a, idx) => {
      console.log(`   ${idx + 1}. Assignment ID: ${a.id}, Task ID: ${a.taskId}, SupervisorId: ${a.supervisorId || 'NOT SET'}`);
    });

    // Check supervisor
    if (todayAssignments[0].supervisorId) {
      console.log('\n4️⃣ Checking Supervisor...');
      const supervisor = await db.collection('employees').findOne({ id: todayAssignments[0].supervisorId });
      
      if (supervisor) {
        console.log('✅ Supervisor Found:');
        console.log('   ID:', supervisor.id);
        console.log('   Name:', supervisor.fullName);
        console.log('   Phone:', supervisor.phone || 'N/A');
        console.log('   Email:', supervisor.email || 'N/A');
        console.log('   Status:', supervisor.status);
      } else {
        console.log('❌ Supervisor NOT FOUND for ID:', todayAssignments[0].supervisorId);
      }
    } else {
      console.log('\n⚠️  No supervisor assigned to today\'s tasks');
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(70));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(70));
  console.log('   Login: worker@gmail.com / password123');
  console.log('   Employee ID:', employee.id);
  console.log('   Employee Name:', employee.fullName);
  console.log('   Today\'s Tasks:', todayAssignments.length);
  
  if (todayAssignments.length > 0 && todayAssignments[0].supervisorId) {
    const supervisor = await db.collection('employees').findOne({ id: todayAssignments[0].supervisorId });
    if (supervisor) {
      console.log('   Supervisor:', supervisor.fullName);
      console.log('\n✅ Dashboard should display supervisor name:', supervisor.fullName);
    } else {
      console.log('   Supervisor: NOT FOUND');
      console.log('\n❌ Dashboard will show "N/A" because supervisor not found');
      console.log('   Need to fix supervisorId in task assignment');
    }
  } else {
    console.log('   Supervisor: NOT ASSIGNED');
    console.log('\n⚠️  Dashboard will hide supervisor section (no tasks today)');
    console.log('\n💡 To test supervisor display:');
    console.log('   1. Create task assignment for today');
    console.log('   2. Assign a valid supervisor');
    console.log('   3. Run: node create-task-for-worker-gmail.js');
  }
}

checkWorkerGmailUserId();
