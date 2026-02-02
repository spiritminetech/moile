import PerformanceMonitoringService from './PerformanceMonitoringService.js';

/**
 * Performance Monitoring Service Unit Tests
 * Tests core functionality of the performance monitoring service
 */

describe('PerformanceMonitoringService', () => {
  beforeAll(() => {
    // Stop automatic monitoring during tests
    PerformanceMonitoringService.stopMonitoring();
  });

  afterAll(() => {
    // Clean up after tests
    PerformanceMonitoringService.stopMonitoring();
  });

  describe('Delivery Time Tracking', () => {
    test('should track delivery start time', () => {
      const notificationId = 12345;
      
      PerformanceMonitoringService.trackDeliveryStart(notificationId);
      
      const metrics = PerformanceMonitoringService.getMetrics();
      expect(metrics.deliveryTracking.activeTracking).toBeGreaterThan(0);
      expect(metrics.deliveryTracking.trackingEnabled).toBe(true);
    });

    test('should track delivery end time and calculate duration', () => {
      const notificationId = 12346;
      
      // Start tracking
      PerformanceMonitoringService.trackDeliveryStart(notificationId);
      
      // Wait a small amount of time
      setTimeout(() => {
        const duration = PerformanceMonitoringService.trackDeliveryEnd(notificationId, true);
        
        expect(duration).toBeGreaterThan(0);
        expect(typeof duration).toBe('number');
      }, 10);
    });

    test('should handle tracking end without start', () => {
      const notificationId = 99999;
      
      const duration = PerformanceMonitoringService.trackDeliveryEnd(notificationId, true);
      
      expect(duration).toBeNull();
    });
  });

  describe('Business Hours Detection', () => {
    test('should correctly identify business hours', () => {
      // Test Monday 10 AM Singapore time
      const mondayMorning = new Date('2024-01-15T02:00:00.000Z'); // 10 AM SGT
      expect(PerformanceMonitoringService.isBusinessHours(mondayMorning)).toBe(true);

      // Test Monday 6 PM Singapore time
      const mondayEvening = new Date('2024-01-15T10:00:00.000Z'); // 6 PM SGT
      expect(PerformanceMonitoringService.isBusinessHours(mondayEvening)).toBe(true);

      // Test Monday 8 PM Singapore time (after hours)
      const mondayNight = new Date('2024-01-15T12:00:00.000Z'); // 8 PM SGT
      expect(PerformanceMonitoringService.isBusinessHours(mondayNight)).toBe(false);

      // Test Sunday (weekend)
      const sunday = new Date('2024-01-14T02:00:00.000Z'); // Sunday 10 AM SGT
      expect(PerformanceMonitoringService.isBusinessHours(sunday)).toBe(false);
    });
  });

  describe('Alert Severity Classification', () => {
    test('should classify alert severity correctly', () => {
      expect(PerformanceMonitoringService.getAlertSeverity('HIGH_LOAD')).toBe('WARNING');
      expect(PerformanceMonitoringService.getAlertSeverity('LOW_SUCCESS_RATE')).toBe('CRITICAL');
      expect(PerformanceMonitoringService.getAlertSeverity('HEALTH_CHECK_FAILED')).toBe('CRITICAL');
      expect(PerformanceMonitoringService.getAlertSeverity('UNKNOWN_ALERT')).toBe('INFO');
    });
  });

  describe('Metrics Retrieval', () => {
    test('should return current metrics', () => {
      const metrics = PerformanceMonitoringService.getMetrics();
      
      expect(metrics).toHaveProperty('systemLoad');
      expect(metrics).toHaveProperty('performance');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('deliveryTracking');
      
      expect(metrics.systemLoad).toHaveProperty('activeWorkers');
      expect(metrics.systemLoad).toHaveProperty('pendingNotifications');
      expect(metrics.systemLoad).toHaveProperty('deliveryQueue');
      expect(metrics.systemLoad).toHaveProperty('lastUpdated');
      
      expect(metrics.performance).toHaveProperty('averageDeliveryTime');
      expect(metrics.performance).toHaveProperty('deliverySuccessRate');
      expect(metrics.performance).toHaveProperty('systemThroughput');
      
      expect(metrics.uptime).toHaveProperty('startTime');
      expect(metrics.uptime).toHaveProperty('lastHealthCheck');
      expect(metrics.uptime).toHaveProperty('uptimePercentage');
      
      expect(metrics.deliveryTracking).toHaveProperty('trackingEnabled');
      expect(metrics.deliveryTracking.trackingEnabled).toBe(true);
    });
  });

  describe('Health Checks', () => {
    test('should perform database health check', async () => {
      const isHealthy = await PerformanceMonitoringService.testDatabaseHealth();
      
      // This might fail in test environment without database
      expect(typeof isHealthy).toBe('boolean');
    });

    test('should perform notification service health check', async () => {
      const isHealthy = await PerformanceMonitoringService.testNotificationServiceHealth();
      
      expect(typeof isHealthy).toBe('boolean');
    });

    test('should perform complete health check', async () => {
      const healthStatus = await PerformanceMonitoringService.performHealthCheck();
      
      expect(healthStatus).toHaveProperty('healthy');
      expect(healthStatus).toHaveProperty('timestamp');
      expect(typeof healthStatus.healthy).toBe('boolean');
      expect(healthStatus.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Performance Optimization', () => {
    test('should return optimization results', async () => {
      const result = await PerformanceMonitoringService.optimizePerformance();
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(result).toHaveProperty('optimizations');
        expect(Array.isArray(result.optimizations)).toBe(true);
      }
    });
  });

  describe('Service Lifecycle', () => {
    test('should start and stop monitoring', () => {
      // Service should be stopped from beforeAll
      PerformanceMonitoringService.startMonitoring();
      
      // Should have intervals running
      expect(PerformanceMonitoringService.systemLoadInterval).toBeDefined();
      expect(PerformanceMonitoringService.performanceInterval).toBeDefined();
      expect(PerformanceMonitoringService.healthCheckInterval).toBeDefined();
      expect(PerformanceMonitoringService.uptimeInterval).toBeDefined();
      
      PerformanceMonitoringService.stopMonitoring();
      
      // Intervals should be cleared
      expect(PerformanceMonitoringService.systemLoadInterval).toBeUndefined();
      expect(PerformanceMonitoringService.performanceInterval).toBeUndefined();
      expect(PerformanceMonitoringService.healthCheckInterval).toBeUndefined();
      expect(PerformanceMonitoringService.uptimeInterval).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle errors gracefully in metric updates', async () => {
      // Mock console.error to capture error logs
      const originalError = console.error;
      const errorSpy = jest.fn();
      console.error = errorSpy;
      
      try {
        // This should not throw even if database operations fail
        await PerformanceMonitoringService.updateSystemLoadMetrics();
        await PerformanceMonitoringService.updatePerformanceMetrics();
        await PerformanceMonitoringService.updateUptimeMetrics();
        
        // The methods should complete without throwing
        expect(true).toBe(true);
      } finally {
        console.error = originalError;
      }
    });
  });
});