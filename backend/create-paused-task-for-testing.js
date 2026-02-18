import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function createPausedTask() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get collections
    const WorkerTaskAssignment = mongoose.connection.collection('workertaskassignments');
    const Employee = mongoose.connection.collection('employees');
    const User = mongoose.connection.collection('users');
    
    // Find worker.gmail@example.com user
    const user = await User.findOne({ email: 'worker.gmail@example.com' });
    if (!user) {
      console.log('❌ User worker.gmail@example.com not found');
      return;
    }
    
    const employee = await Employee.findOne({ userId: user.id });
    if (!employee) {
      console.log('❌ Employee not found for user');
      return;
    }

    console.log('\n👤 Found employee:');
    console.log('   Employee ID:', employee.id);
    console.log('   Name:', employee.fullName);
    console.log('   User ID:', user.id);

    // Get next assignment ID
    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 });
    const nextId = lastAssignment ? lastAssignment.id + 1 : 7050;

    // Create today's date
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const startTime = new Date(now.getTime() - 30 * 60 * 1000); // Started 30 mins ago
    const pausedAt = new Date(now.getTime() - 5 * 60 * 1000); // Paused 5 mins ago

    // Create a paused task assignment
    const assignment = {
      id: nextId,
      employeeId: employee.id,
      projectId: 1003,
      taskId: 1,
      taskName: 'Test Paused Task - Resume Me',
      description: 'This is a test task that has been started and paused. Click Resume to continue.',
      status: 'queued', // Paused state
      sequence: 1,
      date: today,
      startTime: startTime,
      progressPercent: 25,
      dailyTarget: {
        description: 'Complete 100 units',
        quantity: 100,
        unit: 'units',
        targetCompletion: 100
      },
      timeEstimate: {
        estimated: 480, // 8 hours in minutes
        elapsed: 30, // 30 minutes elapsed
        remaining: 450
      },
      pauseHistory: [
        {
          pausedAt: pausedAt,
          pausedBy: employee.id
        }
      ],
      supervisorId: 4,
      workArea: 'Test Area',
      floor: '1st Floor',
      zone: 'Zone A',
      createdAt: now,
      updatedAt: pausedAt
    };

    await WorkerTaskAssignment.insertOne(assignment);

    console.log('\n✅ Created paused task assignment:');
    console.log('   Assignment ID:', assignment.id);
    console.log('   Task Name:', assignment.taskName);
    console.log('   Status:', assignment.status, '(paused)');
    console.log('   Started at:', startTime.toLocaleTimeString());
    console.log('   Paused at:', pausedAt.toLocaleTimeString());
    console.log('   Progress:', assignment.progressPercent, '%');
    console.log('   Date:', today);

    console.log('\n📱 Testing Instructions:');
    console.log('1. Login as worker.gmail@example.com');
    console.log('2. Go to Today\'s Tasks');
    console.log('3. Find task:', assignment.taskName);
    console.log('4. Click "Resume Task" button');
    console.log('5. Enter progress details');
    console.log('6. Click "Update Progress"');
    console.log('7. Should work without error! ✅');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createPausedTask();
