import jwt from 'jsonwebtoken';
import User from '../modules/user/User.js';
import CompanyUser from '../modules/companyUser/CompanyUser.js';
import Employee from '../modules/employee/Employee.js';
import SecurityUtil from '../utils/securityUtil.js';
import appConfig from '../config/app.config.js';

/**
 * Enhanced Authentication Middleware for Notification System
 * Implements Requirements 9.1, 9.2, 9.4 (JWT validation, permission-based access control)
 */

/**
 * Verify JWT Token with enhanced security for notifications
 * Implements Requirement 9.1: Authentication for all notification operations
 */
export const verifyNotificationToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check for authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid JWT token required for notification operations'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token signature and expiration
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      let errorMessage = 'Invalid token';
      let errorCode = 'INVALID_TOKEN';

      if (jwtError.name === 'TokenExpiredError') {
        errorMessage = 'Token expired';
        errorCode = 'TOKEN_EXPIRED';
      } else if (jwtError.name === 'JsonWebTokenError') {
        errorMessage = 'Malformed token';
        errorCode = 'MALFORMED_TOKEN';
      }

      return res.status(401).json({
        success: false,
        error: errorCode,
        message: errorMessage
      });
    }

    // Validate user exists and is active
    const user = await User.findOne({ id: decoded.userId });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User associated with token not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'USER_INACTIVE',
        message: 'User account is inactive'
      });
    }

    // Get company association for permission validation
    const companyUser = await CompanyUser.findOne({ userId: decoded.userId });
    if (!companyUser) {
      return res.status(403).json({
        success: false,
        error: 'NO_COMPANY_ACCESS',
        message: 'User is not associated with any company'
      });
    }

    // Get employee information if available
    const employee = await Employee.findOne({ userId: decoded.userId });

    // Attach enhanced user information to request
    req.user = {
      id: decoded.userId, // Use 'id' to match controller expectations
      userId: decoded.userId,
      companyId: decoded.companyId || companyUser.companyId,
      role: decoded.role, // This should come from the JWT token
      email: decoded.email,
      name: user.name,
      employeeId: employee?.id,
      isActive: user.isActive,
      tokenIssuedAt: decoded.iat,
      tokenExpiresAt: decoded.exp
    };

    // Log authentication success for audit
    console.log(`Notification auth success: User ${decoded.userId} (${decoded.role}) from company ${req.user.companyId}`);

    next();

  } catch (error) {
    console.error('Notification authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'AUTHENTICATION_ERROR',
      message: 'Authentication verification failed'
    });
  }
};

/**
 * Permission-based authorization for notification operations
 * Implements Requirement 9.2, 9.4: Permission-based notification filtering and access control
 */
export const authorizeNotificationOperation = (operation, allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required before authorization'
        });
      }

      const { role, companyId, userId } = req.user;

      // Debug logging
      console.log('🔍 Authorization Debug:', {
        operation,
        userRole: role,
        allowedRoles,
        userId,
        companyId
      });

      // Check role-based permissions
      const normalizedRole = role?.toLowerCase(); // Normalize role to lowercase
      const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());
      
      console.log('🔍 Normalized roles:', {
        normalizedRole,
        normalizedAllowedRoles,
        includes: normalizedAllowedRoles.includes(normalizedRole)
      });
      
      if (allowedRoles.length > 0 && !normalizedAllowedRoles.includes(normalizedRole)) {
        console.log('❌ Role check failed:', {
          normalizedRole,
          normalizedAllowedRoles,
          operation
        });
        return res.status(403).json({
          success: false,
          error: 'INSUFFICIENT_ROLE_PERMISSIONS',
          message: `Operation '${operation}' requires one of these roles: ${allowedRoles.join(', ')}`
        });
      }

      // Operation-specific permission checks
      switch (operation) {
        case 'CREATE_NOTIFICATION':
          // Only supervisors and admins can create notifications
          if (!['supervisor', 'admin', 'company_admin'].includes(normalizedRole)) {
            return res.status(403).json({
              success: false,
              error: 'CREATE_PERMISSION_DENIED',
              message: 'Only supervisors and administrators can create notifications'
            });
          }
          break;

        case 'READ_NOTIFICATIONS':
          // Workers can only read their own notifications
          // Supervisors and admins can read notifications for their company
          if (normalizedRole === 'worker') {
            // Additional validation will be done in controller to ensure worker only sees their notifications
            req.notificationPermissions = {
              canReadAll: false,
              restrictToRecipient: userId,
              companyId
            };
          } else if (['supervisor', 'admin', 'company_admin'].includes(normalizedRole)) {
            req.notificationPermissions = {
              canReadAll: true,
              companyId
            };
          } else {
            return res.status(403).json({
              success: false,
              error: 'READ_PERMISSION_DENIED',
              message: 'Insufficient permissions to read notifications'
            });
          }
          break;

        case 'MANAGE_DEVICES':
          // Workers can only manage their own devices
          // Supervisors and admins can manage devices for their company
          if (normalizedRole === 'worker') {
            req.devicePermissions = {
              canManageAll: false,
              restrictToWorker: userId,
              companyId
            };
          } else if (['supervisor', 'admin', 'company_admin'].includes(normalizedRole)) {
            req.devicePermissions = {
              canManageAll: true,
              companyId
            };
          } else {
            return res.status(403).json({
              success: false,
              error: 'DEVICE_PERMISSION_DENIED',
              message: 'Insufficient permissions to manage devices'
            });
          }
          break;

        case 'VIEW_HEALTH_STATUS':
          // Only admins and supervisors can view system health
          if (!['supervisor', 'admin', 'company_admin'].includes(normalizedRole)) {
            return res.status(403).json({
              success: false,
              error: 'HEALTH_PERMISSION_DENIED',
              message: 'Only administrators and supervisors can view system health'
            });
          }
          break;

        case 'SYNC_NOTIFICATIONS':
          // Workers can sync their own notifications
          // Supervisors and admins can sync notifications for their company
          if (normalizedRole === 'worker') {
            req.syncPermissions = {
              canSyncAll: false,
              restrictToWorker: userId,
              companyId
            };
          } else if (['supervisor', 'admin', 'company_admin'].includes(normalizedRole)) {
            req.syncPermissions = {
              canSyncAll: true,
              companyId
            };
          } else {
            return res.status(403).json({
              success: false,
              error: 'SYNC_PERMISSION_DENIED',
              message: 'Insufficient permissions to sync notifications'
            });
          }
          break;

        default:
          // Default permission check - ensure user has valid role
          if (!['worker', 'supervisor', 'admin', 'company_admin'].includes(normalizedRole)) {
            return res.status(403).json({
              success: false,
              error: 'INVALID_ROLE',
              message: 'User has invalid role for notification operations'
            });
          }
      }

      // Log authorization success
      console.log(`Notification authorization success: User ${userId} (${role}) authorized for ${operation}`);

      next();

    } catch (error) {
      console.error('Notification authorization error:', error);
      return res.status(500).json({
        success: false,
        error: 'AUTHORIZATION_ERROR',
        message: 'Authorization verification failed'
      });
    }
  };
};

/**
 * Validate notification access permissions
 * Ensures users can only access notifications they have permission to view
 * Implements Requirement 9.2, 9.4: Permission-based access control
 */
export const validateNotificationAccess = async (req, res, next) => {
  try {
    const { user } = req;
    const notificationId = req.params.id;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      });
    }

    // For workers, ensure they can only access their own notifications
    const normalizedRole = user.role?.toLowerCase();
    if (normalizedRole === 'worker') {
      // The controller will validate that the notification belongs to the worker
      req.accessValidation = {
        restrictToRecipient: user.id,
        companyId: user.companyId
      };
    } else if (['supervisor', 'admin', 'company_admin'].includes(normalizedRole)) {
      // Supervisors and admins can access notifications within their company
      req.accessValidation = {
        companyId: user.companyId,
        canAccessAll: true
      };
    } else {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Insufficient permissions to access notification'
      });
    }

    next();

  } catch (error) {
    console.error('Notification access validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'ACCESS_VALIDATION_ERROR',
      message: 'Failed to validate notification access'
    });
  }
};

/**
 * Rate limiting middleware for notification operations
 * Prevents abuse and ensures system stability
 */
export const notificationRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
      return next(); // Let authentication middleware handle this
    }

    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(time => time > windowStart);
      requests.set(userId, userRequests);
    } else {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Maximum ${maxRequests} requests per ${windowMs / 1000 / 60} minutes.`,
        retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
      });
    }

    userRequests.push(now);
    next();
  };
};

/**
 * Security headers middleware for notification endpoints
 * Adds security headers to prevent common attacks
 */
export const addSecurityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent information disclosure
  res.removeHeader('X-Powered-By');
  
  // Content Security Policy for API responses
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  
  next();
};

/**
 * Input sanitization middleware with enhanced security
 * Sanitizes user input to prevent injection attacks
 */
export const sanitizeNotificationInput = (req, res, next) => {
  try {
    if (req.body) {
      // Sanitize notification content
      if (req.body.title) {
        req.body.title = SecurityUtil.sanitizeInput(req.body.title);
      }
      
      if (req.body.message) {
        req.body.message = SecurityUtil.sanitizeInput(req.body.message);
      }

      // Sanitize device registration data
      if (req.body.deviceToken) {
        req.body.deviceToken = SecurityUtil.sanitizeInput(req.body.deviceToken);
      }

      if (req.body.platform) {
        req.body.platform = SecurityUtil.sanitizeInput(req.body.platform);
      }

      // Validate content for security issues
      const validation = SecurityUtil.validateNotificationContent(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_CONTENT',
          message: 'Notification content contains security violations',
          details: validation.errors
        });
      }

      // Additional validation for device registration
      if (req.path.includes('/register-device')) {
        const deviceValidation = validateDeviceRegistrationData(req.body);
        if (!deviceValidation.isValid) {
          return res.status(400).json({
            success: false,
            error: 'INVALID_DEVICE_DATA',
            message: 'Device registration data is invalid',
            details: deviceValidation.errors
          });
        }
      }
    }

    next();

  } catch (error) {
    console.error('Input sanitization error:', error);
    return res.status(500).json({
      success: false,
      error: 'SANITIZATION_ERROR',
      message: 'Failed to sanitize input'
    });
  }
};

/**
 * Validate device registration data
 * @param {Object} deviceData - Device registration data
 * @returns {Object} Validation result
 */
function validateDeviceRegistrationData(deviceData) {
  const errors = [];

  // Validate device token
  if (!deviceData.deviceToken || typeof deviceData.deviceToken !== 'string') {
    errors.push('Device token is required and must be a string');
  } else if (deviceData.deviceToken.length < 10 || deviceData.deviceToken.length > 500) {
    errors.push('Device token length is invalid');
  }

  // Validate platform
  const validPlatforms = ['ios', 'android'];
  if (!deviceData.platform || !validPlatforms.includes(deviceData.platform.toLowerCase())) {
    errors.push('Platform must be either "ios" or "android"');
  }

  // Validate app version
  if (deviceData.appVersion && !/^\d+\.\d+\.\d+$/.test(deviceData.appVersion)) {
    errors.push('App version must be in format x.y.z');
  }

  // Validate OS version
  if (deviceData.osVersion && deviceData.osVersion.length > 50) {
    errors.push('OS version is too long');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Enhanced security logging middleware
 * Logs security-relevant events for audit purposes
 */
export const securityAuditLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request details
  const requestInfo = {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    userRole: req.user?.role,
    companyId: req.user?.companyId,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    requestId: SecurityUtil.generateSecureToken(8)
  };

  // Mask sensitive data for logging
  const maskedBody = SecurityUtil.maskSensitiveData(req.body || {});
  
  console.log('Notification Security Audit:', {
    ...requestInfo,
    body: maskedBody
  });

  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    console.log('Notification Response Audit:', {
      requestId: requestInfo.requestId,
      statusCode: res.statusCode,
      responseTime,
      success: data?.success || false,
      error: data?.error || null
    });

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Company-based access control middleware
 * Ensures users can only access resources within their company
 */
export const enforceCompanyAccess = async (req, res, next) => {
  try {
    const { user } = req;
    
    if (!user || !user.companyId) {
      return res.status(403).json({
        success: false,
        error: 'COMPANY_ACCESS_REQUIRED',
        message: 'Valid company association required'
      });
    }

    // For notification operations, ensure company-based filtering
    if (req.body && req.body.recipients) {
      // Validate that all recipients belong to the same company
      const recipientValidation = await validateRecipientsCompanyAccess(req.body.recipients, user.companyId);
      if (!recipientValidation.isValid) {
        return res.status(403).json({
          success: false,
          error: 'CROSS_COMPANY_ACCESS_DENIED',
          message: 'Cannot send notifications to users outside your company',
          details: recipientValidation.errors
        });
      }
    }

    // Add company filter to request context
    req.companyFilter = {
      companyId: user.companyId,
      enforced: true
    };

    next();

  } catch (error) {
    console.error('Company access enforcement error:', error);
    return res.status(500).json({
      success: false,
      error: 'COMPANY_ACCESS_ERROR',
      message: 'Failed to enforce company access control'
    });
  }
};

/**
 * Validate recipients belong to the same company
 * @param {Array} recipients - List of recipient IDs
 * @param {number} companyId - Company ID to validate against
 * @returns {Object} Validation result
 */
async function validateRecipientsCompanyAccess(recipients, companyId) {
  try {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return { isValid: true, errors: [] };
    }

    // This would require a database query to validate recipients
    // For now, we'll implement basic validation
    const errors = [];

    // Validate recipient format
    for (const recipient of recipients) {
      if (!recipient || (typeof recipient !== 'string' && typeof recipient !== 'number')) {
        errors.push(`Invalid recipient format: ${recipient}`);
      }
    }

    // TODO: Add actual database validation to check if recipients belong to the company
    // const companyUsers = await CompanyUser.find({ 
    //   userId: { $in: recipients }, 
    //   companyId: companyId 
    // });
    // 
    // const validRecipients = companyUsers.map(cu => cu.userId);
    // const invalidRecipients = recipients.filter(r => !validRecipients.includes(r));
    // 
    // if (invalidRecipients.length > 0) {
    //   errors.push(`Recipients not in company: ${invalidRecipients.join(', ')}`);
    // }

    return {
      isValid: errors.length === 0,
      errors
    };

  } catch (error) {
    console.error('Recipient validation error:', error);
    return {
      isValid: false,
      errors: ['Failed to validate recipients']
    };
  }
}

export default {
  verifyNotificationToken,
  authorizeNotificationOperation,
  validateNotificationAccess,
  notificationRateLimit,
  addSecurityHeaders,
  sanitizeNotificationInput,
  securityAuditLogger,
  enforceCompanyAccess
};