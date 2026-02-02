import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import Employee from './src/modules/employee/Employee.js';
import Task from './src/modules/task/Task.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define WorkerTaskAssignment schema since we don't have the model imported
const workerTaskAssignmentSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  workerId: { type: Number, required: true },
  taskId: { type: Number, required: true },
  projectId: { type: Number, required: true },
  assignedDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'ASSIGNED' },
  startTime: { type: Date },
  endTime: { type: Date },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', workerTaskAssignmentSchema);

const createWorkerTaskAssignments = async () => {
  await connectDB();

  try {
    console.log('\n🔧 CREATING WORKER TASK ASSIGNMENTS\n');

    // 1. Find the user and their project
    const user = await User.findOne({ email: 'worker@gmail.com' });
    const employee = await Employee.findOne({ userId: user.id });
    
    console.log(`1. User: ${user.email} (ID: ${user.id})`);
    console.log(`   Employee ID: ${employee.id}`);
    console.log(`   Current Project: ${employee.currentProject?.id}`);

    const projectId = employee.currentProject?.id;

    // 2. Find tasks for this project
    const tasks = await Task.find({ projectId: projectId });
    console.log(`\n2. Found ${tasks.length} tasks for project ${projectId}:`);
    tasks.forEach(task => {
      console.log(`   - ${task.taskName} (ID: ${task.id})`);
    });

    // 3. Check existing task assignments
    const existingAssignments = await WorkerTaskAssignment.find({ 
      workerId: employee.id,
      projectId: projectId 
    });
    
    console.log(`\n3. Existing task assignments: ${existingAssignments.length}`);
    existingAssignments.forEach(assignment => {
      console.log(`   - Task ${assignment.taskId}, Status: ${assignment.status}`);
    });

    // 4. Create task assignments for today
    console.log('\n4. Creating task assignments for today...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const task of tasks) {
      // Check if assignment already exists
      const existingAssignment = await WorkerTaskAssignment.findOne({
        workerId: employee.id,
        taskId: task.id,
        projectId: projectId
      });

      if (!existingAssignment) {
        // Get next assignment ID
        const lastAssignment = await WorkerTaskAssignment.findOne({}, {}, { sort: { id: -1 } });
        const nextId = lastAssignment ? lastAssignment.id + 1 : 1;

        const assignment = new WorkerTaskAssignment({
          id: nextId,
          workerId: employee.id,
          taskId: task.id,
          projectId: projectId,
          assignedDate: today,
          status: 'ASSIGNED',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await assignment.save();
        console.log(`   ✅ Created assignment: Worker ${employee.id} → Task ${task.id} (${task.taskName})`);
      } else {
        console.log(`   ⚠️ Assignment already exists: Worker ${employee.id} → Task ${task.id}`);
        
        // Update the assignment date to today if it's old
        if (existingAssignment.assignedDate < today) {
          await WorkerTaskAssignment.updateOne(
            { _id: existingAssignment._id },
            { 
              assignedDate: today,
              status: 'ASSIGNED',
              updatedAt: new Date()
            }
          );
          console.log(`   ✅ Updated assignment date to today`);
        }
      }
    }

    // 5. Verify assignments
    console.log('\n5. Verifying task assignments...');
    const allAssignments = await WorkerTaskAssignment.find({ 
      workerId: employee.id,
      projectId: projectId 
    });
    
    console.log(`   Total assignments for worker: ${allAssignments.length}`);
    allAssignments.forEach(assignment => {
      console.log(`   - Task ${assignment.taskId}, Date: ${assignment.assignedDate.toDateString()}, Status: ${assignment.status}`);
    });

    // 6. Test clock-in again
    console.log('\n6. Testing clock-in API...');
    
    try {
      const axios = (await import('axios')).default;
      
      // First check current status
      const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
        email: 'worker@gmail.com',
        password: 'password123'
      });
      const token = loginResponse.data.token;

      const statusResponse = await axios.get(
        'http://localhost:5002/api/worker/attendance/today',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      console.log(`   Current status: ${statusResponse.data.session}`);
      
      if (statusResponse.data.session === 'CHECKED_OUT' || statusResponse.data.session === 'NOT_LOGGED_IN') {
        // Try clock-in
        const clockInResponse = await axios.post(
          'http://localhost:5002/api/worker/attendance/clock-in',
          {
            projectId: projectId,
            latitude: 12.865141646709928,
            longitude: 77.6467982341202,
            accuracy: 10
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('   ✅ Clock-in successful!', clockInResponse.data.message);
      } else {
        console.log('   ⚠️ User is already checked in, trying clock-out first...');
        
        try {
          const clockOutResponse = await axios.post(
            'http://localhost:5002/api/worker/attendance/clock-out',
            {
              projectId: projectId,
              latitude: 12.865141646709928,
              longitude: 77.6467982341202,
              accuracy: 10
            },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          console.log('   ✅ Clock-out successful, now user can clock-in again');
        } catch (clockOutError) {
          console.log('   ❌ Clock-out failed:', clockOutError.response?.data?.message);
        }
      }

    } catch (clockInError) {
      if (clockInError.response) {
        console.log('   ❌ Clock-in failed:', clockInError.response.data.message);
      } else {
        console.log('   ❌ Clock-in request failed:', clockInError.message);
      }
    }

    console.log('\n🎯 SUMMARY:');
    console.log('   ✅ Task assignments created for the worker');
    console.log('   ✅ Worker should now be able to clock in');
    console.log('   📱 Try the mobile app clock-in again');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
};

createWorkerTaskAssignments();