import crypto from 'crypto';
import appConfig from '../config/app.config.js';

/**
 * Security Utility for Notification System
 * Provides encryption, decryption, and security validation functions
 * Implements Requirements 9.3 (encryption for notification content)
 */
class SecurityUtil {
  constructor() {
    // Use environment variable or fallback to a secure default
    const keySource = process.env.NOTIFICATION_ENCRYPTION_KEY || 
      process.env.JWT_SECRET || 'fallback-secret-key-for-notifications';
    
    // Ensure key is exactly 32 bytes for AES-256
    this.encryptionKey = crypto.scryptSync(keySource, 'notification-salt', 32);
    this.algorithm = 'aes-256-cbc';
    this.ivLength = 16;
    this.tagLength = 16;
  }

  /**
   * Encrypt notification content
   * @param {string} text - Text to encrypt
   * @returns {Object} Encrypted data with IV and auth tag
   */
  encrypt(text) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Text to encrypt must be a non-empty string');
      }

      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: crypto.createHash('sha256').update(encrypted + iv.toString('hex')).digest('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt content');
    }
  }

  /**
   * Decrypt notification content
   * @param {Object} encryptedData - Encrypted data object
   * @param {string} encryptedData.encrypted - Encrypted text
   * @param {string} encryptedData.iv - Initialization vector
   * @param {string} encryptedData.authTag - Authentication tag
   * @returns {string} Decrypted text
   */
  decrypt(encryptedData) {
    try {
      if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv || !encryptedData.authTag) {
        throw new Error('Invalid encrypted data format');
      }

      // Verify integrity
      const expectedAuthTag = crypto.createHash('sha256').update(encryptedData.encrypted + encryptedData.iv).digest('hex');
      if (expectedAuthTag !== encryptedData.authTag) {
        throw new Error('Data integrity check failed');
      }

      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt content');
    }
  }

  /**
   * Generate secure hash for content integrity
   * @param {string} content - Content to hash
   * @returns {string} SHA-256 hash
   */
  generateContentHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Verify content integrity
   * @param {string} content - Original content
   * @param {string} hash - Expected hash
   * @returns {boolean} True if content matches hash
   */
  verifyContentIntegrity(content, hash) {
    const computedHash = this.generateContentHash(content);
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
  }

  /**
   * Generate secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} Random token in hex format
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Sanitize user input to prevent injection attacks
   * @param {string} input - User input to sanitize
   * @returns {string} Sanitized input
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove potentially dangerous characters and patterns
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate notification content for security
   * @param {Object} content - Notification content to validate
   * @returns {Object} Validation result
   */
  validateNotificationContent(content) {
    const errors = [];

    // Check for potentially malicious content
    if (content.title && this.containsSuspiciousContent(content.title)) {
      errors.push('Title contains potentially malicious content');
    }

    if (content.message && this.containsSuspiciousContent(content.message)) {
      errors.push('Message contains potentially malicious content');
    }

    // Check for excessive length (potential DoS)
    const maxTitleLength = parseInt(process.env.NOTIFICATION_TITLE_MAX_LENGTH) || 1000;
    const maxContentLength = parseInt(process.env.NOTIFICATION_CONTENT_MAX_LENGTH) || 5000;

    if (content.title && content.title.length > maxTitleLength) {
      errors.push(`Title exceeds maximum allowed length of ${maxTitleLength} characters`);
    }

    if (content.message && content.message.length > maxContentLength) {
      errors.push(`Message exceeds maximum allowed length of ${maxContentLength} characters`);
    }

    // Validate notification type
    const validTypes = ['TASK_UPDATE', 'SITE_CHANGE', 'ATTENDANCE_ALERT', 'APPROVAL_STATUS'];
    if (content.type && !validTypes.includes(content.type)) {
      errors.push('Invalid notification type');
    }

    // Validate priority
    const validPriorities = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'];
    if (content.priority && !validPriorities.includes(content.priority)) {
      errors.push('Invalid notification priority');
    }

    // Check for required fields
    if (!content.title || content.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!content.message || content.message.trim().length === 0) {
      errors.push('Message is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if content contains suspicious patterns
   * @param {string} content - Content to check
   * @returns {boolean} True if suspicious content found
   */
  containsSuspiciousContent(content) {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /data:text\/html/i,
      /vbscript:/i,
      /expression\(/i,
      /import\s+/i,
      /eval\(/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Generate audit signature for notification operations
   * @param {Object} operation - Operation details
   * @returns {string} Operation signature
   */
  generateAuditSignature(operation) {
    const operationString = JSON.stringify(operation, Object.keys(operation).sort());
    const timestamp = Date.now();
    const signature = crypto
      .createHmac('sha256', this.encryptionKey)
      .update(`${operationString}:${timestamp}`)
      .digest('hex');

    return `${timestamp}:${signature}`;
  }

  /**
   * Verify audit signature
   * @param {Object} operation - Operation details
   * @param {string} signature - Signature to verify
   * @returns {boolean} True if signature is valid
   */
  verifyAuditSignature(operation, signature) {
    try {
      const [timestamp, expectedSignature] = signature.split(':');
      const operationString = JSON.stringify(operation, Object.keys(operation).sort());
      
      const computedSignature = crypto
        .createHmac('sha256', this.encryptionKey)
        .update(`${operationString}:${timestamp}`)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(computedSignature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Validate JWT token structure and claims
   * @param {string} token - JWT token to validate
   * @returns {Object} Validation result
   */
  validateJWTStructure(token) {
    try {
      if (!token || typeof token !== 'string') {
        return { isValid: false, error: 'Token must be a non-empty string' };
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        return { isValid: false, error: 'Invalid JWT structure' };
      }

      // Decode header and payload (without verification)
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      // Basic structure validation
      if (!header.alg || !header.typ) {
        return { isValid: false, error: 'Invalid JWT header' };
      }

      if (!payload.userId || !payload.exp || !payload.iat) {
        return { isValid: false, error: 'Missing required JWT claims' };
      }

      return { isValid: true, header, payload };
    } catch (error) {
      return { isValid: false, error: 'Failed to parse JWT token' };
    }
  }

  /**
   * Generate secure session token for notification operations
   * @param {Object} userInfo - User information
   * @returns {string} Session token
   */
  generateSessionToken(userInfo) {
    const sessionData = {
      userId: userInfo.userId,
      companyId: userInfo.companyId,
      role: userInfo.role,
      timestamp: Date.now(),
      nonce: this.generateSecureToken(16)
    };

    const sessionString = JSON.stringify(sessionData);
    const signature = crypto
      .createHmac('sha256', this.encryptionKey)
      .update(sessionString)
      .digest('hex');

    return Buffer.from(`${sessionString}:${signature}`).toString('base64');
  }

  /**
   * Verify session token
   * @param {string} sessionToken - Session token to verify
   * @returns {Object} Verification result
   */
  verifySessionToken(sessionToken) {
    try {
      const decoded = Buffer.from(sessionToken, 'base64').toString();
      const [sessionString, expectedSignature] = decoded.split(':');
      
      const computedSignature = crypto
        .createHmac('sha256', this.encryptionKey)
        .update(sessionString)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(expectedSignature))) {
        return { isValid: false, error: 'Invalid session signature' };
      }

      const sessionData = JSON.parse(sessionString);
      
      // Check token age (valid for 1 hour)
      const tokenAge = Date.now() - sessionData.timestamp;
      if (tokenAge > 3600000) { // 1 hour in milliseconds
        return { isValid: false, error: 'Session token expired' };
      }

      return { isValid: true, sessionData };
    } catch (error) {
      return { isValid: false, error: 'Failed to verify session token' };
    }
  }

  /**
   * Mask sensitive data for logging
   * @param {Object} data - Data to mask
   * @returns {Object} Masked data
   */
  maskSensitiveData(data) {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'deviceToken'];
    const masked = { ...data };

    const maskValue = (obj, key) => {
      if (typeof obj[key] === 'string' && obj[key].length > 0) {
        obj[key] = obj[key].substring(0, 4) + '*'.repeat(Math.max(0, obj[key].length - 4));
      }
    };

    const maskObject = (obj) => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            maskValue(obj, key);
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            maskObject(obj[key]);
          }
        }
      }
    };

    maskObject(masked);
    return masked;
  }

  /**
   * Validate IP address for security logging
   * @param {string} ip - IP address to validate
   * @returns {Object} Validation result
   */
  validateIPAddress(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    if (!ip || typeof ip !== 'string') {
      return { isValid: false, type: null };
    }

    if (ipv4Regex.test(ip)) {
      return { isValid: true, type: 'IPv4' };
    }

    if (ipv6Regex.test(ip)) {
      return { isValid: true, type: 'IPv6' };
    }

    return { isValid: false, type: null };
  }
}

export default new SecurityUtil();