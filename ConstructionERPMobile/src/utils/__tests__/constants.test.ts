// Basic test to verify testing setup
import { API_CONFIG, GPS_CONFIG, USER_ROLES } from '../constants';

describe('Constants', () => {
  it('should have correct API configuration', () => {
    expect(API_CONFIG.TIMEOUT).toBe(30000);
    expect(API_CONFIG.RETRY_ATTEMPTS).toBe(3);
  });

  it('should have correct GPS configuration', () => {
    expect(GPS_CONFIG.REQUIRED_ACCURACY).toBe(10);
    expect(GPS_CONFIG.LOCATION_TIMEOUT).toBe(15000);
  });

  it('should have correct user roles', () => {
    expect(USER_ROLES.WORKER).toBe('Worker');
    expect(USER_ROLES.SUPERVISOR).toBe('Supervisor');
    expect(USER_ROLES.DRIVER).toBe('Driver');
  });
});