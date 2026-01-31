// Property-based tests for validation utilities

import * as fc from 'fast-check';
import {
  validateGPSCoordinate,
  validatePercentage,
  validatePositiveNumber,
  validateNumeric,
} from '../validation';

describe('Validation Utilities - Property Tests', () => {
  describe('validateGPSCoordinate', () => {
    it('should accept any valid GPS coordinates', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -90, max: 90 }),
          fc.double({ min: -180, max: 180 }),
          (latitude, longitude) => {
            expect(validateGPSCoordinate(latitude, longitude)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject coordinates outside valid ranges', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.double({ min: 90.1, max: 180 }),
            fc.double({ min: -180, max: -90.1 })
          ),
          fc.double({ min: -180, max: 180 }),
          (invalidLatitude, longitude) => {
            expect(validateGPSCoordinate(invalidLatitude, longitude)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('validatePercentage', () => {
    it('should accept any value between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100 }),
          (percentage) => {
            expect(validatePercentage(percentage)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject values outside 0-100 range', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.double({ min: -1000, max: -0.1 }),
            fc.double({ min: 100.1, max: 1000 })
          ),
          (invalidPercentage) => {
            expect(validatePercentage(invalidPercentage)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('validatePositiveNumber', () => {
    it('should accept any positive number', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.1, max: 1000000 }),
          (positiveNumber) => {
            expect(validatePositiveNumber(positiveNumber)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject zero and negative numbers', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -1000, max: 0 }),
          (nonPositiveNumber) => {
            expect(validatePositiveNumber(nonPositiveNumber)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('validateNumeric', () => {
    it('should accept any valid numeric string', () => {
      fc.assert(
        fc.property(
          fc.double(),
          (number) => {
            const numberString = number.toString();
            expect(validateNumeric(numberString)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject non-numeric strings', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => isNaN(Number(s)) || !isFinite(Number(s))),
          (nonNumericString) => {
            expect(validateNumeric(nonNumericString)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});