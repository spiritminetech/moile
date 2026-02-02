import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import Task from './src/modules/task/Task.js';
import WorkerNotification from './src/modules/notification/models/Notification.js';

// Load environment variables
dotenv.config();

const API_BASE = 'http://localhost:5002/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system';

async function testTaskNotificationAPI() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clean up any existing test data
    console.log('🧹 Cleaning up existing test data...');
    await WorkerTaskAssignment.deleteMany({ id: { $gte: 9990 } });
    await Employee.deleteMany({ id: { $gte: 9990 } });
    await Project.deleteMany({ id: { $gte: 9990 } });
    await Task.deleteMany({ id: { $gte: 9990 } });
    await WorkerNotification.deleteMany({ recipientId: { $gte: 9990 } });

    // Create test data
    console.log('📝 Creating test data...');
    
    // Create test supervisor
    const supervisor = await Employee.create({
      id: 9990,
      fullName: 'Test Supervisor',
      phone: '+65-1234-5678',
      email: 'supervisor@test.com',
      userId: 9990,
      companyId: 1,
      status: 'ACTIVE',
      jobTitle: 'Site Supervisor'
    });

    // Create test worker
    const worker = await Employee.create({
      id: 9991,
      fullName: 'Test Worker',
      phone: '+65-8765-4321',
      email: 'worker@test.com',
      userId: 9991,
      companyId: 1,
      status: 'ACTIVE',
      jobTitle: 'Construction Worker'
    });

    // Create test project
    const project = await Project.create({
      id: 9990,
      projectName: 'Test Construction Project',
      projectCode: 'TCP-001',
      address: '123 Test Street, Singapore',
      companyId: 1,
      latitude: 1.3521,
      longitude: 103.8198,
      geofenceRadius: 100,
      geofence: {
        center: {
          latitude: 1.3521,
          longitude: 103.8198
        },
        radius: 100,
        strictMode: true,
        allowedVariance: 10
      }
    });

    // Create test task
    const task = await Task.create({
      id: 9990,
      taskName: 'Test Task - Foundation Work',
      taskType: 'WORK',
      description: 'Complete foundation work for building A',
      projectId: 9990,
      companyId: 1
    });

    console.log('✅ Test data created');

    // Test 1: Task Assignment API (this should trigger notifications)
    console.log('\n🧪 Test 1: Task Assignment API');
    try {
      const assignResponse = await axios.post(`${API_BASE}/supervisor/assign-task`, {
        employeeId: 9991,
        projectId: 9990,
        taskIds: [9990],
        date: new Date().toISOString().split('T')[0]
      }, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Task assignment API response:', assignResponse.data);
    } catch (error) {
      console.log('❌ Task assignment API error:', error.response?.data || error.message);
    }

    // Test 2: Task Modification API
    console.log('\n🧪 Test 2: Task Modification API');
    try {
      const assignment = await WorkerTaskAssignment.findOne({ employeeId: 9991 });
      if (assignment) {
        const modifyResponse = await axios.put(`${API_BASE}/supervisor/update-assignment`, {
          assignmentId: assignment.id,
          changes: {
            priority: 'high',
            workArea: 'Building A - Foundation',
            dailyTarget: {
              description: 'Complete 50% of foundation work',
              quantity: 10,
              unit: 'cubic meters'
            }
          }
        }, {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Task modification API response:', modifyResponse.data);
      } else {
        console.log('❌ No assignment found for modification test');
      }
    } catch (error) {
      console.log('❌ Task modification API error:', error.response?.data || error.message);
    }

    // Test 3: Overtime Instructions API
    console.log('\n🧪 Test 3: Overtime Instructions API');
    try {
      const overtimeResponse = await axios.post(`${API_BASE}/supervisor/overtime-instructions`, {
        workerIds: [9991],
        projectId: 9990,
        overtimeDetails: {
          taskId: 9990,
          startTime: '18:00',
          endTime: '22:00',
          duration: '4 hours',
          reason: 'Critical deadline - foundation must be completed by tomorrow',
          compensation: '1.5x overtime rate'
        }
      }, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Overtime instructions API response:', overtimeResponse.data);
    } catch (error) {
      console.log('❌ Overtime instructions API error:', error.response?.data || error.message);
    }

    // Test 4: Daily Targets Update API
    console.log('\n🧪 Test 4: Daily Targets Update API');
    try {
      const assignment = await WorkerTaskAssignment.findOne({ employeeId: 9991 });
      if (assignment) {
        const targetsResponse = await axios.put(`${API_BASE}/supervisor/daily-targets`, {
          assignmentUpdates: [{
            assignmentId: assignment.id,
            dailyTarget: {
              description: 'Updated target - Complete foundation work',
              quantity: 15,
              unit: 'cubic meters',
              targetCompletion: 100
            }
          }]
        }, {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Daily targets update API response:', targetsResponse.data);
      } else {
        console.log('❌ No assignment found for daily targets test');
      }
    } catch (error) {
      console.log('❌ Daily targets update API error:', error.response?.data || error.message);
    }

    // Test 5: Worker Task Start (should trigger status change notification)
    console.log('\n🧪 Test 5: Worker Task Start API');
    try {
      const assignment = await WorkerTaskAssignment.findOne({ employeeId: 9991 });
      if (assignment) {
        const startResponse = await axios.post(`${API_BASE}/worker/task/start`, {
          assignmentId: assignment.id,
          location: {
            latitude: 1.3521,
            longitude: 103.8198,
            accuracy: 5
          }
        }, {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Task start API response:', startResponse.data);
      } else {
        console.log('❌ No assignment found for task start test');
      }
    } catch (error) {
      console.log('❌ Task start API error:', error.response?.data || error.message);
    }

    // Verify notifications were created
    console.log('\n📊 Verifying created notifications...');
    const notifications = await WorkerNotification.find({
      $or: [
        { recipientId: 9991 }, // Worker notifications
        { recipientId: 9990 }  // Supervisor notifications
      ]
    }).sort({ createdAt: -1 });

    console.log(`✅ Found ${notifications.length} notifications:`);
    notifications.forEach((notification, index) => {
      console.log(`${index + 1}. Type: ${notification.type}, Priority: ${notification.priority}, Title: "${notification.title}", Recipient: ${notification.recipientId}`);
    });

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await WorkerTaskAssignment.deleteMany({ id: { $gte: 9990 } });
    await Employee.deleteMany({ id: { $gte: 9990 } });
    await Project.deleteMany({ id: { $gte: 9990 } });
    await Task.deleteMany({ id: { $gte: 9990 } });
    await WorkerNotification.deleteMany({ recipientId: { $gte: 9990 } });

    console.log('✅ All API tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testTaskNotificationAPI();