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

// Time window validation for pickup/dropoff operations
export const validateTimeWindow = (
  currentTime: Date,
  scheduledTime: Date,
  windowMinutes: number = 30
): { isValid: boolean; message?: string } => {
  const timeDiff = Math.abs(currentTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
  
  if (timeDiff <= windowMinutes) {
    return { isValid: true };
  }
  
  const isEarly = currentTime.getTime() < scheduledTime.getTime();
  return {
    isValid: false,
    message: isEarly 
      ? `Too early. Pickup allowed ${windowMinutes} minutes before scheduled time.`
      : `Too late. Pickup window expired ${Math.floor(timeDiff - windowMinutes)} minutes ago.`
  };
};

// Geofence validation for specific locations
export const validateGeofence = (
  currentLocation: { latitude: number; longitude: number },
  targetLocation: { latitude: number; longitude: number; radius: number },
  locationName: string
): { isValid: boolean; distance?: number; message?: string } => {
  const distance = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    targetLocation.latitude,
    targetLocation.longitude
  );
  
  if (distance <= targetLocation.radius) {
    return { isValid: true, distance };
  }
  
  return {
    isValid: false,
    distance,
    message: `You are ${Math.round(distance)}m away from ${locationName}. Must be within ${targetLocation.radius}m.`
  };
};

// Calculate distance between two GPS coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Grace period validation for attendance
export const calculateGracePeriod = (
  delayMinutes: number,
  delayReason: string
): { gracePeriodMinutes: number; autoApproved: boolean; requiresApproval: boolean } => {
  const gracePeriodRules = {
    'traffic': { base: 15, max: 30, autoApprove: true },
    'weather': { base: 20, max: 45, autoApprove: true },
    'vehicle': { base: 30, max: 60, autoApprove: false },
    'accident': { base: 60, max: 120, autoApprove: false },
    'road_closure': { base: 25, max: 60, autoApprove: true },
    'fuel': { base: 10, max: 15, autoApprove: true },
    'other': { base: 10, max: 30, autoApprove: false }
  };
  
  const rule = gracePeriodRules[delayReason as keyof typeof gracePeriodRules] || gracePeriodRules.other;
  const gracePeriodMinutes = Math.min(Math.max(delayMinutes, rule.base), rule.max);
  
  return {
    gracePeriodMinutes,
    autoApproved: rule.autoApprove && delayMinutes <= rule.base,
    requiresApproval: !rule.autoApprove || delayMinutes > rule.base
  };
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

export const validatePasswordStrength = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (!validateRequired(password)) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (!validateMinLength(password, 8)) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validatePasswordChange = (
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
): ValidationResult => {
  const errors: string[] = [];

  if (!validateRequired(oldPassword)) {
    errors.push('Current password is required');
  }

  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  if (!validateRequired(confirmPassword)) {
    errors.push('Please confirm your new password');
  } else if (newPassword !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (oldPassword === newPassword) {
    errors.push('New password must be different from current password');
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