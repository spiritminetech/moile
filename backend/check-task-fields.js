// Check task field structure
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkTaskFields() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    const task = await db.collection('workerTaskAssignment').findOne({
      employeeId: 2,
      projectId: 1003
    });

    console.log('Sample Task Document:');
    console.log(JSON.stringify(task, null, 2));

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
  }
}

checkTaskFields();
