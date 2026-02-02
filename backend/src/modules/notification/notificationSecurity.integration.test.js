import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../index.js';
import WorkerNotification from './models/Notification.js';
import User from '../user/User.js';
import CompanyUser from '../companyUser/CompanyUser.js';
import Employee from '../employee/Employee.js';
import SecurityUtil from '../../utils/securityUtil.js';

/**
 * Notification Security Integration Tests
 * Tests end-to-end security features for the notification system
 * Implements Requirements 9.1, 9.2, 9.3, 9.4 (JWT validation, permission-based filtering, encryption, access control)
 */

describe('Notification Security Integration Tests', () => {
  let workerToken, supervisorToken, adminToken;
  let workerUser, supervisorUser, adminUser;
  let testCompanyId = 1;

  beforeAll(async () => {
    // Create test users
    workerUser = {
      id: 1001,
      name: 'Test Worker',
      email: 'worker@test.com',
      isActive: true
    };

    supervisorUser = {
      id: 1002,
      name: 'Test Supervisor',
      email: 'supervisor@test.com',
      isActive: true
    };

    adminUser = {
      id: 1003,
      name: 'Test Admin',
      email: 'admin@test.com',
      isActive: true
    };

    // Mock database responses
    User.findOne = jest.fn().mockImplementation(({ id }) => {
      if (id === 1001) return Promise.resolve(workerUser);
      if (id === 1002) return Promise.resolve(supervisorUser);
      if (id === 1003) return Promise.resolve(adminUser);
      return Promise.resolve(null);
    });

    CompanyUser.findOne = jest.fn().mockImplementation(({ userId }) => {
      if ([1001, 1002, 1003].includes(userId)) {
        return Promise.resolve({ userId, companyId: testCompanyId });
      }
      return Promise.resolve(null);
    });

    Employee.findOne = jest.fn().mockImplementation(({ userId }) => {
      if ([1001, 1002, 1003].includes(userId)) {
        return Promise.resolve({ id: userId + 100, userId });
      }
      return Promise.resolve(null);
    });

    // Generate test tokens
    workerToken = jwt.sign(
      { 
        userId: 1001, 
        role: 'worker', 
        email: 'worker@test.com',
        companyId: testCompanyId 
      },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    supervisorToken = jwt.sign(
      { 
        userId: 1002, 
        role: 'supervisor', 
        email: 'supervisor@test.com',
        companyId: testCompanyId 
      },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { 
        userId: 1003, 
        role: 'admin', 
        email: 'admin@test.com',
        companyId: testCompanyId 
      },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT Token Validation (Requirement 9.1)', () => {
    test('should reject requests without authorization header', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid JWT token required for notification operations'
      });
    });

    test('should reject requests with invalid token format', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);

      expect(response.body.error).toBe('AUTHENTICATION_REQUIRED');
    });

    test('should reject expired tokens', async () => {
      const expiredToken = jwt.sign(
        { userId: 1001, role: 'worker' },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error).toBe('TOKEN_EXPIRED');
    });

    test('should reject tokens with invalid signature', async () => {
      const invalidToken = jwt.sign(
        { userId: 1001, role: 'worker' },
        'wrong_secret'
      );

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.error).toBe('INVALID_TOKEN');
    });

    test('should accept valid tokens', async () => {
      // Mock the notification query to avoid database dependency
      WorkerNotification.find = jest.fn().mockResolvedValue([]);
      WorkerNotification.countDocuments = jest.fn().mockResolvedValue(0);

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${workerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Permission-Based Access Control (Requirements 9.2, 9.4)', () => {
    beforeEach(() => {
      // Mock notification queries
      WorkerNotification.find = jest.fn().mockResolvedValue([]);
      WorkerNotification.countDocuments = jest.fn().mockResolvedValue(0);
      WorkerNotification.findOne = jest.fn().mockResolvedValue(null);
    });

    test('should allow workers to read their own notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${workerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.permissions.canReadAll).toBe(false);
    });

    test('should allow supervisors to read all notifications in their company', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.permissions.canReadAll).toBe(true);
    });

    test('should prevent workers from creating notifications', async () => {
      const notificationData = {
        type: 'TASK_UPDATE',
        priority: 'HIGH',
        recipients: ['1002'],
        title: 'Test notification',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${workerToken}`)
        .send(notificationData)
        .expect(403);

      expect(response.body.error).toBe('CREATE_PERMISSION_DENIED');
    });

    test('should allow supervisors to create notifications', async () => {
      // Mock notification creation
      const mockNotification = {
        id: 1,
        type: 'TASK_UPDATE',
        priority: 'HIGH',
        title: 'Test notification',
        message: 'Test message',
        recipientId: 1001,
        senderId: 1002,
        status: 'PENDING'
      };

      WorkerNotification.prototype.save = jest.fn().mockResolvedValue(mockNotification);
      WorkerNotification.findOne = jest.fn().mockResolvedValue(null);

      const notificationData = {
        type: 'TASK_UPDATE',
        priority: 'HIGH',
        recipients: ['1001'],
        title: 'Test notification',
        message: 'Test message'
      };

      // Mock NotificationService.createNotification
      const NotificationService = require('./services/NotificationService.js').default;
      NotificationService.createNotification = jest.fn().mockResolvedValue({
        created: 1,
        skipped: 0,
        notifications: [mockNotification],
        skippedRecipients: []
      });

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.created).toBe(1);
    });

    test('should prevent workers from viewing system health', async () => {
      const response = await request(app)
        .get('/api/notifications/health')
        .set('Authorization', `Bearer ${workerToken}`)
        .expect(403);

      expect(response.body.error).toBe('HEALTH_PERMISSION_DENIED');
    });

    test('should allow supervisors to view system health', async () => {
      // Mock FCMService health check
      const FCMService = require('./services/FirebaseService.js').default;
      FCMService.getHealthStatus = jest.fn().mockResolvedValue({
        status: 'healthy',
        uptime: 3600,
        circuitBreakerOpen: false
      });

      const response = await request(app)
        .get('/api/notifications/health')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('Input Sanitization and Validation', () => {
    test('should sanitize malicious content in notification creation', async () => {
      const maliciousData = {
        type: 'TASK_UPDATE',
        priority: 'HIGH',
        recipients: ['1001'],
        title: '<script>alert("xss")</script>Malicious Title',
        message: 'Click here: javascript:alert("malicious")'
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send(maliciousData)
        .expect(400);

      expect(response.body.error).toBe('INVALID_CONTENT');
      expect(response.body.details).toContain('Title contains potentially malicious content');
    });

    test('should reject notifications with excessive length', async () => {
      const longData = {
        type: 'TASK_UPDATE',
        priority: 'HIGH',
        recipients: ['1001'],
        title: 'A'.repeat(2000), // Exceeds limit
        message: 'B'.repeat(6000) // Exceeds limit
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send(longData)
        .expect(400);

      expect(response.body.error).toBe('INVALID_CONTENT');
      expect(response.body.details.some(error => error.includes('exceeds maximum'))).toBe(true);
    });

    test('should validate device registration data', async () => {
      const invalidDeviceData = {
        deviceToken: 'short', // Too short
        platform: 'invalid_platform', // Invalid platform
        appVersion: 'invalid_version' // Invalid format
      };

      const response = await request(app)
        .post('/api/notifications/register-device')
        .set('Authorization', `Bearer ${workerToken}`)
        .send(invalidDeviceData)
        .expect(400);

      expect(response.body.error).toBe('INVALID_DEVICE_DATA');
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    test('should accept valid device registration data', async () => {
      // Mock FCMService registration
      const FCMService = require('./services/FirebaseService.js').default;
      FCMService.registerDeviceToken = jest.fn().mockResolvedValue({
        deviceTokenId: 'token123',
        platform: 'ios',
        isNewRegistration: true,
        notificationSettings: {}
      });

      const validDeviceData = {
        deviceToken: 'valid_device_token_123456789',
        platform: 'ios',
        appVersion: '1.0.0',
        osVersion: '14.0'
      };

      const response = await request(app)
        .post('/api/notifications/register-device')
        .set('Authorization', `Bearer ${workerToken}`)
        .send(validDeviceData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.deviceToken.platform).toBe('ios');
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits for notification requests', async () => {
      // Mock notification queries
      WorkerNotification.find = jest.fn().mockResolvedValue([]);
      WorkerNotification.countDocuments = jest.fn().mockResolvedValue(0);

      // Make multiple requests rapidly
      const requests = Array(10).fill().map(() =>
        request(app)
          .get('/api/notifications')
          .set('Authorization', `Bearer ${workerToken}`)
      );

      const responses = await Promise.all(requests);

      // Some requests should succeed, others should be rate limited
      const successfulRequests = responses.filter(r => r.status === 200);
      const rateLimitedRequests = responses.filter(r => r.status === 429);

      expect(successfulRequests.length).toBeGreaterThan(0);
      expect(rateLimitedRequests.length).toBeGreaterThan(0);

      // Check rate limit response format
      if (rateLimitedRequests.length > 0) {
        expect(rateLimitedRequests[0].body.error).toBe('RATE_LIMIT_EXCEEDED');
        expect(rateLimitedRequests[0].body.retryAfter).toBeDefined();
      }
    });
  });

  describe('Security Headers', () => {
    test('should include security headers in responses', async () => {
      WorkerNotification.find = jest.fn().mockResolvedValue([]);
      WorkerNotification.countDocuments = jest.fn().mockResolvedValue(0);

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${workerToken}`)
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['content-security-policy']).toBe("default-src 'none'");
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Encryption (Requirement 9.3)', () => {
    test('should encrypt notification content when enabled', async () => {
      // Set encryption environment variable
      process.env.NOTIFICATION_ENCRYPTION_ENABLED = 'true';

      const notificationData = {
        type: 'TASK_UPDATE',
        priority: 'HIGH',
        title: 'Sensitive notification title',
        message: 'This message contains sensitive information'
      };

      // Test encryption directly
      const encrypted = SecurityUtil.encrypt(notificationData.title);
      expect(encrypted.encrypted).not.toBe(notificationData.title);
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();

      // Test decryption
      const decrypted = SecurityUtil.decrypt(encrypted);
      expect(decrypted).toBe(notificationData.title);
    });

    test('should handle decryption errors gracefully', async () => {
      const invalidEncryptedData = {
        encrypted: 'invalid_encrypted_data',
        iv: 'invalid_iv',
        authTag: 'invalid_auth_tag'
      };

      expect(() => SecurityUtil.decrypt(invalidEncryptedData)).toThrow('Failed to decrypt content');
    });
  });

  describe('Audit Logging', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test('should log security audit information for requests', async () => {
      WorkerNotification.find = jest.fn().mockResolvedValue([]);
      WorkerNotification.countDocuments = jest.fn().mockResolvedValue(0);

      await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${workerToken}`)
        .expect(200);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Notification Security Audit:',
        expect.objectContaining({
          method: 'GET',
          path: '/api/notifications',
          userId: 1001,
          userRole: 'worker',
          companyId: testCompanyId,
          timestamp: expect.any(String),
          requestId: expect.any(String)
        })
      );
    });

    test('should log response audit information', async () => {
      WorkerNotification.find = jest.fn().mockResolvedValue([]);
      WorkerNotification.countDocuments = jest.fn().mockResolvedValue(0);

      await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${workerToken}`)
        .expect(200);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Notification Response Audit:',
        expect.objectContaining({
          requestId: expect.any(String),
          statusCode: 200,
          responseTime: expect.any(Number),
          success: true,
          error: null
        })
      );
    });

    test('should mask sensitive data in audit logs', async () => {
      const sensitiveData = {
        deviceToken: 'sensitive_token_123456789',
        password: 'secret_password',
        title: 'Normal title'
      };

      await request(app)
        .post('/api/notifications/register-device')
        .set('Authorization', `Bearer ${workerToken}`)
        .send(sensitiveData)
        .expect(400); // Will fail validation, but should still log

      expect(consoleSpy).toHaveBeenCalledWith(
        'Notification Security Audit:',
        expect.objectContaining({
          body: expect.objectContaining({
            deviceToken: expect.stringContaining('*'),
            password: expect.stringContaining('*'),
            title: 'Normal title' // Should not be masked
          })
        })
      );
    });
  });

  describe('Company-Based Access Control', () => {
    test('should enforce company-based filtering for notifications', async () => {
      WorkerNotification.find = jest.fn().mockResolvedValue([]);
      WorkerNotification.countDocuments = jest.fn().mockResolvedValue(0);

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${workerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.permissions.companyId).toBe(testCompanyId);
    });

    test('should validate recipients belong to same company', async () => {
      const notificationData = {
        type: 'TASK_UPDATE',
        priority: 'HIGH',
        recipients: [null, undefined, {}], // Invalid recipient formats
        title: 'Test notification',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send(notificationData)
        .expect(403);

      expect(response.body.error).toBe('CROSS_COMPANY_ACCESS_DENIED');
      expect(response.body.message).toContain('Cannot send notifications to users outside your company');
    });
  });

  describe('Error Handling', () => {
    test('should handle authentication errors gracefully', async () => {
      // Mock User.findOne to throw an error
      User.findOne.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${workerToken}`)
        .expect(500);

      expect(response.body.error).toBe('AUTHENTICATION_ERROR');
      expect(response.body.message).toBe('Authentication verification failed');
    });

    test('should handle authorization errors gracefully', async () => {
      // Mock a scenario that causes authorization to fail
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer invalid_token_format`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});