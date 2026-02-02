import fc from 'fast-check';
import mongoose from 'mongoose';
import NotificationService from './NotificationService.js';
import WorkerNotification from '../models/Notification.js';
import NotificationAudit from '../models/NotificationAudit.js';
import appConfig from '../../../config/app.config.js';

console.log('🔍 Property test module loaded, checking execution context...');
console.log('📄 import.meta.url:', import.meta.url);
console.log('📄 process.argv[1]:', process.argv[1]);
console.log('📄 file URL:', `file://${process.argv[1]}`);

/**
 * Property-Based Tests for Daily Notification Limits
 * Feature: worker-mobile-notifications, Property 11: Daily Notification Limits
 * **Validates: Requirements 5.5**
 * 
 * Property: For any worker, the total number of notifications received in a 24-hour period 
 * should not exceed 10 to prevent notification fatigue (except for CRITICAL notifications)
 */

async function connectToDatabase() {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log('🔌 Connecting to database...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_test', {
        dbName: 'erp_test'
      });
      console.log('✅ Connected to test database');
    } else {
      console.log('✅ Already connected to database');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

async function cleanup() {
  try {
    // More thorough cleanup
    await WorkerNotification.deleteMany({ recipientId: { $gte: 10000 } });
    await NotificationAudit.deleteMany({ workerId: { $gte: 10000 } });
    
    // Wait a bit to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log('🧹 Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

/**
 * Property Test: Daily Notification Limits Enforcement
 * Tests that non-critical notifications are blocked after reaching daily limit
 */
async function testDailyNotificationLimitsProperty() {
  console.log('\n🧪 Running Property Test: Daily Notification Limits Enforcement');
  
  const property = fc.asyncProperty(
    // Generate test data with unique worker IDs to avoid conflicts
    fc.record({
      workerIdSeed: fc.integer({ min: 1, max: 9999 }), // Use this to generate unique worker IDs
      senderId: fc.integer({ min: 1, max: 100 }),
      notificationsToCreate: fc.integer({ min: 8, max: 15 }), // Test around the limit
      notificationType: fc.constantFrom('TASK_UPDATE', 'ATTENDANCE_ALERT', 'APPROVAL_STATUS'),
      priority: fc.constantFrom('HIGH', 'NORMAL', 'LOW') // Non-critical priorities
    }),
    
    async ({ workerIdSeed, senderId, notificationsToCreate, notificationType, priority }) => {
      // Generate a unique worker ID for this test iteration
      const workerId = 10000 + (workerIdSeed * 1000) + Math.floor(Math.random() * 1000);
      
      // Clean up any existing notifications for this worker (more thorough cleanup)
      await WorkerNotification.deleteMany({ recipientId: workerId });
      await NotificationAudit.deleteMany({ workerId });
      
      // Wait a bit to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 10));

      const dailyLimit = appConfig.notification.dailyLimit;
      let successfulCreations = 0;
      let blockedCreations = 0;

      // Verify we start with a clean slate
      const initialCount = await WorkerNotification.countDailyNotifications(workerId);
      if (initialCount !== 0) {
        throw new Error(`Expected clean slate for worker ${workerId}, found ${initialCount} existing notifications`);
      }

      // Create notifications up to and beyond the daily limit
      for (let i = 1; i <= notificationsToCreate; i++) {
        const notificationData = {
          type: notificationType,
          priority: priority,
          title: `Test Notification ${i}`,
          message: `Test message for notification ${i}`,
          senderId: senderId,
          recipients: [workerId],
          actionData: getActionDataForType(notificationType)
        };

        const result = await NotificationService.createNotification(notificationData);

        if (result.success && result.created > 0) {
          successfulCreations++;
        } else if (result.success && result.skipped > 0) {
          blockedCreations++;
          
          // Verify the skip reason is daily limit exceeded
          if (result.skippedRecipients.length !== 1) {
            throw new Error(`Expected 1 skipped recipient, got ${result.skippedRecipients.length}`);
          }
          if (result.skippedRecipients[0].reason !== 'DAILY_LIMIT_EXCEEDED') {
            throw new Error(`Expected DAILY_LIMIT_EXCEEDED, got ${result.skippedRecipients[0].reason}`);
          }
          if (result.skippedRecipients[0].dailyCount !== dailyLimit) {
            throw new Error(`Expected dailyCount ${dailyLimit}, got ${result.skippedRecipients[0].dailyCount}`);
          }
        } else if (!result.success) {
          throw new Error(`Notification creation failed unexpectedly: ${JSON.stringify(result)}`);
        }
      }

      // Property assertions
      // 1. Successful creations should not exceed daily limit
      if (successfulCreations > dailyLimit) {
        throw new Error(`Successful creations ${successfulCreations} exceeded daily limit ${dailyLimit}`);
      }
      
      // 2. If we tried to create more than the limit, some should be blocked
      if (notificationsToCreate > dailyLimit) {
        if (blockedCreations === 0) {
          throw new Error(`Expected some blocked creations when trying to create ${notificationsToCreate} > ${dailyLimit}, but got 0 blocked`);
        }
        if (successfulCreations + blockedCreations !== notificationsToCreate) {
          throw new Error(`Total processed ${successfulCreations + blockedCreations} != requested ${notificationsToCreate}`);
        }
      }

      // 3. Total notifications in database should not exceed daily limit
      const totalInDb = await WorkerNotification.countDailyNotifications(workerId);
      if (totalInDb > dailyLimit) {
        throw new Error(`Total in DB ${totalInDb} exceeded daily limit ${dailyLimit}`);
      }

      // 4. Verify audit records exist for blocked notifications
      if (blockedCreations > 0) {
        const auditCount = await NotificationAudit.countDocuments({
          workerId,
          event: 'FAILED',
          'metadata.reason': 'DAILY_LIMIT_EXCEEDED'
        });
        if (auditCount !== blockedCreations) {
          throw new Error(`Expected ${blockedCreations} audit records, got ${auditCount}`);
        }
      }

      console.log(`✅ Property verified: Worker ${workerId}, created ${successfulCreations}/${notificationsToCreate}, blocked ${blockedCreations}`);
    }
  );

  try {
    await fc.assert(property, { 
      numRuns: 10, // Run 10 iterations for testing
      timeout: 30000 // 30 second timeout per test
    });
    console.log('✅ Property Test PASSED: Daily Notification Limits Enforcement');
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Property Test FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Property Test: Critical Notifications Bypass Daily Limits
 * Tests that CRITICAL notifications are never blocked by daily limits
 */
async function testCriticalNotificationsBypassProperty() {
  console.log('\n🧪 Running Property Test: Critical Notifications Bypass Limits');
  
  const property = fc.asyncProperty(
    // Generate test data with unique worker IDs
    fc.record({
      workerIdSeed: fc.integer({ min: 1, max: 9999 }), // Use this to generate unique worker IDs
      senderId: fc.integer({ min: 1, max: 100 }),
      normalNotifications: fc.integer({ min: 10, max: 12 }), // At or above limit
      criticalNotifications: fc.integer({ min: 1, max: 3 }) // Additional critical notifications
    }),
    
    async ({ workerIdSeed, senderId, normalNotifications, criticalNotifications }) => {
      // Generate a unique worker ID for this test iteration
      const workerId = 20000 + (workerIdSeed * 1000) + Math.floor(Math.random() * 1000);
      
      // Clean up any existing notifications for this worker
      await WorkerNotification.deleteMany({ recipientId: workerId });
      await NotificationAudit.deleteMany({ workerId });

      const dailyLimit = appConfig.notification.dailyLimit;

      // First, create normal notifications up to the limit
      for (let i = 1; i <= normalNotifications; i++) {
        const notificationData = {
          type: 'TASK_UPDATE',
          priority: 'NORMAL',
          title: `Normal Notification ${i}`,
          message: `Normal test message ${i}`,
          senderId: senderId,
          recipients: [workerId],
          actionData: {
            taskId: `task-${i}`,
            projectId: 'test-project',
            supervisorContact: 'test-supervisor'
          }
        };

        await NotificationService.createNotification(notificationData);
      }

      // Verify we're at or above the limit
      const countAfterNormal = await WorkerNotification.countDailyNotifications(workerId);
      const shouldBeAtLimit = Math.min(normalNotifications, dailyLimit);
      if (countAfterNormal !== shouldBeAtLimit) {
        throw new Error(`Expected ${shouldBeAtLimit} notifications after normal creation, got ${countAfterNormal}`);
      }

      // Now create critical notifications - these should all succeed
      let criticalSuccesses = 0;
      for (let i = 1; i <= criticalNotifications; i++) {
        const criticalData = {
          type: 'SITE_CHANGE',
          priority: 'CRITICAL',
          title: `Critical Alert ${i}`,
          message: `Critical safety alert ${i}`,
          senderId: senderId,
          recipients: [workerId],
          actionData: {
            newLocation: `Emergency Site ${i}`,
            coordinates: { latitude: 1.3521, longitude: 103.8198 },
            supervisorContact: 'emergency-supervisor'
          },
          requiresAcknowledgment: true
        };

        const result = await NotificationService.createNotification(criticalData);
        
        // Property assertion: Critical notifications should always succeed
        if (!result.success) {
          throw new Error(`Critical notification ${i} failed to create`);
        }
        if (result.created !== 1) {
          throw new Error(`Expected 1 critical notification created, got ${result.created}`);
        }
        if (result.skipped !== 0) {
          throw new Error(`Expected 0 skipped critical notifications, got ${result.skipped}`);
        }
        
        if (result.success && result.created > 0) {
          criticalSuccesses++;
        }
      }

      // Final property assertions
      // 1. All critical notifications should have been created
      if (criticalSuccesses !== criticalNotifications) {
        throw new Error(`Expected ${criticalNotifications} critical successes, got ${criticalSuccesses}`);
      }

      // 2. Total count should be normal notifications (up to limit) + all critical notifications
      const finalCount = await WorkerNotification.countDailyNotifications(workerId);
      const expectedCount = shouldBeAtLimit + criticalNotifications;
      if (finalCount !== expectedCount) {
        throw new Error(`Expected final count ${expectedCount}, got ${finalCount}`);
      }

      // 3. Critical notifications should exceed the daily limit if normal notifications filled it
      if (normalNotifications >= dailyLimit && finalCount <= dailyLimit) {
        throw new Error(`Expected final count ${finalCount} to exceed daily limit ${dailyLimit}`);
      }

      // 4. Verify critical notifications exist in database
      const criticalCount = await WorkerNotification.countDocuments({
        recipientId: workerId,
        priority: 'CRITICAL',
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      });
      if (criticalCount !== criticalNotifications) {
        throw new Error(`Expected ${criticalNotifications} critical notifications in DB, got ${criticalCount}`);
      }

      console.log(`✅ Property verified: Worker ${workerId}, normal ${shouldBeAtLimit}, critical ${criticalSuccesses}, total ${finalCount}`);
    }
  );

  try {
    await fc.assert(property, { 
      numRuns: 8, // Run 8 iterations for testing
      timeout: 30000 // 30 second timeout per test
    });
    console.log('✅ Property Test PASSED: Critical Notifications Bypass Limits');
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Property Test FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Helper function to generate appropriate action data for different notification types
 */
function getActionDataForType(type) {
  switch (type) {
    case 'TASK_UPDATE':
      return {
        taskId: 'test-task-123',
        projectId: 'test-project',
        supervisorContact: 'test-supervisor'
      };
    case 'SITE_CHANGE':
      return {
        newLocation: 'Test Site B',
        coordinates: { latitude: 1.3521, longitude: 103.8198 },
        supervisorContact: 'test-supervisor'
      };
    case 'ATTENDANCE_ALERT':
      return {
        alertType: 'MISSED_LOGIN',
        timestamp: new Date().toISOString()
      };
    case 'APPROVAL_STATUS':
      return {
        referenceNumber: 'REF-123',
        approvalType: 'LEAVE_REQUEST',
        status: 'APPROVED',
        nextSteps: 'Check your schedule'
      };
    default:
      return {};
  }
}

/**
 * Main test runner
 */
async function runPropertyTests() {
  console.log('🧪 Starting Property-Based Tests for Daily Notification Limits');
  console.log('================================================================');

  try {
    await connectToDatabase();
    await cleanup();

    const results = [];

    // Run property tests
    results.push(await testDailyNotificationLimitsProperty());
    results.push(await testCriticalNotificationsBypassProperty());

    // Summary
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log('\n📊 Property Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      results.filter(r => !r.success).forEach((result, index) => {
        console.log(`${index + 1}. ${result.error}`);
      });
    }

    return { passed, failed, success: failed === 0 };

  } catch (error) {
    console.error('💥 Property test execution failed:', error);
    return { passed: 0, failed: 1, success: false, error: error.message };
  } finally {
    await cleanup();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from database');
    }
  }
}

// Run the tests if this file is executed directly
const isMainModule = import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`;
console.log('🔍 Is main module?', isMainModule);

if (isMainModule) {
  console.log('🚀 Starting property-based test execution...');
  runPropertyTests().then(results => {
    console.log('🏁 Test execution completed:', results);
    process.exit(results.success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
} else {
  console.log('📦 Module imported, not executing tests');
}

export { runPropertyTests };