import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function moveAttendanceRecord() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const attendancesCollection = db.collection('attendances'); // Wrong collection (plural)
    const attendanceCollection = db.collection('attendance');   // Correct collection (singular)

    // Get the record from wrong collection
    const record = await attendancesCollection.findOne({
      employeeId: 2,
      id: 1769696435731
    });

    if (!record) {
      console.log('❌ Record not found in attendances collection');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 Found record in "attendances" collection:');
    console.log(`   ID: ${record.id}`);
    console.log(`   Employee ID: ${record.employeeId}`);
    console.log(`   Date: ${record.date}`);
    console.log(`   checkIn: ${record.checkIn}`);
    console.log(`   Status: ${record.status}`);

    // Insert into correct collection
    console.log('\n📤 Moving to "attendance" collection...');
    
    const insertResult = await attendanceCollection.insertOne(record);
    console.log(`✅ Inserted into "attendance" collection`);

    // Delete from wrong collection
    const deleteResult = await attendancesCollection.deleteOne({ _id: record._id });
    console.log(`✅ Deleted from "attendances" collection`);

    // Verify
    console.log('\n🔍 Verification:');
    console.log('=' .repeat(70));
    
    const verifyRecord = await attendanceCollection.findOne({
      employeeId: 2,
      id: 1769696435731
    });

    if (verifyRecord) {
      console.log('✅ Record now in correct collection');
      console.log(`   ID: ${verifyRecord.id}`);
      console.log(`   checkIn: ${verifyRecord.checkIn}`);
      console.log(`   Date: ${verifyRecord.date}`);
    } else {
      console.log('❌ Verification failed');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
    console.log('\n⚠️  RESTART BACKEND SERVER to apply changes');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

moveAttendanceRecord();
