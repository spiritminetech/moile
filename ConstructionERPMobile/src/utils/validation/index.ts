// Validation utility functions

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{8,}$/;
  return phoneRegex.test(phone);
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

export const validateNumeric = (value: string): boolean => {
  return !isNaN(Number(value)) && isFinite(Number(value));
};

export const validatePositiveNumber = (value: number): boolean => {
  return value > 0;
};

export const validatePercentage = (value: number): boolean => {
  return value >= 0 && value <= 100;
};

export const validateGPSCoordinate = (latitude: number, longitude: number): boolean => {
  return (
    latitude >= -90 && 
    latitude <= 90 && 
    longitude >= -180 && 
    longitude <= 180
  );
};

export const validateGPSAccuracy = (accuracy: number, requiredAccuracy: number): boolean => {
  return accuracy <= requiredAccuracy;
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateLoginForm = (email: string, password: string): ValidationResult => {
  const errors: string[] = [];

  if (!validateRequired(email)) {
    errors.push('Email is required');
  } else if (!validateEmail(email)) {
    errors.push('Please enter a valid email address');
  }

  if (!validateRequired(password)) {
    errors.push('Password is required');
  } else if (!validateMinLength(password, 6)) {
    errors.push('Password must be at least 6 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateTaskProgress = (progress: number): ValidationResult => {
  const errors: string[] = [];

  if (!validateNumeric(progress.toString())) {
    errors.push('Progress must be a valid number');
  } else if (!validatePercentage(progress)) {
    errors.push('Progress must be between 0 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};