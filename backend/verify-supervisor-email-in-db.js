import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verifyEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const employeesCollection = mongoose.connection.db.collection('employees');
    
    const supervisor = await employeesCollection.findOne({ id: 4 });
    
    console.log('\n📋 Supervisor ID 4 in database:');
    console.log({
      id: supervisor.id,
      fullName: supervisor.fullName,
      phone: supervisor.phone,
      email: supervisor.email,
      hasEmail: !!supervisor.email
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

verifyEmail();
