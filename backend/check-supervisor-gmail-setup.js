import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkSetup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
    const Supervisor = mongoose.model('Supervisor', new mongoose.Schema({}, { strict: false, collection: 'supervisors' }));
    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));

    // Check user
    const user = await User.findOne({ email: 'supervisor@gmail.com' });
    console.log('USER:', user ? {
      _id: user._id,
      userId: user.userId,
      email: user.email,
      role: user.role
    } : 'Not found');

    // Check all supervisors
    const supervisors = await Supervisor.find().limit(5);
    console.log('\nSUPERVISORS:');
    supervisors.forEach(sup => {
      console.log(`- ID: ${sup.supervisorId}, Name: ${sup.name}, UserID: ${sup.userId}, Email: ${sup.email}`);
    });

    // Check employees
    const employees = await Employee.find().limit(5);
    console.log('\nEMPLOYEES:');
    employees.forEach(emp => {
      console.log(`- ID: ${emp.employeeId}, Name: ${emp.name}, SupervisorID: ${emp.supervisorId}`);
    });

    // Try to find supervisor by email
    const supByEmail = await Supervisor.findOne({ email: 'supervisor@gmail.com' });
    console.log('\nSUPERVISOR BY EMAIL:', supByEmail ? {
      supervisorId: supByEmail.supervisorId,
      name: supByEmail.name,
      email: supByEmail.email
    } : 'Not found');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkSetup();
