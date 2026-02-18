// Fix task start issues for worker@gmail.com
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import User from './src/modules/user/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function fixTaskStartIssues() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(80));
    console.log('🔧 FIXING TASK START ISSUES');
    console.log('='.repeat(80));

    // Find user and employee
    const user = await User.findOne({ email: 'worker@gmail.com' });
    const employee = await Employee.findOne({ userId: user.id });
    
    console.log('\n👤 Worker:', employee.fullName);
    console.log('   Employee ID:', employee.id);

    // Step 1: Complete the active task
    console.log('\n📋 STEP 1: Completing Active Task...');
    const activeTask = await WorkerTaskAssignment.findOne({
      employeeId: employee.id,
      status: 'in_progress'
    });
    
    if (activeTask) {
      console.log('   Found active task:', 