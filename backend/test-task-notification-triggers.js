import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TaskNotificationService from './src/modules/notification/services/TaskNotificationService.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import Task from './src/modules/task/Task.js';
import WorkerNotification from './src/modules/notification/models/Notification.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system';

async function testTaskNotificationTriggers() {
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

    // Test 1: Task Assignment Notification
    console.log('\n🧪 Test 1: Task Assignment Notification');
    const assignments = [{
      id: 9990,
      employeeId: 9991,
      projectId: 9990,
      taskId: 9990,
      date: new Date().toISOString().split('T')[0],
      status: 'queued',
      sequence: 1,
      createdAt: new Date()
    }];

    const createdAssignments = await WorkerTaskAssignment.insertMany(assignments);
    const assignmentResult = await TaskNotificationService.notifyTaskAssignment(createdAssignments, 9990);
    
    console.log('Assignment notification result:', JSON.stringify(assignmentResult, null, 2));

    // Test 2: Task Modification Notification
    console.log('\n🧪 Test 2: Task Modification Notification');
    const assignment = createdAssignments[0];
    const changes = {
      priority: 'high',
      workArea: 'Building A - Foundation',
      dailyTarget: {
        description: 'Complete 50% of foundation work',
        quantity: 10,
        unit: 'cubic meters'
      }
    };

    const modificationResult = await TaskNotificationService.notifyTaskModification(assignment, changes, 9990);
    console.log('Modification notification result:', JSON.stringify(modificationResult, null, 2));

    // Test 3: Overtime Instructions Notification
    console.log('\n🧪 Test 3: Overtime Instructions Notification');
    const overtimeDetails = {
      taskId: 9990, // Include taskId for overtime instructions
      projectId: 9990,
      startTime: '18:00',
      endTime: '22:00',
      duration: '4 hours',
      reason: 'Critical deadline - foundation must be completed by tomorrow',
      compensation: '1.5x overtime rate'
    };

    const overtimeResult = await TaskNotificationService.notifyOvertimeInstructions([9991], overtimeDetails, 9990);
    console.log('Overtime notification result:', JSON.stringify(overtimeResult, null, 2));

    // Test 4: Daily Target Update Notification
    console.log('\n🧪 Test 4: Daily Target Update Notification');
    assignment.dailyTarget = {
      description: 'Updated target - Complete foundation work',
      quantity: 15,
      unit: 'cubic meters',
      targetCompletion: 100
    };

    const targetUpdateResult = await TaskNotificationService.notifyDailyTargetUpdate([assignment], 9990);
    console.log('Daily target update notification result:', JSON.stringify(targetUpdateResult, null, 2));

    // Test 5: Task Status Change Notification
    console.log('\n🧪 Test 5: Task Status Change Notification');
    const statusChangeResult = await TaskNotificationService.notifyTaskStatusChange(
      assignment, 
      'queued', 
      'in_progress', 
      9990
    );
    console.log('Status change notification result:', JSON.stringify(statusChangeResult, null, 2));

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

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testTaskNotificationTriggers();