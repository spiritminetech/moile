// Test worker dashboard API to check supervisor data
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import Employee from './src/modules/employee/Employee.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function testSupervisorData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find worker@gmail.com
    const user = await User.findOne({ email: 'worker@gmail.com' });
    if (!user) {
      console.log('❌ Worker user not found');
      return;
    }

    const employee = await Employee.findOne({ userId: user.id });
    if (!employee) {
      console.log('❌ Employee not found');
      return;
    }

    console.log('✅ Worker found:', employee.fullName, '(ID:', employee.id, ')');

    // Get today's assignment
    const today = new Date().toISOString().split('T')[0];
    const assignment = await WorkerTaskAssignment.findOne({
      employeeId: employee.id,
      date: today
    });

    if (!assignment) {
      console.log('❌ No assignment for today');
      return;
    }

    console.log('✅ Assignment found for project:', assignment.projectId);

    // Check if assignment has supervisorId
    console.log('\n📋 Assignment supervisor data:');
    console.log('   supervisorId:', assignment.supervisorId || 'NOT SET');

    if (assignment.supervisorId) {
      // Find supervisor employee
      const supervisor = await Employee.findOne({ id: assignment.supervisorId });
      if (supervisor) {
        console.log('\n✅ Supervisor found:');
        console.log('   ID:', supervisor.id);
        console.log('   Name:', supervisor.fullName);
        console.log('   Phone:', supervisor.phone || 'NOT SET');
        console.log('   Email:', supervisor.email || 'NOT SET');
      } else {
        console.log('\n❌ Supervisor employee not found for ID:', assignment.supervisorId);
      }
    } else {
      console.log('\n⚠️ No supervisor assigned to this task assignment');
      console.log('💡 Need to add supervisorId to the assignment\n');

      // Find a supervisor to assign
      const supervisors = await Employee.find({ 
        jobTitle: { $regex: /supervisor/i },
        status: 'ACTIVE'
      }).limit(5);

      if (supervisors.length > 0) {
        console.log('Available supervisors:');
        supervisors.forEach(sup => {
          console.log(`   - ${sup.fullName} (ID: ${sup.id}, Phone: ${sup.phone || 'N/A'})`);
        });

        // Assign first supervisor
        const selectedSupervisor = supervisors[0];
        console.log(`\n🔧 Assigning supervisor: ${selectedSupervisor.fullName}`);
        
        await WorkerTaskAssignment.updateOne(
          { id: assignment.id },
          { $set: { supervisorId: selectedSupervisor.id } }
        );

        console.log('✅ Supervisor assigned to task assignment!');
        console.log('\n📝 Supervisor details:');
        console.log('   Name:', selectedSupervisor.fullName);
        console.log('   Phone:', selectedSupervisor.phone || 'NOT SET');
        console.log('   Email:', selectedSupervisor.email || 'NOT SET');
      } else {
        console.log('❌ No supervisors found in database');
        console.log('💡 Creating a test supervisor...\n');

        // Create a test supervisor
        const maxEmp = await Employee.findOne({}).sort({ id: -1 });
        const nextEmpId = (maxEmp?.id || 0) + 1;

        const maxUser = await User.findOne({}).sort({ id: -1 });
        const nextUserId = (maxUser?.id || 0) + 1;

        // Create supervisor user
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash('supervisor123', 10);
        
        const supervisorUser = new User({
          id: nextUserId,
          email: 'supervisor@test.com',
          passwordHash: hashedPassword,
          role: 'supervisor',
          companyId: employee.companyId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await supervisorUser.save();

        // Create supervisor employee
        const supervisorEmployee = new Employee({
          id: nextEmpId,
          userId: nextUserId,
          companyId: employee.companyId,
          fullName: 'Mr. Ravi Kumar',
          employeeCode: `SUP${nextEmpId.toString().padStart(3, '0')}`,
          phone: '+65 9123 4567',
          email: 'supervisor@test.com',
          nationality: 'Singapore',
          jobTitle: 'Site Supervisor',
          department: 'Construction',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await supervisorEmployee.save();

        console.log('✅ Supervisor created:', supervisorEmployee.fullName);

        // Assign to task
        await WorkerTaskAssignment.updateOne(
          { id: assignment.id },
          { $set: { supervisorId: supervisorEmployee.id } }
        );

        console.log('✅ Supervisor assigned to task assignment!');
        console.log('\n📝 Supervisor details:');
        console.log('   Name:', supervisorEmployee.fullName);
        console.log('   Phone:', supervisorEmployee.phone);
        console.log('   Email:', supervisorEmployee.email);
      }
    }

    console.log('\n✅ Dashboard should now show supervisor information!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testSupervisorData();
