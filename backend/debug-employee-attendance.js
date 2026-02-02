import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import appConfig from './src/config/app.config.js';

async function debugEmployeeAttendance() {
  try {
    // Connect to MongoDB
    await mongoose.connect(appConfig.database.uri, { 
      dbName: appConfig.database.name,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find user with ID 2 (worker@gmail.com)
    const user = await User.findOne({ id: 2 });
    console.log('\n👤 User Details:');
    console.log('User ID:', user?.id);
    console.log('Email:', user?.email);
    console.log('Company ID:', user?.companyId);
    console.log('Role ID:', user?.roleId);

    // Find employee linked to this user
    const employee = await Employee.findOne({ 
      userId: 2,
      companyId: 1 
    });
    
    console.log('\n👷 Employee Details:');
    if (employee) {
      console.log('Employee ID:', employee.id);
      console.log('User ID:', employee.userId);
      console.log('Company ID:', employee.companyId);
      console.log('Full Name:', employee.fullName);
      console.log('Status:', employee.status);
      console.log('Email:', employee.email);
    } else {
      console.log('❌ No employee found for userId: 2, companyId: 1');
      
      // Check if employee exists with different criteria
      const allEmployees = await Employee.find({ userId: 2 });
      console.log(`\n🔍 Found ${allEmployees.length} employees with userId: 2`);
      allEmployees.forEach((emp, index) => {
        console.log(`Employee ${index + 1}:`);
        console.log(`  ID: ${emp.id}`);
        console.log(`  Company ID: ${emp.companyId}`);
        console.log(`  Status: ${emp.status}`);
        console.log(`  Full Name: ${emp.fullName}`);
      });
    }

    // Check all employees in company 1
    const companyEmployees = await Employee.find({ companyId: 1 });
    console.log(`\n🏢 Found ${companyEmployees.length} employees in company 1:`);
    companyEmployees.forEach((emp, index) => {
      console.log(`Employee ${index + 1}:`);
      console.log(`  ID: ${emp.id}`);
      console.log(`  User ID: ${emp.userId}`);
      console.log(`  Status: ${emp.status}`);
      console.log(`  Full Name: ${emp.fullName}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

debugEmployeeAttendance();