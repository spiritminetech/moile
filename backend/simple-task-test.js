// Simple test to check if tasks are being returned correctly
import mongoose from 'mongoose';
import { getWorkerTasksToday, getWorkerTaskHistory } from './src/modules/worker/workerController.js';
import Employee from './src/modules/employee/Employee.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

async function testTaskEndpoints() {
  try {
    console.log('🔍 Testing task endpoints...\n');

    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to database');

    // Find a test employee
    const employee = await Employee.findOne({ email: 'worker@gmail.com' });
    if (!employee) {
      console.log('❌ No test employee found');
      return;
    }

    console.log('👤 Found employee:', employee.fullName, 'ID:', employee.id);

    // Check task assignments
    const assignments = await WorkerTaskAssignment.find({ employeeId: employee.id });
    console.log('📋 Task assignments found:', assignments.length);

    if (assignments.length > 0) {
      console.log('📋 Sample assignment:', {
        id: assignments[0].id,
        taskId: assignments[0].taskId,
        projectId: assignments[0].projectId,
        status: assignments[0].status,
        date: assignments[0].date
      });
    }

    // Test today's tasks endpoint
    console.log('\n🧪 Testing getWorkerTasksToday...');
    const mockReq = {
      user: { userId: employee.userId, companyId: employee.companyId },
      query: {}
    };

    const mockRes = {
      json: (data) => {
        console.log('📊 Today\'s tasks response:', {
          success: data.success,
          hasData: !!data.data,
          hasTasks: !!(data.data?.tasks),
          tasksCount: data.data?.tasks?.length || 0,
          dailySummary: data.data?.dailySummary
        });
        return data;
      },
      status: (code) => ({
        json: (data) => {
          console.log('❌ Error response:', code, data);
          return data;
        }
      })
    };

    await getWorkerTasksToday(mockReq, mockRes);

    // Test task history endpoint
    console.log('\n🧪 Testing getWorkerTaskHistory...');
    const mockRes2 = {
      json: (data) => {
        console.log('📊 Task history response:', {
          success: data.success,
          hasData: !!data.data,
          hasTasks: !!(data.data?.tasks),
          tasksCount: data.data?.tasks?.length || 0,
          pagination: data.data?.pagination,
          summary: data.data?.summary
        });
        return data;
      },
      status: (code) => ({
        json: (data) => {
          console.log('❌ Error response:', code, data);
          return data;
        }
      })
    };

    await getWorkerTaskHistory(mockReq, mockRes2);

  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Test completed');
  }
}

testTaskEndpoints();