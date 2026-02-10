import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

const BASE_URL = 'http://192.168.0.3:5002/api';

// Test credentials for supervisor
const SUPERVISOR_CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'password123'
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function testUpdateTaskPriority() {
  try {
    await connectDB();

    console.log('🔐 Logging in as supervisor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, SUPERVISOR_CREDENTIALS);
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Get a sample assignment from database
    const assignment = await WorkerTaskAssignment.findOne().lean();
    
    if (!assignment) {
      console.error('❌ No assignments found in database');
      return;
    }

    console.log('📋 Sample assignment from database:');
    console.log(`   _id: ${assignment._id}`);
    console.log(`   id: ${assignment.id}`);
    console.log(`   taskId: ${assignment.taskId}`);
    console.log(`   employeeId: ${assignment.employeeId}`);
    console.log(`   current priority: ${assignment.priority || 'not set'}`);
    console.log(`   status: ${assignment.status}\n`);

    // Test 1: Update priority using _id (MongoDB ObjectId)
    console.log('🧪 Test 1: Updating priority using _id (ObjectId)...');
    const assignmentId = assignment._id.toString();
    console.log(`   Assignment ID: ${assignmentId}`);

    try {
      const updateResponse = await axios.put(
        `${BASE_URL}/supervisor/task-assignments/${assignmentId}/priority`,
        {
          priority: 'high',
          instructions: 'This is urgent - please prioritize',
          estimatedHours: 6
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (updateResponse.data.success) {
        console.log('✅ Priority updated successfully');
        console.log('   Response:', updateResponse.data.data);
      } else {
        console.error('❌ Update failed:', updateResponse.data);
      }
    } catch (error) {
      console.error('❌ Update request failed');
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
      } else {
        console.error('   Error:', error.message);
      }
    }

    // Verify the update
    console.log('\n📊 Verifying update in database...');
    const updatedAssignment = await WorkerTaskAssignment.findById(assignment._id).lean();
    console.log(`   Priority: ${updatedAssignment.priority}`);
    console.log(`   Instructions: ${updatedAssignment.instructions || 'none'}`);
    console.log(`   Estimated Hours: ${updatedAssignment.estimatedHours || 'not set'}`);

    if (updatedAssignment.priority === 'high') {
      console.log('\n✅ Update verified in database!');
    } else {
      console.log('\n⚠️  Update may not have been saved');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the test
testUpdateTaskPriority();
