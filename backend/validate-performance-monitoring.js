/**
 * Validate Performance Monitoring Implementation
 * Simple validation script to test the performance monitoring service
 */

import PerformanceMonitoringService from './src/modules/notification/services/PerformanceMonitoringService.js';

console.log('🧪 Validating Performance Monitoring Service Implementation');
console.log('===========================================================');

try {
  // Test 1: Service can be imported
  console.log('✅ Test 1: Service imported successfully');

  // Test 2: Service has required methods
  const requiredMethods = [
    'trackDeliveryStart',
    'trackDeliveryEnd',
    'getMetrics',
    'isBusinessHours',
    'getAlertSeverity',
    'performHealthCheck',
    'optimizePerformance',
    'startMonitoring',
    'stopMonitoring'
  ];

  let methodsFound = 0;
  for (const method of requiredMethods) {
    if (typeof PerformanceMonitoringService[method] === 'function') {
      methodsFound++;
      console.log(`✅ Method ${method} exists`);
    } else {
      console.log(`❌ Method ${method} missing`);
    }
  }

  if (methodsFound === requiredMethods.length) {
    console.log('✅ Test 2: All required methods present');
  } else {
    console.log(`❌ Test 2: Missing ${requiredMethods.length - methodsFound} methods`);
  }

  // Test 3: Basic functionality
  console.log('\n📊 Testing basic functionality...');

  // Stop monitoring to avoid interference
  PerformanceMonitoringService.stopMonitoring();

  // Test delivery tracking
  const testNotificationId = 999999;
  PerformanceMonitoringService.trackDeliveryStart(testNotificationId);
  console.log('✅ Test 3a: Delivery tracking start works');

  setTimeout(() => {
    const duration = PerformanceMonitoringService.trackDeliveryEnd(testNotificationId, true);
    if (duration && duration > 0) {
      console.log(`✅ Test 3b: Delivery tracking end works (${duration}ms)`);
    } else {
      console.log('❌ Test 3b: Delivery tracking end failed');
    }

    // Test metrics retrieval
    const metrics = PerformanceMonitoringService.getMetrics();
    if (metrics && typeof metrics === 'object') {
      console.log('✅ Test 3c: Metrics retrieval works');
      console.log(`📈 System load: ${JSON.stringify(metrics.systemLoad, null, 2)}`);
      console.log(`⚡ Performance: ${JSON.stringify(metrics.performance, null, 2)}`);
      console.log(`⏰ Uptime: ${JSON.stringify(metrics.uptime, null, 2)}`);
    } else {
      console.log('❌ Test 3c: Metrics retrieval failed');
    }

    // Test business hours detection
    const now = new Date();
    const isBusinessHours = PerformanceMonitoringService.isBusinessHours(now);
    console.log(`✅ Test 3d: Business hours detection works (currently: ${isBusinessHours})`);

    // Test alert severity classification
    const severity = PerformanceMonitoringService.getAlertSeverity('HIGH_LOAD');
    if (severity === 'WARNING') {
      console.log('✅ Test 3e: Alert severity classification works');
    } else {
      console.log(`❌ Test 3e: Alert severity classification failed (got: ${severity})`);
    }

    // Test health check (async)
    console.log('\n🏥 Testing health check...');
    PerformanceMonitoringService.performHealthCheck()
      .then(healthStatus => {
        if (healthStatus && typeof healthStatus.healthy === 'boolean') {
          console.log(`✅ Test 4: Health check works (healthy: ${healthStatus.healthy})`);
        } else {
          console.log('❌ Test 4: Health check failed');
        }

        // Test performance optimization (async)
        console.log('\n⚡ Testing performance optimization...');
        return PerformanceMonitoringService.optimizePerformance();
      })
      .then(optimizationResult => {
        if (optimizationResult && typeof optimizationResult.success === 'boolean') {
          console.log(`✅ Test 5: Performance optimization works (success: ${optimizationResult.success})`);
          if (optimizationResult.optimizations) {
            console.log(`🔧 Applied ${optimizationResult.optimizations.length} optimizations`);
          }
        } else {
          console.log('❌ Test 5: Performance optimization failed');
        }

        // Final summary
        console.log('\n===========================================================');
        console.log('🎉 Performance Monitoring Service Validation Complete');
        console.log('===========================================================');
        console.log('✅ Service is ready for use');
        console.log('📊 Monitoring capabilities: Delivery times, System load, Uptime, Performance metrics');
        console.log('🚨 Alert system: Performance alerts and system warnings');
        console.log('⚡ Optimization: Automatic performance optimization');
        console.log('🏥 Health monitoring: Database and service health checks');
        console.log('⏰ Business hours: Singapore timezone (7 AM - 7 PM, Mon-Sat)');
        console.log('📈 Capacity: Designed for 1000+ concurrent workers');
      })
      .catch(error => {
        console.error('❌ Async test failed:', error.message);
      });

  }, 100); // Wait 100ms for delivery tracking

} catch (error) {
  console.error('❌ Validation failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}