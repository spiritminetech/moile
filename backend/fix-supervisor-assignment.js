// Fix script to assign supervisor to existing task assignments
import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixSupervisorAssignment() {
  try {
    console.log('🔧 Fixing supervisor assignment...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to database');

    // Find Employee 107 (Raj Kumar)
    const employee = await Employee.findOne({ id: 107 });
    if (!employee) {
      console.log('❌ Employee 107 not found');
      return;
    }

    // Find the supervisor (Suresh Kumar, ID: 17)
    const supervisor = await Employee.findOne({ id: 17 });
    if (!supervisor) {
      console.log('❌ Supervisor with ID 17 not found');
      return;
    }

    console.log('👨‍💼 Found supervisor:');
    console.log('  - ID:', supervisor.id);
    console.log('  - Name:', supervisor.fullName);
    console.log('  - Phone:', supervisor.phone || 'N/A');
    console.log('  - Job Title:', supervisor.jobTitle);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today:', today);

    // Find task assignments for today that don't have a supervisor
    const assignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today,
      $or: [
        { supervisorId: null },
        { supervisorId: { $exists: false } }
      ]
    });

    console.log(`\n📋 Found ${assignments.length} task assignments without supervisor`);

    if (assignments.length === 0) {
      console.log('✅ All assignments already have supervisors assigned');
      return;
    }

    // Update all assignments to have the supervisor
    const updateResult = await WorkerTaskAssignment.updateMany(
      {
        employeeId: employee.id,
        date: today,
        $or: [
          { supervisorId: null },
          { supervisorId: { $exists: false } }
        ]
      },
      {
        $set: {
          supervisorId: supervisor.id,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} task assignments with supervisor ID ${supervisor.id}`);

    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const updatedAssignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    }).sort({ sequence: 1 });

    updatedAssignments.forEach((assignment, index) => {
      console.log(`📝 Assignment ${index + 1}:`);
      console.log(`  - Assignment ID: ${assignment.id}`);
      console.log(`  - Task ID: ${assignment.taskId}`);
      console.log(`  - Supervisor ID: ${assignment.supervisorId || 'NOT SET'}`);
      console.log(`  - Work Area: ${assignment.workArea}`);
    });

    console.log('\n✅ Supervisor assignment fix completed!');
    console.log('📱 Dashboard should now show supervisor information instead of "N/A"');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the fix
fixSupervisorAssignment();