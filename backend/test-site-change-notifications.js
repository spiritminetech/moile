/**
 * Test Site Change Notification Triggers
 * Tests Requirements 2.1, 2.2, 2.3, 2.4 implementation
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/modules/project/models/Project.js';
import Employee from './src/modules/employee/Employee.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import SiteChangeNotificationService from './src/modules/notification/services/SiteChangeNotificationService.js';

// Load environment variables
dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function testLocationChangeNotification() {
  console.log('\n🧪 Testing Location Change Notification (Requirement 2.1)...');
  
  try {
    // Find a test worker
    const worker = await Employee.findOne({ status: 'ACTIVE' });
    if (!worker) {
      console.log('❌ No active worker found for testing');
      return;
    }

    // Find a test project
    const project = await Project.findOne();
    if (!project) {
      console.log('❌ No project found for testing');
      return;
    }

    const oldLocation = {
      latitude: 1.3521,
      longitude: 103.8198,
      address: "Old Location, Singapore"
    };

    const newLocation = {
      latitude: 1.3644,
      longitude: 103.9915,
      address: "New Location, Singapore"
    };

    const result = await SiteChangeNotificationService.notifyLocationChange(
      worker.id,
      oldLocation,
      newLocation,
      project.id
    );

    console.log('✅ Location change notification result:', result);
  } catch (error) {
    console.error('❌ Location change notification test failed:', error);
  }
}

async function testSupervisorReassignmentNotification() {
  console.log('\n🧪 Testing Supervisor Reassignment Notification (Requirement 2.2)...');
  
  try {
    // Find test workers
    const workers = await Employee.find({ status: 'ACTIVE' }).limit(2);
    if (workers.length < 2) {
      console.log('❌ Need at least 2 active workers for testing');
      return;
    }

    const worker = workers[0];
    const newSupervisor = workers[1];

    // Find a test project
    const project = await Project.findOne();
    if (!project) {
      console.log('❌ No project found for testing');
      return;
    }

    const result = await SiteChangeNotificationService.notifySupervisorReassignment(
      worker.id,
      999, // Old supervisor ID (fake)
      newSupervisor.id,
      project.id
    );

    console.log('✅ Supervisor reassignment notification result:', result);
  } catch (error) {
    console.error('❌ Supervisor reassignment notification test failed:', error);
  }
}

async function testGeofenceUpdateNotification() {
  console.log('\n🧪 Testing Geofence Update Notification (Requirement 2.3)...');
  
  try {
    // Find a test project
    const project = await Project.findOne();
    if (!project) {
      console.log('❌ No project found for testing');
      return;
    }

    // Find workers assigned to this project
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });

    const assignments = await WorkerTaskAssignment.find({
      projectId: project.id,
      date: today
    }).limit(3);

    if (assignments.length === 0) {
      console.log('❌ No worker assignments found for testing');
      return;
    }

    const affectedWorkerIds = assignments.map(a => a.employeeId);
    const geofenceChanges = {
      oldGeofence: {
        center: { latitude: 1.3521, longitude: 103.8198 },
        radius: 100,
        strictMode: true
      },
      newGeofence: {
        center: { latitude: 1.3644, longitude: 103.9915 },
        radius: 150,
        strictMode: false
      }
    };

    const result = await SiteChangeNotificationService.notifyGeofenceUpdate(
      project.id,
      affectedWorkerIds,
      geofenceChanges
    );

    console.log('✅ Geofence update notification result:', result);
  } catch (error) {
    console.error('❌ Geofence update notification test failed:', error);
  }
}

async function testTaskLocationChangeNotification() {
  console.log('\n🧪 Testing Task Location Change Notification (Requirement 2.4)...');
  
  try {
    // Find a test task assignment
    const assignment = await WorkerTaskAssignment.findOne();
    if (!assignment) {
      console.log('❌ No task assignment found for testing');
      return;
    }

    const oldTaskLocation = {
      workArea: "Building A",
      floor: "Ground Floor",
      zone: "Zone 1"
    };

    const newTaskLocation = {
      workArea: "Building B",
      floor: "Second Floor",
      zone: "Zone 3"
    };

    const result = await SiteChangeNotificationService.notifyTaskLocationChange(
      assignment.id,
      assignment.employeeId,
      oldTaskLocation,
      newTaskLocation
    );

    console.log('✅ Task location change notification result:', result);
  } catch (error) {
    console.error('❌ Task location change notification test failed:', error);
  }
}

async function testBatchSiteChangeNotifications() {
  console.log('\n🧪 Testing Batch Site Change Notifications...');
  
  try {
    // Find test data
    const worker = await Employee.findOne({ status: 'ACTIVE' });
    const project = await Project.findOne();
    const assignment = await WorkerTaskAssignment.findOne();

    if (!worker || !project || !assignment) {
      console.log('❌ Missing test data for batch notifications');
      return;
    }

    const batchNotifications = [
      {
        type: 'location_change',
        workerId: worker.id,
        oldLocation: { latitude: 1.3521, longitude: 103.8198, address: "Old Location" },
        newLocation: { latitude: 1.3644, longitude: 103.9915, address: "New Location" },
        projectId: project.id
      },
      {
        type: 'task_location_change',
        taskAssignmentId: assignment.id,
        workerId: assignment.employeeId,
        oldTaskLocation: { workArea: "Old Area", floor: "1st Floor", zone: "Zone A" },
        newTaskLocation: { workArea: "New Area", floor: "2nd Floor", zone: "Zone B" }
      }
    ];

    const result = await SiteChangeNotificationService.batchNotifySiteChanges(batchNotifications);
    console.log('✅ Batch site change notifications result:', result);
  } catch (error) {
    console.error('❌ Batch site change notifications test failed:', error);
  }
}

async function runTests() {
  console.log('🚀 Starting Site Change Notification Tests...');
  
  await connectDB();
  
  await testLocationChangeNotification();
  await testSupervisorReassignmentNotification();
  await testGeofenceUpdateNotification();
  await testTaskLocationChangeNotification();
  await testBatchSiteChangeNotifications();
  
  console.log('\n✅ Site Change Notification Tests Completed');
  
  await mongoose.connection.close();
  console.log('📝 Database connection closed');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});