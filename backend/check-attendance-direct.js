/**
 * Check attendance collection directly
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './src/modules/attendance/Attendance.js';

dotenv.config();

async function checkAttendance() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    console.log('Checking attendance for employeeId: 104, projectId: 201');
    console.log('═'.repeat(60));

    // Direct query
    const attendance = await Attendance.findOne({
      employeeId: 104,
      projectId: 201
    }).lean();

    if (attendance) {
      console.log('✅ Attendance found!');
      console.log(JSON.stringify(attendance, null, 2));
      console.log('\nField types:');
      console.log('  employeeId type:', typeof attendance.employeeId, '- value:', attendance.employeeId);
      console.log('  projectId type:', typeof attendance.projectId, '- value:', attendance.projectId);
      console.log('  checkIn type:', typeof attendance.checkIn, '- value:', attendance.checkIn);
    } else {
      console.log('❌ No attendance found');
      
      // Try to find any attendance for this employee
      const anyAttendance = await Attendance.findOne({ employeeId: 104 }).lean();
      if (anyAttendance) {
        console.log('\n⚠️  Found attendance for employee 104 but different projectId:');
        console.log('  projectId:', anyAttendance.projectId);
      }
      
      // Try to find any attendance for this project
      const projectAttendance = await Attendance.findOne({ projectId: 201 }).lean();
      if (projectAttendance) {
        console.log('\n⚠️  Found attendance for project 201 but different employeeId:');
        console.log('  employeeId:', projectAttendance.employeeId);
      }
    }

    // Check collection name
    console.log('\n📊 Collection Info:');
    console.log('  Model collection name:', Attendance.collection.name);
    
    // Count total attendance records
    const totalCount = await Attendance.countDocuments();
    console.log('  Total attendance records:', totalCount);

    // Try aggregation directly on attendance collection
    console.log('\n🔍 Testing aggregation match:');
    const aggResult = await mongoose.connection.db.collection('attendances').aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ['$employeeId', 104] },
              { $eq: ['$projectId', 201] },
              { $ne: ['$checkIn', null] }
            ]
          }
        }
      }
    ]).toArray();
    console.log('  Aggregation match count:', aggResult.length);
    if (aggResult.length > 0) {
      console.log('  First match:', JSON.stringify(aggResult[0], null, 2));
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAttendance();
