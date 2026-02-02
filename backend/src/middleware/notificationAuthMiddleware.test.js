import jwt from 'jsonwebtoken';
import {
  verifyNotificationToken,
  authorizeNotificationOperation,
  validateNotificationAccess,
  notificationRateLimit,
  sanitizeNotificationInput,
  securityAuditLogger,
  enforceCompanyAccess
} from './notificationAuthMiddleware.js';
import User from '../modules/user/User.js';
import CompanyUser from '../modules/companyUser/CompanyUser.js';
import Employee from '../modules/employee/Employee.js';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../modules/user/User.js');
jest.mock('../modules/companyUser/CompanyUser.js');
jest.mock('../modules/employee/Employee.js');

/**
 * Notification Authentication Middleware Tests
 * Tests JWT validation, permission-based access control, and security features
 * Implements Requirements 9.1, 9.2, 9.4 (JWT validation, permission-based filtering, access control)
 */

describe('Notification Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      body: {},
      params: {},
      query: {},
      path: '/api/notifications',
      method: 'GET',
      ip: '192.168.1.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
      connection: { remoteAddress: '192.168.1.1' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      removeHeader: jest.fn()
    };
    
    next = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('verifyNotificationToken', () => {
    test('should reject requests without authorization header', async () => {
      await verifyNotificationToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid JWT token required for notification operations'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject requests with invalid authorization header format', async () => {
      req.headers.authorization = 'InvalidFormat token123';

      await verifyNotificationToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid JWT token required for notification operations'
      });
    });

    test('should reject expired tokens', async () => {
      req.headers.authorization = 'Bearer expired.token.here';
      
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await verifyNotificationToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Token expired'
      });
    });

    test('should reject malformed tokens', async () => {
      req.headers.authorization = 'Bearer malformed.token';
      
      jwt.verify.mockImplementation(() => {
        const error = new Error('Malformed token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await verifyNotificationToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'MALFORMED_TOKEN',
        message: 'Malformed token'
      });
    });

    test('should reject tokens for non-existent users', async () => {
      req.headers.authorization = 'Bearer valid.token.here';
      
      jwt.verify.mockReturnValue({ userId: 123, role: 'worker' });
      User.findOne.mockResolvedValue(null);

      await verifyNotificationToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User associated with token not found'
      });
    });

    test('should reject tokens for inactive users', async () => {
      req.headers.authorization = 'Bearer valid.token.here';
      
      jwt.verify.mockReturnValue({ userId: 123, role: 'worker' });
      User.findOne.mockResolvedValue({ id: 123, isActive: false });

      await verifyNotificationToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'USER_INACTIVE',
        message: 'User account is inactive'
      });
    });

    test('should reject users without company association', async () => {
      req.headers.authorization = 'Bearer valid.token.here';
      
      jwt.verify.mockReturnValue({ userId: 123, role: 'worker' });
      User.findOne.mockResolvedValue({ id: 123, isActive: true, name: 'Test User' });
      CompanyUser.findOne.mockResolvedValue(null);

      await verifyNotificationToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'NO_COMPANY_ACCESS',
        message: 'User is not associated with any company'
      });
    });

    test('should successfully authenticate valid token', async () => {
      req.headers.authorization = 'Bearer valid.token.here';
      
      const decodedToken = {
        userId: 123,
        role: 'worker',
        email: 'test@example.com',
        companyId: 456,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      jwt.verify.mockReturnValue(decodedToken);
      User.findOne.mockResolvedValue({ 
        id: 123, 
        isActive: true, 
        name: 'Test User' 
      });
      CompanyUser.findOne.mockResolvedValue({ 
        userId: 123, 
        companyId: 456 
      });
      Employee.findOne.mockResolvedValue({ 
        id: 789, 
        userId: 123 
      });

      await verifyNotificationToken(req, res, next);

      expect(req.user).toEqual({
        id: 123,
        userId: 123,
        companyId: 456,
        role: 'worker',
        email: 'test@example.com',
        name: 'Test User',
        employeeId: 789,
        isActive: true,
        tokenIssuedAt: decodedToken.iat,
        tokenExpiresAt: decodedToken.exp
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('authorizeNotificationOperation', () => {
    beforeEach(() => {
      req.user = {
        id: 123,
        userId: 123,
        companyId: 456,
        role: 'worker'
      };
    });

    test('should reject requests without authentication', async () => {
      delete req.user;
      
      const middleware = authorizeNotificationOperation('READ_NOTIFICATIONS');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required before authorization'
      });
    });

    test('should reject insufficient role permissions', async () => {
      req.user.role = 'worker';
      
      const middleware = authorizeNotificationOperation('CREATE_NOTIFICATION', ['supervisor', 'admin']);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'INSUFFICIENT_ROLE_PERMISSIONS',
        message: "Operation 'CREATE_NOTIFICATION' requires one of these roles: supervisor, admin"
      });
    });

    test('should allow CREATE_NOTIFICATION for supervisors', async () => {
      req.user.role = 'supervisor';
      
      const middleware = authorizeNotificationOperation('CREATE_NOTIFICATION');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should set worker permissions for READ_NOTIFICATIONS', async () => {
      req.user.role = 'worker';
      
      const middleware = authorizeNotificationOperation('READ_NOTIFICATIONS');
      await middleware(req, res, next);

      expect(req.notificationPermissions).toEqual({
        canReadAll: false,
        restrictToRecipient: 123,
        companyId: 456
      });
      expect(next).toHaveBeenCalled();
    });

    test('should set supervisor permissions for READ_NOTIFICATIONS', async () => {
      req.user.role = 'supervisor';
      
      const middleware = authorizeNotificationOperation('READ_NOTIFICATIONS');
      await middleware(req, res, next);

      expect(req.notificationPermissions).toEqual({
        canReadAll: true,
        companyId: 456
      });
      expect(next).toHaveBeenCalled();
    });

    test('should reject VIEW_HEALTH_STATUS for workers', async () => {
      req.user.role = 'worker';
      
      const middleware = authorizeNotificationOperation('VIEW_HEALTH_STATUS');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'HEALTH_PERMISSION_DENIED',
        message: 'Only administrators and supervisors can view system health'
      });
    });
  });

  describe('validateNotificationAccess', () => {
    beforeEach(() => {
      req.user = {
        id: 123,
        role: 'worker',
        companyId: 456
      };
      req.params = { id: '789' };
    });

    test('should require authentication', async () => {
      delete req.user;
      
      await validateNotificationAccess(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      });
    });

    test('should set worker access validation', async () => {
      await validateNotificationAccess(req, res, next);

      expect(req.accessValidation).toEqual({
        restrictToRecipient: 123,
        companyId: 456
      });
      expect(next).toHaveBeenCalled();
    });

    test('should set supervisor access validation', async () => {
      req.user.role = 'supervisor';
      
      await validateNotificationAccess(req, res, next);

      expect(req.accessValidation).toEqual({
        companyId: 456,
        canAccessAll: true
      });
      expect(next).toHaveBeenCalled();
    });

    test('should reject invalid roles', async () => {
      req.user.role = 'invalid_role';
      
      await validateNotificationAccess(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Insufficient permissions to access notification'
      });
    });
  });

  describe('sanitizeNotificationInput', () => {
    test('should sanitize notification content', async () => {
      req.body = {
        title: '<script>alert("xss")</script>Clean Title',
        message: 'Message with javascript:alert("malicious") content'
      };

      await sanitizeNotificationInput(req, res, next);

      expect(req.body.title).not.toContain('<script>');
      expect(req.body.message).not.toContain('javascript:');
      expect(next).toHaveBeenCalled();
    });

    test('should reject content with security violations', async () => {
      req.body = {
        title: '<script>alert("xss")</script>',
        message: 'javascript:alert("malicious")'
      };

      await sanitizeNotificationInput(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'INVALID_CONTENT',
        message: 'Notification content contains security violations',
        details: expect.any(Array)
      });
    });

    test('should validate device registration data', async () => {
      req.path = '/register-device';
      req.body = {
        deviceToken: 'short', // Too short
        platform: 'invalid_platform' // Invalid platform
      };

      await sanitizeNotificationInput(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'INVALID_DEVICE_DATA',
        message: 'Device registration data is invalid',
        details: expect.any(Array)
      });
    });

    test('should pass valid device registration data', async () => {
      req.path = '/register-device';
      req.body = {
        title: 'Valid notification',
        message: 'Valid message content',
        deviceToken: 'valid_device_token_123456789',
        platform: 'ios',
        appVersion: '1.0.0',
        osVersion: '14.0'
      };

      await sanitizeNotificationInput(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('notificationRateLimit', () => {
    beforeEach(() => {
      req.user = { id: 123 };
    });

    test('should allow requests within rate limit', async () => {
      const rateLimitMiddleware = notificationRateLimit(5, 60000); // 5 requests per minute
      
      // Make 3 requests
      await rateLimitMiddleware(req, res, next);
      await rateLimitMiddleware(req, res, next);
      await rateLimitMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(3);
      expect(res.status).not.toHaveBeenCalledWith(429);
    });

    test('should reject requests exceeding rate limit', async () => {
      const rateLimitMiddleware = notificationRateLimit(2, 60000); // 2 requests per minute
      
      // Make 3 requests (should reject the 3rd)
      await rateLimitMiddleware(req, res, next);
      await rateLimitMiddleware(req, res, next);
      await rateLimitMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Maximum 2 requests per 1 minutes.',
        retryAfter: expect.any(Number)
      });
    });

    test('should pass through requests without user', async () => {
      delete req.user;
      
      const rateLimitMiddleware = notificationRateLimit(5, 60000);
      await rateLimitMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('securityAuditLogger', () => {
    beforeEach(() => {
      req.user = {
        id: 123,
        role: 'worker',
        companyId: 456
      };
      
      // Mock console.log to avoid test output
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      console.log.mockRestore();
    });

    test('should log request information', async () => {
      await securityAuditLogger(req, res, next);

      expect(console.log).toHaveBeenCalledWith('Notification Security Audit:', expect.objectContaining({
        method: 'GET',
        path: '/api/notifications',
        userId: 123,
        userRole: 'worker',
        companyId: 456,
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: expect.any(String),
        requestId: expect.any(String),
        body: {}
      }));
      expect(next).toHaveBeenCalled();
    });

    test('should log response information', async () => {
      await securityAuditLogger(req, res, next);

      // Simulate response
      const responseData = { success: true, message: 'Test response' };
      res.json(responseData);

      expect(console.log).toHaveBeenCalledWith('Notification Response Audit:', expect.objectContaining({
        requestId: expect.any(String),
        statusCode: undefined, // Not set in mock
        responseTime: expect.any(Number),
        success: true,
        error: null
      }));
    });

    test('should mask sensitive data in request body', async () => {
      req.body = {
        title: 'Test notification',
        deviceToken: 'sensitive_token_123456789',
        password: 'secret_password'
      };

      await securityAuditLogger(req, res, next);

      expect(console.log).toHaveBeenCalledWith('Notification Security Audit:', expect.objectContaining({
        body: expect.objectContaining({
          title: 'Test notification',
          deviceToken: expect.stringContaining('*'),
          password: expect.stringContaining('*')
        })
      }));
    });
  });

  describe('enforceCompanyAccess', () => {
    beforeEach(() => {
      req.user = {
        id: 123,
        companyId: 456
      };
    });

    test('should require user with company association', async () => {
      delete req.user.companyId;
      
      await enforceCompanyAccess(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'COMPANY_ACCESS_REQUIRED',
        message: 'Valid company association required'
      });
    });

    test('should set company filter for valid user', async () => {
      await enforceCompanyAccess(req, res, next);

      expect(req.companyFilter).toEqual({
        companyId: 456,
        enforced: true
      });
      expect(next).toHaveBeenCalled();
    });

    test('should validate recipients for notification creation', async () => {
      req.body = {
        recipients: ['user1', 'user2', 'user3']
      };

      await enforceCompanyAccess(req, res, next);

      // Should pass basic validation (detailed validation would require database mocking)
      expect(next).toHaveBeenCalled();
    });

    test('should reject invalid recipient format', async () => {
      req.body = {
        recipients: [null, undefined, {}] // Invalid formats
      };

      await enforceCompanyAccess(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'CROSS_COMPANY_ACCESS_DENIED',
        message: 'Cannot send notifications to users outside your company',
        details: expect.any(Array)
      });
    });
  });
});