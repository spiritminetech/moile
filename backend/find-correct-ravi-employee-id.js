import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const findCorrectEmployeeId = async () => {
  try {
    console.log('\n🔍 Finding Correct Employee ID for worker@gmail.com...\n');

    // Find the user
    const user = await User.findOne({ email: 'worker@gmail.com' }).lean();
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('User Found:');
    console.log(`  Email: ${user.email}`);
    console.log(`  User ID: ${user.userId}`);
    console.log(`  Role: ${user.role}`);
    console.log('');

    // Find ALL employees with name containing "Ravi"
    const allRaviEmployees = await Employee.find({
      name: /Ravi/i
    }).lean();

    console.log(`Found ${allRaviEmployees.length} employees with "Ravi" in name:\n`);
    
    for (const emp of allRaviEmployees) {
      console.log(`Employee ID: ${emp.id}`);
      console.log(`  Name: ${emp.name}`);
      console.log(`  User ID: ${emp.userId || 'N/A'}`);
      console.log(`  Status: ${emp.status || 'N/A'}`);
      console.log(`  Role: ${emp.role || 'N/A'}`);
      console.log('');
    }

    // Find employee linked to this user
    const linkedEmployee = await Employee.findOne({ userId: user.userId }).lean();
    if (linkedEmployee) {
      console.log('✅ Employee Linked to User:');
      console.log(`  Employee ID: ${linkedEmployee.id}`);
      console.log(`  Name: ${linkedEmployee.name}`);
      console.log('');
    } else {
      console.log('⚠️  No employee linked to this user ID');
    }

    // The API is using Employee ID 2, let's check that one
    const employeeId2 = await Employee.findOne({ id: 2 }).lean();
    if (employeeId2) {
      console.log('Employee ID 2 (used by API):');
      console.log(`  Name: ${employeeId2.name}`);
      console.log(`  User ID: ${employeeId2.userId || 'N/A'}`);
      console.log(`  Status: ${employeeId2.status || 'N/A'}`);
      console.log('');
    }

    console.log('📝 Summary:');
    console.log(`  API is using Employee ID: 2`);
    console.log(`  Tasks were assigned to Employee ID: 27`);
    console.log(`  We need to reassign tasks to Employee ID: 2`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

const main = async () => {
  await connectDB();
  await findCorrectEmployeeId();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script execution error:', error);
  process.exit(1);
});
