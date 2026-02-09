import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';

dotenv.config();

async function fixSupervisorDashboard() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find supervisor user by email
    const supervisorUser = await CompanyUser.findOne({ email: 'supervisor@gmail.com' });
    if (!supervisorUser) {
      console.error('❌ Supervisor user not found in CompanyUser collection');
      return;
    }

    console.log('✅ Found Supervisor User:');
    console.log(`   ID: ${supervisorUser.id}`);
    console.log(`   Email: ${supervisorUser.email}`);
    console.log(`   Role: ${supervisorUser.role}`);

    // Find or create employee record
    let employee = await Employee.findOne({ userId: supervisorUser.id });
    
    if (!employee) {
      console.log('\n⚠️  No employee found with userId, checking by ID...');
      employee = await Employee.findOne({ id: supervisorUser.id });
      
      if (employee) {
        console.log('✅ Found employee by ID, updating userId...');
        await Employee.findOneAndUpdate(
          { id: employee.id },
          { userId: supervisorUser.id },
          { new: true }
        );
        console.log('✅ Updated employee userId');
      } else {
        console.log('\n⚠️  No employee record exists, checking all employees...');
        const allEmployees = await Employee.find({}).limit(10);
        console.log(`\n📋 Found ${allEmployees.length} employees:`);
        allEmployees.forEach(e => {
          console.log(`   ID: ${e.id}, Name: ${e.fullName}, UserId: ${e.userId || 'none'}`);
        });
        
        // Try to find by name
        const possibleEmployee = allEmployees.find(e => 
          e.fullName?.toLowerCase().includes('supervisor') ||
          e.fullName?.toLowerCase().includes('kawaja')
        );
        
        if (possibleEmployee) {
          console.log(`\n🔧 Found possible match: ${possibleEmployee.fullName} (ID: ${possibleEmployee.id})`);
          console.log('   Updating userId...');
          await Employee.findOneAndUpdate(
            { id: possibleEmployee.id },
            { userId: supervisorUser.id },
            { new: true }
          );
          employee = possibleEmployee;
          console.log('✅ Updated employee userId');
        } else {
          console.error('\n❌ Could not find matching employee record');
          return;
        }
      }
    }

    // Verify the link
    const verifyEmployee = await Employee.findOne({ userId: supervisorUser.id });
    if (verifyEmployee) {
      console.log('\n✅ Verification Successful:');
      console.log(`   User ID ${supervisorUser.id} → Employee ID ${verifyEmployee.id}`);
      console.log(`   Employee Name: ${verifyEmployee.fullName}`);
      console.log(`   Current Project: ${verifyEmployee.currentProjectId || 'None'}`);
      
      console.log('\n🎉 Supervisor dashboard should now work!');
      console.log('   Try accessing the dashboard in the mobile app.');
    } else {
      console.error('\n❌ Verification failed - employee not found by userId');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
  }
}

fixSupervisorDashboard();
