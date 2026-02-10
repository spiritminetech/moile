/**
 * Check which employeeId is associated with worker@gmail.com
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

const employeeSchema = new mongoose.Schema({
  id: Number,
  fullName: String,
  email: String,
  phone: String,
  jobTitle: String,
  status: String,
  companyId: Number
}, { collection: 'employees' });

const userSchema = new mongoose.Schema({
  id: Number,
  email: String,
  employeeId: Number,
  role: String,
  companyId: Number,
  status: String
}, { collection: 'users' });

const workerTaskAssignmentSchema = new mongoose.Schema({
  id: Number,
  employeeId: Number,
  projectId: Number,
  taskId: Number,
  supervisorId: Number,
  date: String,
  status: String,
  sequence: Number
}, { collection: 'workertaskassignments' });

const Employee = mongoose.model('Employee', employeeSchema);
const User = mongoose.model('User', userSchema);
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', workerTaskAssignmentSchema);

async function checkWorkerGmailEmployee() {
  try {
    console.log('🔍 Checking worker@gmail.com Account\n');
    console.log('=' .repeat(70));

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user
    console.log('1️⃣ Finding User Account...');
    const user = await User.findOne({ email: 'worker@gmail.com' });
    
    if (!user) {
      console.log('❌ User with email worker@gmail.com not found!');
      return;
    }

    console.log('✅ User Found:');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Employee ID:', user.employeeId);
    console.log('   Role:', user.role);
    console.log('   Company ID:', user.companyId);
    console.log('   Status:', user.status);

    // Find employee
    console.log('\n2️⃣ Finding Employee Record...');
    const employee = await Employee.findOne({ id: user.employeeId });
    
    if (!employee) {
      console.log('❌ Employee not found for employeeId:', user.employeeId);
      return;
    }

    console.log('✅ Employee Found:');
    console.log('   ID:', employee.id);
    console.log('   Name:', employee.fullName);
    console.log('   Email:', employee.email || 'NOT SET');
    console.log('   Phone:', employee.phone || 'NOT SET');
    console.log('   Job Title:', employee.jobTitle);
    console.log('   Status:', employee.status);

    // Check task assignments
    console.log('\n3️⃣ Checking Task Assignments...');
    const today = new Date().toISOString().split('T')[0];
    
    const todayAssignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    });

    console.log('   Today\'s assignments:', todayAssignments.length);

    if (todayAssignments.length === 0) {
      console.log('   ⚠️  No assignments for today');
      
      // Check all assignments
      const allAssignments = await WorkerTaskAssignment.find({
        employeeId: employee.id
      }).sort({ date: -1 }).limit(5);
      
      console.log('   Total assignments (all time):', allAssignments.length);
      
      if (allAssignments.length > 0) {
        console.log('\n   Recent assignments:');
        allAssignments.forEach((a, idx) => {
          console.log(`   ${idx + 1}. Date: ${a.date}, SupervisorId: ${a.supervisorId || 'NOT SET'}`);
        });
      }
    } else {
      console.log('\n   Today\'s assignments:');
      todayAssignments.forEach((a, idx) => {
        console.log(`   ${idx + 1}. Assignment ID: ${a.id}, SupervisorId: ${a.supervisorId || 'NOT SET'}`);
      });

      // Check supervisor for first assignment
      if (todayAssignments[0].supervisorId) {
        console.log('\n4️⃣ Checking Supervisor...');
        const supervisor = await Employee.findOne({ id: todayAssignments[0].supervisorId });
        
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
    console.log('   Login Email: worker@gmail.com');
    console.log('   Password: password123');
    console.log('   Employee ID:', employee.id);
    console.log('   Employee Name:', employee.fullName);
    console.log('   Today\'s Tasks:', todayAssignments.length);
    
    if (todayAssignments.length > 0 && todayAssignments[0].supervisorId) {
      const supervisor = await Employee.findOne({ id: todayAssignments[0].supervisorId });
      if (supervisor) {
        console.log('   Supervisor:', supervisor.fullName);
        console.log('\n✅ Dashboard should display supervisor name:', supervisor.fullName);
      } else {
        console.log('   Supervisor: NOT FOUND');
        console.log('\n⚠️  Dashboard will show "N/A" or hide supervisor section');
      }
    } else {
      console.log('   Supervisor: NOT ASSIGNED');
      console.log('\n⚠️  Dashboard will show "N/A" or hide supervisor section');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkWorkerGmailEmployee();
