import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

// Import models
import Employee from './src/modules/employee/Employee.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

const BASE_URL = 'http://localhost:5002/api';

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function debugTaskHistoryDetailed() {
  await connectDB();
  
  try {
    // First, login to get a valid token
    console.log('🔐 Logging in to get valid token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    const companyId = loginResponse.data.company.id;
    
    console.log('✅ Login successful');
    console.log('User ID:', userId);
    console.log('Company ID:', companyId);
    
    // Now manually check what the resolveEmployee function would find
    console.log('\n🔍 Checking employee resolution...');
    const employee = await Employee.findOne({
      userId: userId,
      companyId: companyId,
      status: "ACTIVE"
    });
    
    if (!employee) {
      console.error('❌ Employee not found');
      return;
    }
    
    console.log('✅ Employee found:', {
      id: employee.id,
      fullName: employee.fullName,
      userId: employee.userId,
      companyId: employee.companyId
    });
    
    // Check task assignments for this employee
    console.log('\n📋 Checking task assignments...');
    const assignments = await WorkerTaskAssignment.find({
      employeeId: employee.id
    }).sort({ date: -1 }).limit(5);
    
    console.log(`Found ${assignments.length} assignments for employee ${employee.id}`);
    
    if (assignments.length > 0) {
      console.log('Sample assignment:', {
        id: assignments[0].id,
        taskId: assignments[0].taskId,
        projectId: assignments[0].projectId,
        status: assignments[0].status,
        date: assignments[0].date
      });
      
      // Check if we can get task and project details
      const [task, project] = await Promise.all([
        Task.findOne({ id: assignments[0].taskId }).select('taskName taskType'),
        Project.findOne({ id: assignments[0].projectId }).select('projectName')
      ]);
      
      console.log('Task details:', task);
      console.log('Project details:', project);
    }
    
    // Now try the API call
    console.log('\n🔍 Testing Task History API...');
    const response = await axios.get(`${BASE_URL}/worker/tasks/history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        page: 1,
        limit: 10
      }
    });
    
    console.log('✅ API Success:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    if (error.response?.data) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await mongoose.disconnect();
  }
}

debugTaskHistoryDetailed();