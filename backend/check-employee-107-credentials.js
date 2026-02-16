import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkEmployee107() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Employee = mongoose.connection.collection('employees');
    const User = mongoose.connection.collection('users');

    // Find employee 107
    console.log('\n🔍 Searching for employee 107...');
    const employee = await Employee.findOne({ id: 107 });

    if (employee) {
      console.log('\n👤 Employee 107:');
      console.log({
        id: employee.id,
        fullName: employee.fullName,
        userId: employee.userId,
        companyId: employee.companyId,
        status: employee.status
      });

      // Find associated user
      if (employee.userId) {
        const user = await User.findOne({ id: employee.userId });
        
        if (user) {
          console.log('\n🔐 User account:');
          console.log({
            id: user.id,
            email: user.email,
            role: user.role,
            hasPassword: !!user.passwordHash
          });
          
          console.log('\n✅ Login credentials:');
          console.log({
            email: user.email,
            password: 'password123 (default)'
          });
        } else {
          console.log('\n❌ User not found for userId:', employee.userId);
        }
      } else {
        console.log('\n⚠️ Employee has no userId');
      }
    } else {
      console.log('\n❌ Employee 107 not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkEmployee107();
