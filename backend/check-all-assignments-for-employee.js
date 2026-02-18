import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkAssignments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const WorkerTaskAssignment = mongoose.connection.collection('workertaskassignments');
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('\n📅 Today:', today);
    
    const assignments = await WorkerTaskAssignment.find({ date: today }).sort({ id: 1 }).toArray();
    
    console.log(`\n📋 Found ${assignments.length} assignments for today:\n`);
    
    assignments.forEach((assignment, i) => {
      console.log(`${i + 1}. Assignment ID: ${assignment.id}`);
      console.log(`   Task: ${assignment.taskName}`);
      console.log(`   Employee ID: ${assignment.employeeId}`);
      console.log(`   Status: ${assignment.status}`);
      console.log(`   Start Time: ${assignment.startTime || 'Not started'}`);
      console.log(`   Progress: ${assignment.progressPercent || 0}%`);
      console.log(`   Pauses: ${assignment.pauseHistory?.length || 0}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

checkAssignments();
