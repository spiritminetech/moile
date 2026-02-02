// migrations/add-lunch-break-fields-to-attendance.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system';

async function addLunchBreakFields() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const attendanceCollection = db.collection('attendance');

    console.log('🔄 Adding lunch break fields to attendance records...');

    // Add lunch break fields to all existing attendance records
    const result = await attendanceCollection.updateMany(
      {
        $or: [
          { lunchStartTime: { $exists: false } },
          { lunchEndTime: { $exists: false } },
          { overtimeStartTime: { $exists: false } }
        ]
      },
      {
        $set: {
          lunchStartTime: null,
          lunchEndTime: null,
          overtimeStartTime: null
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} attendance records with lunch break fields`);

    // Verify the migration
    const sampleRecord = await attendanceCollection.findOne({});
    if (sampleRecord) {
      console.log('📋 Sample record after migration:');
      console.log({
        id: sampleRecord.id,
        employeeId: sampleRecord.employeeId,
        projectId: sampleRecord.projectId,
        date: sampleRecord.date,
        checkIn: sampleRecord.checkIn,
        checkOut: sampleRecord.checkOut,
        lunchStartTime: sampleRecord.lunchStartTime,
        lunchEndTime: sampleRecord.lunchEndTime,
        overtimeStartTime: sampleRecord.overtimeStartTime
      });
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration
addLunchBreakFields();