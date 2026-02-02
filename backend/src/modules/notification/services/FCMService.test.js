import FCMService from './FirebaseService.js';
import DeviceToken from '../models/DeviceToken.js';
import NotificationAudit from '../models/NotificationAudit.js';

/**
 * FCMService Tests
 * Tests for Firebase Cloud Messaging service with device token management,
 * validation, and retry logic.
 */

describe('FCMService', () => {
  beforeEach(() => {
    // Reset circuit breaker state
    FCMService.resetCircuitBreaker();
  });

  describe('Device Token Validation', () => {
    test('should validate correct FCM token format', () => {
      const validToken = 'c1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(FCMService.validateDeviceToken(validToken)).toBe(true);
    });

    test('should reject invalid FCM token formats', () => {
      expect(FCMService.validateDeviceToken('')).toBe(false);
      expect(FCMService.validateDeviceToken('short')).toBe(false);
      expect(FCMService.validateDeviceToken('invalid@characters!')).toBe(false);
      expect(FCMService.validateDeviceToken(null)).toBe(false);
      expect(FCMService.validateDeviceToken(undefined)).toBe(false);
    });

    test('should validate token registration data', () => {
      const validData = {
        workerId: 123,
        deviceToken: 'c1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        platform: 'android',
        appVersion: '1.0.0',
        osVersion: '11.0'
      };

      const result = FCMService.validateTokenRegistrationData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid token registration data', () => {
      const invalidData = {
        workerId: 'invalid',
        deviceToken: '',
        platform: 'windows',
        appVersion: '',
        osVersion: ''
      };

      const result = FCMService.validateTokenRegistrationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Priority and Configuration', () => {
    test('should return correct Android priority for notification priorities', () => {
      expect(FCMService.getAndroidPriority('CRITICAL')).toBe('high');
      expect(FCMService.getAndroidPriority('HIGH')).toBe('high');
      expect(FCMService.getAndroidPriority('NORMAL')).toBe('normal');
      expect(FCMService.getAndroidPriority('LOW')).toBe('normal');
    });

    test('should return correct APNS priority for notification priorities', () => {
      expect(FCMService.getApnsPriority('CRITICAL')).toBe('10');
      expect(FCMService.getApnsPriority('HIGH')).toBe('10');
      expect(FCMService.getApnsPriority('NORMAL')).toBe('5');
      expect(FCMService.getApnsPriority('LOW')).toBe('5');
    });

    test('should return correct notification colors', () => {
      expect(FCMService.getNotificationColor('CRITICAL')).toBe('#FF0000');
      expect(FCMService.getNotificationColor('HIGH')).toBe('#FF8C00');
      expect(FCMService.getNotificationColor('NORMAL')).toBe('#1890FF');
      expect(FCMService.getNotificationColor('LOW')).toBe('#8C8C8C');
    });

    test('should return correct notification channels', () => {
      expect(FCMService.getNotificationChannel('TASK_UPDATE')).toBe('task_updates');
      expect(FCMService.getNotificationChannel('SITE_CHANGE')).toBe('site_changes');
      expect(FCMService.getNotificationChannel('ATTENDANCE_ALERT')).toBe('attendance_alerts');
      expect(FCMService.getNotificationChannel('APPROVAL_STATUS')).toBe('approval_status');
      expect(FCMService.getNotificationChannel('UNKNOWN')).toBe('general');
    });
  });

  describe('Retry Logic', () => {
    test('should determine retry eligibility based on priority and attempt number', () => {
      // High priority allows 3 retries
      expect(FCMService.shouldRetryDelivery('HIGH', 1)).toBe(true);
      expect(FCMService.shouldRetryDelivery('HIGH', 2)).toBe(true);
      expect(FCMService.shouldRetryDelivery('HIGH', 3)).toBe(false);

      // Normal priority allows 1 retry
      expect(FCMService.shouldRetryDelivery('NORMAL', 1)).toBe(false);
      
      // Low priority allows 1 retry
      expect(FCMService.shouldRetryDelivery('LOW', 1)).toBe(false);
    });

    test('should calculate exponential backoff delays', () => {
      const delay1 = FCMService.calculateRetryDelay(1);
      const delay2 = FCMService.calculateRetryDelay(2);
      const delay3 = FCMService.calculateRetryDelay(3);

      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThanOrEqual(1100); // 1s + 10% jitter
      
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay2).toBeLessThanOrEqual(2200); // 2s + 10% jitter
      
      expect(delay3).toBeGreaterThanOrEqual(4000);
      expect(delay3).toBeLessThanOrEqual(4400); // 4s + 10% jitter
    });

    test('should cap retry delays at maximum', () => {
      const delay = FCMService.calculateRetryDelay(10); // Very high attempt number
      expect(delay).toBeLessThanOrEqual(33000); // 30s max + 10% jitter
    });
  });

  describe('Circuit Breaker', () => {
    test('should open circuit breaker after threshold failures', () => {
      expect(FCMService.isCircuitBreakerOpen()).toBe(false);

      // Record failures up to threshold
      for (let i = 0; i < 5; i++) {
        FCMService.recordCircuitBreakerFailure();
      }

      expect(FCMService.isCircuitBreakerOpen()).toBe(true);
    });

    test('should reset circuit breaker after timeout', (done) => {
      // Open circuit breaker
      for (let i = 0; i < 5; i++) {
        FCMService.recordCircuitBreakerFailure();
      }
      expect(FCMService.isCircuitBreakerOpen()).toBe(true);

      // Manually set timeout to very short for testing
      FCMService.circuitBreaker.timeout = 10; // 10ms
      
      setTimeout(() => {
        expect(FCMService.isCircuitBreakerOpen()).toBe(false);
        done();
      }, 15);
    });

    test('should reset circuit breaker manually', () => {
      // Open circuit breaker
      for (let i = 0; i < 5; i++) {
        FCMService.recordCircuitBreakerFailure();
      }
      expect(FCMService.isCircuitBreakerOpen()).toBe(true);

      FCMService.resetCircuitBreaker();
      expect(FCMService.isCircuitBreakerOpen()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle FCM-specific errors correctly', () => {
      const invalidTokenError = { code: 'messaging/invalid-registration-token', message: 'Invalid token' };
      const result = FCMService.handleFCMError(invalidTokenError, 'test-token', 1);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('MALFORMED_TOKEN');
      expect(result.shouldDeactivateToken).toBe(true);
      expect(result.shouldRetry).toBe(false);
    });

    test('should mark retryable errors for retry', () => {
      const retryableError = { code: 'messaging/internal-error', message: 'Internal error' };
      const result = FCMService.handleFCMError(retryableError, 'test-token', 1);
      
      expect(result.success).toBe(false);
      expect(result.shouldRetry).toBe(true);
      expect(result.shouldDeactivateToken).toBe(false);
    });

    test('should identify retryable error codes', () => {
      const retryableError = { code: 'messaging/server-unavailable' };
      const nonRetryableError = { code: 'messaging/sender-id-mismatch' };
      
      expect(FCMService.shouldRetryError(retryableError)).toBe(true);
      expect(FCMService.shouldRetryError(nonRetryableError)).toBe(false);
    });
  });

  describe('Health Status', () => {
    test('should return not initialized status when not initialized', async () => {
      // Create a new instance to test uninitialized state
      const uninitializedService = new (FCMService.constructor)();
      const status = await uninitializedService.getHealthStatus();
      
      expect(status.healthy).toBe(false);
      expect(status.status).toBe('not_initialized');
      expect(status.initialized).toBe(false);
    });

    test('should include circuit breaker status in health check', async () => {
      const status = await FCMService.getHealthStatus();
      
      expect(status.circuitBreaker).toBeDefined();
      expect(status.circuitBreaker.isOpen).toBeDefined();
      expect(status.circuitBreaker.failures).toBeDefined();
    });
  });
});