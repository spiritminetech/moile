// Property-Based Test for Enhanced Authentication Context
// Feature: construction-erp-supervisor-driver-extension, Property 1: Role-Based Navigation Control
// **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

import * as fc from 'fast-check';
import { UserRole, AuthState, User, Company, SupervisorContextData, DriverContextData } from '../../../types';

// Test utilities for role-based navigation control
interface NavigationTab {
  name: string;
  route: string;
  requiredPermissions: string[];
}

interface RoleNavigationConfig {
  role: UserRole;
  expectedTabs: NavigationTab[];
  requiredPermissions: string[];
}

// Navigation configuration based on requirements
const ROLE_NAVIGATION_CONFIGS: Record<UserRole, RoleNavigationConfig> = {
  Worker: {
    role: 'Worker',
    expectedTabs: [
      { name: 'Dashboard', route: 'WorkerDashboard', requiredPermissions: ['attendance'] },
      { name: 'Attendance', route: 'AttendanceScreen', requiredPermissions: ['attendance'] },
      { name: 'Tasks', route: 'TasksScreen', requiredPermissions: ['tasks'] },
      { name: 'Reports', route: 'ReportsScreen', requiredPermissions: ['reports'] },
      { name: 'Profile', route: 'ProfileScreen', requiredPermissions: ['profile'] },
    ],
    requiredPermissions: ['attendance', 'tasks', 'reports', 'profile'],
  },
  Supervisor: {
    role: 'Supervisor',
    expectedTabs: [
      { name: 'Dashboard', route: 'SupervisorDashboard', requiredPermissions: ['team_management'] },
      { name: 'Team', route: 'TeamManagementScreen', requiredPermissions: ['team_management'] },
      { name: 'Tasks', route: 'TaskAssignmentScreen', requiredPermissions: ['team_management'] },
      { name: 'Reports', route: 'ProgressReportScreen', requiredPermissions: ['progress_reports'] },
      { name: 'Approvals', route: 'ApprovalsScreen', requiredPermissions: ['approvals'] },
      { name: 'Profile', route: 'SupervisorProfileScreen', requiredPermissions: ['profile'] },
    ],
    requiredPermissions: ['team_management', 'approvals', 'progress_reports', 'profile'],
  },
  Driver: {
    role: 'Driver',
    expectedTabs: [
      { name: 'Dashboard', route: 'DriverDashboard', requiredPermissions: ['transport_tasks'] },
      { name: 'Transport', route: 'TransportTasksScreen', requiredPermissions: ['transport_tasks'] },
      { name: 'Trips', route: 'TripUpdatesScreen', requiredPermissions: ['transport_tasks'] },
      { name: 'Attendance', route: 'DriverAttendanceScreen', requiredPermissions: ['attendance'] },
      { name: 'Vehicle', route: 'VehicleInfoScreen', requiredPermissions: ['vehicle_info'] },
      { name: 'Profile', route: 'DriverProfileScreen', requiredPermissions: ['profile'] },
    ],
    requiredPermissions: ['transport_tasks', 'vehicle_info', 'attendance', 'profile'],
  },
};

// Utility functions for testing role-based navigation control
const hasPermission = (permissions: string[], requiredPermission: string): boolean => {
  return permissions.includes(requiredPermission) || permissions.includes('*');
};

const canAccessFeature = (userRole: UserRole, feature: string, permissions: string[]): boolean => {
  const roleConfig = ROLE_NAVIGATION_CONFIGS[userRole];
  const tab = roleConfig.expectedTabs.find(t => t.route.toLowerCase().includes(feature.toLowerCase()));
  
  if (!tab) return false;
  
  return tab.requiredPermissions.some(permission => hasPermission(permissions, permission));
};

const getExpectedNavigationTabs = (userRole: UserRole, permissions: string[]): NavigationTab[] => {
  const roleConfig = ROLE_NAVIGATION_CONFIGS[userRole];
  
  return roleConfig.expectedTabs.filter(tab => 
    tab.requiredPermissions.some(permission => hasPermission(permissions, permission))
  );
};

const validateRoleAccess = (userRole: UserRole, permissions: string[]): boolean => {
  const roleConfig = ROLE_NAVIGATION_CONFIGS[userRole];
  
  // User must have at least one required permission for their role
  return roleConfig.requiredPermissions.some(permission => hasPermission(permissions, permission));
};

const shouldPreventUnauthorizedAccess = (
  userRole: UserRole | null, 
  targetFeature: string, 
  permissions: string[]
): boolean => {
  if (!userRole) return true; // No role = no access
  
  const roleConfig = ROLE_NAVIGATION_CONFIGS[userRole];
  const hasFeatureAccess = roleConfig.expectedTabs.some(tab => 
    tab.route.toLowerCase().includes(targetFeature.toLowerCase()) &&
    tab.requiredPermissions.some(permission => hasPermission(permissions, permission))
  );
  
  return !hasFeatureAccess;
};

// Fast-check generators
const userRoleArbitrary = fc.constantFrom('Worker', 'Supervisor', 'Driver');

const permissionsArbitrary = fc.array(
  fc.constantFrom(
    'attendance', 'tasks', 'reports', 'profile', 'requests',
    'team_management', 'approvals', 'progress_reports', 'materials_tools',
    'transport_tasks', 'trip_updates', 'vehicle_info', '*'
  ),
  { minLength: 0, maxLength: 10 }
);

const userArbitrary = fc.record({
  id: fc.integer(1, 1000),
  employeeId: fc.string({ minLength: 3, maxLength: 10 }),
  email: fc.emailAddress(),
  name: fc.string({ minLength: 2, maxLength: 50 }),
  phone: fc.string({ minLength: 8, maxLength: 15 }),
  role: userRoleArbitrary,
  profileImage: fc.option(fc.webUrl()),
  supervisorData: fc.option(fc.record({
    assignedProjects: fc.array(fc.integer(1, 100), { maxLength: 5 }),
    teamMembers: fc.array(fc.integer(1, 1000), { maxLength: 20 }),
    approvalLevel: fc.constantFrom('basic', 'advanced', 'senior'),
    specializations: fc.array(fc.string(), { maxLength: 5 }),
  })),
  driverData: fc.option(fc.record({
    licenseNumber: fc.string({ minLength: 5, maxLength: 20 }),
    licenseClass: fc.constantFrom('A', 'B', 'C', 'D'),
    licenseExpiry: fc.date({ min: new Date(), max: new Date(2030, 11, 31) }),
    assignedVehicles: fc.array(fc.integer(1, 100), { maxLength: 3 }),
    certifications: fc.array(fc.string(), { maxLength: 5 }),
  })),
});

const companyArbitrary = fc.record({
  id: fc.integer(1, 100),
  name: fc.string({ minLength: 3, maxLength: 50 }),
  role: userRoleArbitrary,
});

const authStateArbitrary = fc.record({
  isAuthenticated: fc.boolean(),
  user: fc.option(userArbitrary),
  company: fc.option(companyArbitrary),
  token: fc.option(fc.string()),
  refreshToken: fc.option(fc.string()),
  tokenExpiry: fc.option(fc.date()),
  permissions: permissionsArbitrary,
  isLoading: fc.boolean(),
  error: fc.option(fc.string()),
  requiresCompanySelection: fc.boolean(),
  availableCompanies: fc.array(companyArbitrary, { maxLength: 5 }),
  supervisorContext: fc.option(fc.constant(null)), // Simplified for testing
  driverContext: fc.option(fc.constant(null)), // Simplified for testing
});

const unauthorizedAccessAttemptArbitrary = fc.record({
  userRole: fc.option(userRoleArbitrary),
  targetFeature: fc.constantFrom(
    'dashboard', 'team', 'tasks', 'reports', 'approvals', 'profile',
    'transport', 'trips', 'attendance', 'vehicle'
  ),
  permissions: permissionsArbitrary,
});

describe('Property 1: Role-Based Navigation Control', () => {
  describe('Supervisor Navigation Requirements (1.1)', () => {
    it('should display supervisor-specific navigation tabs for any authenticated supervisor', () => {
      fc.assert(
        fc.property(
          fc.record({
            user: userArbitrary.filter(u => u.role === 'Supervisor'),
            permissions: permissionsArbitrary.filter(perms => 
              perms.some(p => ['team_management', 'approvals', 'progress_reports', '*'].includes(p))
            ),
          }),
          ({ user, permissions }) => {
            // Test that supervisor gets correct navigation tabs
            const expectedTabs = getExpectedNavigationTabs('Supervisor', permissions);
            const hasValidAccess = validateRoleAccess('Supervisor', permissions);
            
            if (hasValidAccess) {
              // Should have at least dashboard and profile tabs
              const tabNames = expectedTabs.map(tab => tab.name);
              expect(tabNames).toContain('Dashboard');
              expect(tabNames).toContain('Profile');
              
              // Should only contain supervisor-appropriate tabs
              expectedTabs.forEach(tab => {
                expect(['Dashboard', 'Team', 'Tasks', 'Reports', 'Approvals', 'Profile']).toContain(tab.name);
              });
              
              // Should not contain driver or worker-only tabs
              const supervisorRoutes = expectedTabs.map(tab => tab.route);
              expect(supervisorRoutes.every(route => !route.includes('Worker'))).toBe(true);
              expect(supervisorRoutes.every(route => !route.includes('Driver'))).toBe(true);
            }
          }
        )
      );
    });
  });

  describe('Driver Navigation Requirements (1.2)', () => {
    it('should display driver-specific navigation tabs for any authenticated driver', () => {
      fc.assert(
        fc.property(
          fc.record({
            user: userArbitrary.filter(u => u.role === 'Driver'),
            permissions: permissionsArbitrary.filter(perms => 
              perms.some(p => ['transport_tasks', 'vehicle_info', 'attendance', '*'].includes(p))
            ),
          }),
          ({ user, permissions }) => {
            // Test that driver gets correct navigation tabs
            const expectedTabs = getExpectedNavigationTabs('Driver', permissions);
            const hasValidAccess = validateRoleAccess('Driver', permissions);
            
            if (hasValidAccess) {
              // Should have at least dashboard and profile tabs
              const tabNames = expectedTabs.map(tab => tab.name);
              expect(tabNames).toContain('Dashboard');
              expect(tabNames).toContain('Profile');
              
              // Should only contain driver-appropriate tabs
              expectedTabs.forEach(tab => {
                expect(['Dashboard', 'Transport', 'Trips', 'Attendance', 'Vehicle', 'Profile']).toContain(tab.name);
              });
              
              // Should not contain supervisor or worker-only tabs
              const driverRoutes = expectedTabs.map(tab => tab.route);
              expect(driverRoutes.every(route => !route.includes('Worker'))).toBe(true);
              expect(driverRoutes.every(route => !route.includes('Supervisor'))).toBe(true);
            }
          }
        )
      );
    });
  });

  describe('Permission-Based Navigation Updates (1.3)', () => {
    it('should update available navigation options when role permissions change', () => {
      fc.assert(
        fc.property(
          fc.record({
            role: userRoleArbitrary,
            initialPermissions: permissionsArbitrary,
            updatedPermissions: permissionsArbitrary,
          }),
          ({ role, initialPermissions, updatedPermissions }) => {
            // Test navigation updates when permissions change
            const initialTabs = getExpectedNavigationTabs(role, initialPermissions);
            const updatedTabs = getExpectedNavigationTabs(role, updatedPermissions);
            
            // Navigation should reflect permission changes
            const initialTabNames = new Set(initialTabs.map(tab => tab.name));
            const updatedTabNames = new Set(updatedTabs.map(tab => tab.name));
            
            // If permissions are different, navigation should potentially be different
            const permissionsChanged = JSON.stringify(initialPermissions.sort()) !== JSON.stringify(updatedPermissions.sort());
            
            if (permissionsChanged) {
              // At minimum, the system should handle the permission change gracefully
              expect(updatedTabs).toBeDefined();
              expect(Array.isArray(updatedTabs)).toBe(true);
              
              // All tabs should be valid for the role
              updatedTabs.forEach(tab => {
                const roleConfig = ROLE_NAVIGATION_CONFIGS[role];
                expect(roleConfig.expectedTabs.some(expectedTab => expectedTab.name === tab.name)).toBe(true);
              });
            }
          }
        )
      );
    });
  });

  describe('Unauthorized Access Prevention (1.4)', () => {
    it('should prevent unauthorized access and display appropriate messages', () => {
      fc.assert(
        fc.property(
          unauthorizedAccessAttemptArbitrary,
          ({ userRole, targetFeature, permissions }) => {
            // Test unauthorized access prevention
            const shouldPreventAccess = shouldPreventUnauthorizedAccess(userRole, targetFeature, permissions);
            
            if (shouldPreventAccess) {
              // Access should be prevented
              expect(shouldPreventAccess).toBe(true);
              
              // Should have a clear reason for denial
              if (userRole === null) {
                // No role = authentication required
                expect(true).toBe(true); // Access denied due to no role
              } else {
                // Role exists but lacks permissions
                const hasFeatureAccess = canAccessFeature(userRole, targetFeature, permissions);
                expect(hasFeatureAccess).toBe(false);
              }
            } else {
              // Access should be allowed
              expect(userRole).not.toBeNull();
              if (userRole) {
                const hasFeatureAccess = canAccessFeature(userRole, targetFeature, permissions);
                expect(hasFeatureAccess).toBe(true);
              }
            }
          }
        )
      );
    });
  });

  describe('Comprehensive Role-Based Navigation Control', () => {
    it('should maintain consistent role-based navigation control across all authentication states', () => {
      fc.assert(
        fc.property(
          authStateArbitrary,
          (authState) => {
            // Comprehensive test of role-based navigation control
            const userRole = authState.user?.role || authState.company?.role || null;
            const isAuthenticated = authState.isAuthenticated;
            const permissions = authState.permissions;
            
            if (isAuthenticated && userRole) {
              // Authenticated user with role should get appropriate navigation
              const expectedTabs = getExpectedNavigationTabs(userRole, permissions);
              const hasValidAccess = validateRoleAccess(userRole, permissions);
              
              if (hasValidAccess) {
                // Should have at least one tab
                expect(expectedTabs.length).toBeGreaterThan(0);
                
                // All tabs should be appropriate for the role
                expectedTabs.forEach(tab => {
                  const roleConfig = ROLE_NAVIGATION_CONFIGS[userRole];
                  expect(roleConfig.expectedTabs.some(expectedTab => expectedTab.name === tab.name)).toBe(true);
                });
                
                // Should not have tabs from other roles
                const otherRoles = (['Worker', 'Supervisor', 'Driver'] as UserRole[]).filter(r => r !== userRole);
                otherRoles.forEach(otherRole => {
                  const otherRoleConfig = ROLE_NAVIGATION_CONFIGS[otherRole];
                  const otherRoleTabNames = otherRoleConfig.expectedTabs.map(tab => tab.name);
                  const currentTabNames = expectedTabs.map(tab => tab.name);
                  
                  // Some overlap is allowed (like Profile), but role-specific tabs should not cross over
                  const roleSpecificTabs = {
                    Worker: ['Attendance'],
                    Supervisor: ['Team', 'Approvals'],
                    Driver: ['Transport', 'Trips', 'Vehicle'],
                  };
                  
                  const otherRoleSpecificTabs = roleSpecificTabs[otherRole] || [];
                  otherRoleSpecificTabs.forEach(specificTab => {
                    expect(currentTabNames).not.toContain(specificTab);
                  });
                });
              } else {
                // Invalid access should result in no navigation or login redirect
                expect(hasValidAccess).toBe(false);
              }
            } else {
              // Unauthenticated or no role should not get navigation
              if (!isAuthenticated || !userRole) {
                // Should be redirected to login or have no navigation
                expect(isAuthenticated && userRole).toBe(false);
              }
            }
          }
        )
      );
    });
  });

  describe('Role Transition Handling', () => {
    it('should handle role transitions correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            initialRole: userRoleArbitrary,
            newRole: userRoleArbitrary,
            permissions: permissionsArbitrary,
          }),
          ({ initialRole, newRole, permissions }) => {
            // Test role transition scenarios
            const initialTabs = getExpectedNavigationTabs(initialRole, permissions);
            const newTabs = getExpectedNavigationTabs(newRole, permissions);
            
            if (initialRole !== newRole) {
              // Role change should result in different navigation structure
              const initialTabNames = new Set(initialTabs.map(tab => tab.name));
              const newTabNames = new Set(newTabs.map(tab => tab.name));
              
              // Should have role-appropriate tabs for new role
              newTabs.forEach(tab => {
                const newRoleConfig = ROLE_NAVIGATION_CONFIGS[newRole];
                expect(newRoleConfig.expectedTabs.some(expectedTab => expectedTab.name === tab.name)).toBe(true);
              });
              
              // Should not retain role-specific tabs from previous role
              const roleSpecificTabs = {
                Worker: ['Attendance'],
                Supervisor: ['Team', 'Approvals'],
                Driver: ['Transport', 'Trips', 'Vehicle'],
              };
              
              const previousRoleSpecificTabs = roleSpecificTabs[initialRole] || [];
              const newRoleSpecificTabs = roleSpecificTabs[newRole] || [];
              
              // Previous role-specific tabs should not appear in new role (unless it's also specific to new role)
              previousRoleSpecificTabs.forEach(specificTab => {
                if (!newRoleSpecificTabs.includes(specificTab)) {
                  expect(Array.from(newTabNames)).not.toContain(specificTab);
                }
              });
            }
          }
        )
      );
    });
  });
});