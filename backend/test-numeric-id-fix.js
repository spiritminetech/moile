import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import WorkerTaskProgress from './src/modules/worker/models/WorkerTaskProgress.js';

dotenv.config();

async function testNumericIdFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(80));
    console.log('🧪 TESTING NUMERIC ID FIX');
    console.log('='.repeat(80));
    console.log('');

    // Test with the actual models (not strict: false)
    const today = "2026-02-16";
    
    console.log('1️⃣  Testing WorkerTaskAssignment.id field');
    console.log('-'.repeat(80));
    
    const assignments = await WorkerTaskAssignment.find({
      projectId: 1002,
      date: today
    });
    
    console.log(`Found ${assignments.length} assignments\n`);
    
    assignments.forEach((assignment, index) => {
      console.log(`Assignment #${index + 1}:`);
      console.log(`  assignment.id = ${assignment.id} (type: ${typeof assignment.id})`);
      console.log(`  assignment._id = ${assignment._id}`);
      console.log(`  employeeId = ${assignment.employeeId}`);
      console.log('');
    });
    
    console.log('2️⃣  Testing .map(a => a.id)');
    console.log('-'.repeat(80));
    
    const assignmentIds = assignments.map(a => a.id);
    console.log(`Assignment IDs: [${assignmentIds.join(', ')}]`);
    console.log(`Types: [${assignmentIds.map(id => typeof id).join(', ')}]`);
    console.log('');
    
    // Check if they're numeric
    const allNumeric = assignmentIds.every(id => typeof id === 'number');
    if (allNumeric) {
      console.log('✅ All IDs are NUMERIC!\n');
    } else {
      console.log('❌ IDs are NOT numeric\n');
      return;
    }
    
    console.log('3️⃣  Testing Progress Query with Numeric IDs');
    console.log('-'.repeat(80));
    
    const progresses = await WorkerTaskProgress.find({
      workerTaskAssignmentId: { $in: assignmentIds },
      status: { $in: ["SUBMITTED", "APPROVED"] }
    });
    
    console.log(`Query: WorkerTaskProgress.find({`);
    console.log(`  workerTaskAssignmentId: { $in: [${assignmentIds.join(', ')}] },`);
    console.log(`  status: { $in: ["SUBMITTED", "APPROVED"] }`);
    console.log(`})\n`);
    
    console.log(`Result: ${progresses.length} progress record(s) found\n`);
    
    if (progresses.length > 0) {
      console.log('✅ PROGRESS FOUND!\n');
      
      progresses.forEach((progress, index) => {
        console.log(`Progress #${index + 1}:`);
        console.log(`  ID: ${progress.id}`);
        console.log(`  Assignment ID: ${progress.workerTaskAssignmentId}`);
        console.log(`  Employee ID: ${progress.employeeId}`);
        console.log(`  Progress: ${progress.progressPercent}%`);
        console.log(`  Status: ${progress.status}`);
        console.log('');
      });
      
      console.log('4️⃣  Simulating API Response');
      console.log('-'.repeat(80));
      
      const apiResponse = progresses.map(progress => {
        const assignment = assignments.find(a => a.id === progress.workerTaskAssignmentId);
        return {
          progressId: progress.id,
          assignmentId: progress.workerTaskAssignmentId,
          workerName: `Employee ${progress.employeeId}`,
          taskName: `Task ${assignment?.taskId || 'Unknown'}`,
          attendanceChecked: false,
          progressPercent: progress.progressPercent,
          description: progress.description,
          status: progress.status,
          photos: []
        };
      });
      
      console.log('📤 API Response:');
      console.log(JSON.stringify(apiResponse, null, 2));
      console.log('');
      
      console.log('='.repeat(80));
      console.log('🎉 SUCCESS! The fix works!');
      console.log('='.repeat(80));
      console.log('');
      console.log('✅ Numeric IDs are now working correctly');
      console.log('✅ Progress records are being found');
      console.log('✅ API will return data to the mobile app');
      console.log('');
      
    } else {
      console.log('❌ No progress found');
      console.log('');
      console.log('Checking if progress exists for these assignment IDs:');
      for (const id of assignmentIds) {
        const count = await WorkerTaskProgress.countDocuments({
          workerTaskAssignmentId: id
        });
        console.log(`  Assignment ${id}: ${count} progress record(s)`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testNumericIdFix();
