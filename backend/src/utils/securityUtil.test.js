import SecurityUtil from './securityUtil.js';
import crypto from 'crypto';

/**
 * Security Utility Tests
 * Tests for encryption, validation, and security functions
 * Implements Requirements 9.3 (encryption for notification content)
 */

describe('SecurityUtil', () => {
  describe('Encryption and Decryption', () => {
    test('should encrypt and decrypt text correctly', () => {
      const originalText = 'This is a test notification message';
      
      const encrypted = SecurityUtil.encrypt(originalText);
      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted.encrypted).not.toBe(originalText);
      
      const decrypted = SecurityUtil.decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    test('should handle empty or invalid input for encryption', () => {
      expect(() => SecurityUtil.encrypt('')).toThrow('Text to encrypt must be a non-empty string');
      expect(() => SecurityUtil.encrypt(null)).toThrow('Text to encrypt must be a non-empty string');
      expect(() => SecurityUtil.encrypt(123)).toThrow('Text to encrypt must be a non-empty string');
    });

    test('should handle invalid encrypted data for decryption', () => {
      expect(() => SecurityUtil.decrypt({})).toThrow('Invalid encrypted data format');
      expect(() => SecurityUtil.decrypt({ encrypted: 'test' })).toThrow('Invalid encrypted data format');
      expect(() => SecurityUtil.decrypt(null)).toThrow('Invalid encrypted data format');
    });

    test('should produce different encrypted output for same input', () => {
      const text = 'Same input text';
      const encrypted1 = SecurityUtil.encrypt(text);
      const encrypted2 = SecurityUtil.encrypt(text);
      
      // Should have different IVs and encrypted content
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      
      // But both should decrypt to the same original text
      expect(SecurityUtil.decrypt(encrypted1)).toBe(text);
      expect(SecurityUtil.decrypt(encrypted2)).toBe(text);
    });
  });

  describe('Content Validation', () => {
    test('should validate valid notification content', () => {
      const validContent = {
        type: 'TASK_UPDATE',
        priority: 'HIGH',
        title: 'Valid notification title',
        message: 'This is a valid notification message'
      };

      const result = SecurityUtil.validateNotificationContent(validContent);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject content with suspicious patterns', () => {
      const suspiciousContent = {
        title: 'Alert <script>alert("xss")</script>',
        message: 'Click here: javascript:alert("malicious")'
      };

      const result = SecurityUtil.validateNotificationContent(suspiciousContent);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('malicious'))).toBe(true);
    });

    test('should reject content exceeding length limits', () => {
      const longContent = {
        title: 'A'.repeat(2000), // Exceeds default limit
        message: 'B'.repeat(6000) // Exceeds default limit
      };

      const result = SecurityUtil.validateNotificationContent(longContent);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('exceeds maximum'))).toBe(true);
    });

    test('should validate notification type and priority', () => {
      const invalidContent = {
        type: 'INVALID_TYPE',
        priority: 'INVALID_PRIORITY',
        title: 'Test',
        message: 'Test message'
      };

      const result = SecurityUtil.validateNotificationContent(invalidContent);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid notification type'))).toBe(true);
      expect(result.errors.some(error => error.includes('Invalid notification priority'))).toBe(true);
    });

    test('should require title and message', () => {
      const incompleteContent = {
        type: 'TASK_UPDATE',
        priority: 'NORMAL'
        // Missing title and message
      };

      const result = SecurityUtil.validateNotificationContent(incompleteContent);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Title is required'))).toBe(true);
      expect(result.errors.some(error => error.includes('Message is required'))).toBe(true);
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello World<img src="x">';
      const sanitized = SecurityUtil.sanitizeInput(input);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<img');
      expect(sanitized).toContain('Hello World');
    });

    test('should remove javascript protocols', () => {
      const input = 'Click here: javascript:alert("malicious")';
      const sanitized = SecurityUtil.sanitizeInput(input);
      
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).toContain('Click here:');
    });

    test('should remove event handlers', () => {
      const input = 'Text with onclick=alert("xss") handler';
      const sanitized = SecurityUtil.sanitizeInput(input);
      
      expect(sanitized).not.toContain('onclick=');
      expect(sanitized).toContain('Text with');
    });

    test('should handle non-string input', () => {
      expect(SecurityUtil.sanitizeInput(null)).toBe('');
      expect(SecurityUtil.sanitizeInput(undefined)).toBe('');
      expect(SecurityUtil.sanitizeInput(123)).toBe('');
      expect(SecurityUtil.sanitizeInput({})).toBe('');
    });
  });

  describe('Content Hash Generation', () => {
    test('should generate consistent hash for same content', () => {
      const content = 'Test content for hashing';
      const hash1 = SecurityUtil.generateContentHash(content);
      const hash2 = SecurityUtil.generateContentHash(content);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 character hex string
    });

    test('should generate different hashes for different content', () => {
      const content1 = 'First content';
      const content2 = 'Second content';
      
      const hash1 = SecurityUtil.generateContentHash(content1);
      const hash2 = SecurityUtil.generateContentHash(content2);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should verify content integrity correctly', () => {
      const content = 'Content to verify';
      const hash = SecurityUtil.generateContentHash(content);
      
      expect(SecurityUtil.verifyContentIntegrity(content, hash)).toBe(true);
      expect(SecurityUtil.verifyContentIntegrity('Modified content', hash)).toBe(false);
    });
  });

  describe('Secure Token Generation', () => {
    test('should generate secure random tokens', () => {
      const token1 = SecurityUtil.generateSecureToken();
      const token2 = SecurityUtil.generateSecureToken();
      
      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(64); // 32 bytes = 64 hex characters
      expect(token2).toHaveLength(64);
    });

    test('should generate tokens of specified length', () => {
      const token16 = SecurityUtil.generateSecureToken(16);
      const token8 = SecurityUtil.generateSecureToken(8);
      
      expect(token16).toHaveLength(32); // 16 bytes = 32 hex characters
      expect(token8).toHaveLength(16); // 8 bytes = 16 hex characters
    });
  });

  describe('Audit Signatures', () => {
    test('should generate and verify audit signatures', () => {
      const operation = {
        action: 'CREATE_NOTIFICATION',
        userId: 123,
        notificationId: 456
      };

      const signature = SecurityUtil.generateAuditSignature(operation);
      expect(signature).toContain(':');
      
      const isValid = SecurityUtil.verifyAuditSignature(operation, signature);
      expect(isValid).toBe(true);
    });

    test('should reject invalid audit signatures', () => {
      const operation = {
        action: 'CREATE_NOTIFICATION',
        userId: 123
      };

      const signature = SecurityUtil.generateAuditSignature(operation);
      
      // Modify operation
      const modifiedOperation = {
        action: 'DELETE_NOTIFICATION',
        userId: 123
      };

      const isValid = SecurityUtil.verifyAuditSignature(modifiedOperation, signature);
      expect(isValid).toBe(false);
    });

    test('should handle malformed signatures', () => {
      const operation = { action: 'TEST' };
      
      expect(SecurityUtil.verifyAuditSignature(operation, 'invalid')).toBe(false);
      expect(SecurityUtil.verifyAuditSignature(operation, '')).toBe(false);
      expect(SecurityUtil.verifyAuditSignature(operation, null)).toBe(false);
    });
  });

  describe('JWT Structure Validation', () => {
    test('should validate proper JWT structure', () => {
      // Create a mock JWT structure (not a real JWT, just for structure testing)
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ 
        userId: 123, 
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      })).toString('base64');
      const signature = 'mock_signature';
      
      const mockJWT = `${header}.${payload}.${signature}`;
      
      const result = SecurityUtil.validateJWTStructure(mockJWT);
      expect(result.isValid).toBe(true);
      expect(result.header).toHaveProperty('alg');
      expect(result.payload).toHaveProperty('userId');
    });

    test('should reject invalid JWT structure', () => {
      expect(SecurityUtil.validateJWTStructure('invalid')).toEqual({
        isValid: false,
        error: 'Invalid JWT structure'
      });
      
      expect(SecurityUtil.validateJWTStructure('')).toEqual({
        isValid: false,
        error: 'Token must be a non-empty string'
      });
      
      expect(SecurityUtil.validateJWTStructure(null)).toEqual({
        isValid: false,
        error: 'Token must be a non-empty string'
      });
    });
  });

  describe('Session Token Management', () => {
    test('should generate and verify session tokens', () => {
      const userInfo = {
        userId: 123,
        companyId: 456,
        role: 'worker'
      };

      const sessionToken = SecurityUtil.generateSessionToken(userInfo);
      expect(typeof sessionToken).toBe('string');
      expect(sessionToken.length).toBeGreaterThan(0);

      const verification = SecurityUtil.verifySessionToken(sessionToken);
      expect(verification.isValid).toBe(true);
      expect(verification.sessionData.userId).toBe(userInfo.userId);
      expect(verification.sessionData.companyId).toBe(userInfo.companyId);
      expect(verification.sessionData.role).toBe(userInfo.role);
    });

    test('should reject invalid session tokens', () => {
      expect(SecurityUtil.verifySessionToken('invalid')).toEqual({
        isValid: false,
        error: expect.any(String)
      });
      
      expect(SecurityUtil.verifySessionToken('')).toEqual({
        isValid: false,
        error: expect.any(String)
      });
    });
  });

  describe('Data Masking', () => {
    test('should mask sensitive fields', () => {
      const sensitiveData = {
        username: 'testuser',
        password: 'secretpassword123',
        deviceToken: 'abcdef123456789',
        normalField: 'normal value'
      };

      const masked = SecurityUtil.maskSensitiveData(sensitiveData);
      
      expect(masked.username).toBe('testuser'); // Not sensitive
      expect(masked.password).toContain('*');
      expect(masked.password).not.toBe('secretpassword123');
      expect(masked.deviceToken).toContain('*');
      expect(masked.normalField).toBe('normal value');
    });

    test('should handle nested objects', () => {
      const nestedData = {
        user: {
          name: 'John',
          secret: 'topsecret'
        },
        config: {
          apiKey: 'key123456789'
        }
      };

      const masked = SecurityUtil.maskSensitiveData(nestedData);
      
      expect(masked.user.name).toBe('John');
      expect(masked.user.secret).toContain('*');
      expect(masked.config.apiKey).toContain('*');
    });
  });

  describe('IP Address Validation', () => {
    test('should validate IPv4 addresses', () => {
      expect(SecurityUtil.validateIPAddress('192.168.1.1')).toEqual({
        isValid: true,
        type: 'IPv4'
      });
      
      expect(SecurityUtil.validateIPAddress('10.0.0.1')).toEqual({
        isValid: true,
        type: 'IPv4'
      });
    });

    test('should validate IPv6 addresses', () => {
      expect(SecurityUtil.validateIPAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toEqual({
        isValid: true,
        type: 'IPv6'
      });
    });

    test('should reject invalid IP addresses', () => {
      expect(SecurityUtil.validateIPAddress('invalid')).toEqual({
        isValid: false,
        type: null
      });
      
      expect(SecurityUtil.validateIPAddress('999.999.999.999')).toEqual({
        isValid: false,
        type: null
      });
      
      expect(SecurityUtil.validateIPAddress('')).toEqual({
        isValid: false,
        type: null
      });
    });
  });

  describe('Suspicious Content Detection', () => {
    test('should detect script tags', () => {
      expect(SecurityUtil.containsSuspiciousContent('<script>alert("xss")</script>')).toBe(true);
      expect(SecurityUtil.containsSuspiciousContent('<SCRIPT>alert("xss")</SCRIPT>')).toBe(true);
    });

    test('should detect javascript protocols', () => {
      expect(SecurityUtil.containsSuspiciousContent('javascript:alert("xss")')).toBe(true);
      expect(SecurityUtil.containsSuspiciousContent('JAVASCRIPT:alert("xss")')).toBe(true);
    });

    test('should detect event handlers', () => {
      expect(SecurityUtil.containsSuspiciousContent('onclick=alert("xss")')).toBe(true);
      expect(SecurityUtil.containsSuspiciousContent('onload=malicious()')).toBe(true);
    });

    test('should detect other suspicious patterns', () => {
      expect(SecurityUtil.containsSuspiciousContent('data:text/html,<script>')).toBe(true);
      expect(SecurityUtil.containsSuspiciousContent('vbscript:msgbox("xss")')).toBe(true);
      expect(SecurityUtil.containsSuspiciousContent('expression(alert("xss"))')).toBe(true);
      expect(SecurityUtil.containsSuspiciousContent('eval(malicious_code)')).toBe(true);
    });

    test('should not flag normal content', () => {
      expect(SecurityUtil.containsSuspiciousContent('This is normal text')).toBe(false);
      expect(SecurityUtil.containsSuspiciousContent('Task update: Please complete by 5 PM')).toBe(false);
      expect(SecurityUtil.containsSuspiciousContent('Meeting at 2:00 PM in conference room')).toBe(false);
    });
  });
});