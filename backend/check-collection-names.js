// Check which collection has the attendance data
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkCollectionNames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 Checking attendance collections...\n');
    
    // Check 'attendance' collection (singular - what the model uses)
    const attendanceCol = db.collection('attendance');
    const attendanceCount = await attendanceCol.countDocuments();
    console.log(`📊 'attendance' collection: ${attendanceCount} documents`);
    
    if (attendanceCount > 0) {
      const sampleAttendance = await attendanceCol.find({
        employeeId: { $in: [2, 104, 107] }
      }).limit(3).toArray();
      
      console.log(`   Found ${sampleAttendance.length} records for employees 2, 104, 107:`);
      sampleAttendance.forEach(rec => {
        console.log(`   - Employee ${rec.employeeId}: checkIn = ${rec.checkIn || 'null'}`);
      });
    }
    
    // Check 'attendances' collection (plural - what our scripts used)
    const attendancesCol = db.collection('attendances');
    const attendancesCount = await attendancesCol.countDocuments();
    console.log(`\n📊 'attendances' collection: ${attendancesCount} documents`);
    
    if (attendancesCount > 0) {
      const sampleAttendances = await attendancesCol.find({
        employeeId: { $in: [2, 104, 107] }
      }).limit(3).toArray();
      
      console.log(`   Found ${sampleAttendances.length} records for employees 2, 104, 107:`);
      sampleAttendances.forEach(rec => {
        console.log(`   - Employee ${rec.employeeId}: checkIn = ${rec.checkIn || 'null'}`);
      });
    }
    
    console.log('\n💡 The Attendance model uses collection: "attendance" (singular)');
    console.log('💡 Our test scripts used collection: "attendances" (plural)');
    console.log('💡 We need to move data from "attendances" to "attendance"');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCollectionNames();