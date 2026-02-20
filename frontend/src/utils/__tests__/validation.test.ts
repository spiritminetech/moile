// Unit tests for validation utilities

import {
  validateEmail,
  validatePhone,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumeric,
  validatePositiveNumber,
  validatePercentage,
  validateGPSCoordinate,
  validateGPSAccuracy,
  validateLoginForm,
  validateTaskProgress,
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhone('+1234567890')).toBe(true);
      expect(validatePhone('(123) 456-7890')).toBe(true);
      expect(validatePhone('123-456-7890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should validate non-empty strings', () => {
      expect(validateRequired('test')).toBe(true);
      expect(validateRequired(' test ')).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('   ')).toBe(false);
    });
  });

  describe('validateGPSCoordinate', () => {
    it('should validate correct GPS coordinates', () => {
      expect(validateGPSCoordinate(40.7128, -74.0060)).toBe(true); // New York
      expect(validateGPSCoordinate(0, 0)).toBe(true); // Equator/Prime Meridian
      expect(validateGPSCoordinate(90, 180)).toBe(true); // Extreme valid values
      expect(validateGPSCoordinate(-90, -180)).toBe(true); // Extreme valid values
    });

    it('should reject invalid GPS coordinates', () => {
      expect(validateGPSCoordinate(91, 0)).toBe(false); // Invalid latitude
      expect(validateGPSCoordinate(-91, 0)).toBe(false); // Invalid latitude
      expect(validateGPSCoordinate(0, 181)).toBe(false); // Invalid longitude
      expect(validateGPSCoordinate(0, -181)).toBe(false); // Invalid longitude
    });
  });

  describe('validatePercentage', () => {
    it('should validate correct percentages', () => {
      expect(validatePercentage(0)).toBe(true);
      expect(validatePercentage(50)).toBe(true);
      expect(validatePercentage(100)).toBe(true);
    });

    it('should reject invalid percentages', () => {
      expect(validatePercentage(-1)).toBe(false);
      expect(validatePercentage(101)).toBe(false);
    });
  });

  describe('validateLoginForm', () => {
    it('should validate correct login form', () => {
      const result = validateLoginForm('test@example.com', 'password123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid login form', () => {
      const result = validateLoginForm('', '123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
      expect(result.errors).toContain('Password must be at least 6 characters long');
    });
  });

  describe('validateTaskProgress', () => {
    it('should validate correct task progress', () => {
      const result = validateTaskProgress(75);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid task progress', () => {
      const result = validateTaskProgress(150);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Progress must be between 0 and 100');
    });
  });
});