// Enhanced Supervisor-specific navigation with complete navigation structure
// Requirements: 1.1, 1.3, 1.4

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../store/context/AuthContext';
import { useSupervisorContext } from '../store/context/SupervisorContext';

// Import all supervisor screens
import SupervisorDashboard from '../screens/supervisor/SupervisorDashboard';
import TeamManagementScreen from '../screens/supervisor/TeamManagementScreen';
import AttendanceMonitoringScreen from '../screens/supervisor/AttendanceMonitoringScreen';
import TaskAssignmentScreen from '../screens/supervisor/TaskAssignmentScreen';
import ProgressReportScreen from '../screens/supervisor/ProgressReportScreen';
import ApprovalsScreen from '../screens/supervisor/ApprovalsScreen';
import MaterialsToolsScreen from '../screens/supervisor/MaterialsToolsScreen';
import SupervisorProfileScreen from '../screens/supervisor/SupervisorProfileScreen';
import IssueEscalationScreen from '../screens/supervisor/IssueEscalationScreen';

// Import shared screens that supervisors can access
import ChangePasswordScreen from '../screens/worker/ChangePasswordScreen';
import HelpSupportScreen from '../screens/worker/HelpSupportScreen';
import IssueReportScreen from '../screens/worker/IssueReportScreen';
import SafetyIncidentScreen from '../screens/worker/SafetyIncidentScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Permission codes for each screen
const SCREEN_PERMISSIONS = {
  DASHBOARD: 'SUPERVISOR_DASHBOARD_ACCESS',
  TEAM_MANAGEMENT: 'SUPERVISOR_TEAM_MANAGEMENT_VIEW',
  ATTENDANCE_MONITORING: 'SUPERVISOR_ATTENDANCE_MONITORING',
  TASK_ASSIGNMENT: 'SUPERVISOR_TASK_ASSIGNMENT',
  PROGRESS_REPORTS: 'SUPERVISOR_PROGRESS_REPORTING',
  APPROVALS: 'SUPERVISOR_REQUEST_APPROVAL',
  MATERIALS_TOOLS: 'SUPERVISOR_MATERIAL_MANAGEMENT',
};

// Navigation guard hook for role-based access control
const useNavigationGuard = () => {
  const { state: authState } = useAuth();
  const { state: supervisorState } = useSupervisorContext();

  const checkAccess = (requiredPermissions: string[] = []) => {
    // Check if user is authenticated and has supervisor role
    if (!authState.isAuthenticated || authState.user?.role !== 'Supervisor') {
      Alert.alert(
        'Access Denied',
        'You do not have permission to access this feature.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Check specific permissions if provided
    if (requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(permission =>
        authState.permissions?.includes(permission)
      );
      
      if (!hasPermission) {
        Alert.alert(
          'Insufficient Permissions',
          `You don't have permission to access this screen.\n\nRequired: ${requiredPermissions.join(' or ')}`,
          [{ text: 'OK' }]
        );
        return false;
      }
    }

    return true;
  };

  return { checkAccess };
};

// Enhanced Dashboard Stack Navigator with deep linking support
const DashboardStackNavigator = () => {
  const { checkAccess } = useNavigationGuard();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FF9800',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="DashboardMain"
        component={SupervisorDashboard}
        options={{
          title: 'Supervisor Dashboard',
          headerShown: false, // Dashboard has its own header
        }}
        listeners={{
          focus: () => {
            checkAccess([SCREEN_PERMISSIONS.DASHBOARD]);
          },
        }}
      />
    </Stack.Navigator>
  );
};

// Team Management Stack Navigator
const TeamStackNavigator = () => {
  const { checkAccess } = useNavigationGuard();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FF9800',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="TeamMain"
        component={TeamManagementScreen}
        options={{
          title: 'Team Management',
          headerShown: false, // Screen has its own header
        }}
        listeners={{
          focus: () => {
            checkAccess([SCREEN_PERMISSIONS.TEAM_MANAGEMENT]);
          },
        }}
      />
      <Stack.Screen
        name="AttendanceMonitoring"
        component={AttendanceMonitoringScreen}
        options={({ navigation }) => ({
          title: 'Attendance Monitoring',
          headerShown: false, // Screen has its own header
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 16 }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                ← Back
              </Text>
            </TouchableOpacity>
          ),
        })}
        listeners={{
          focus: () => {
            checkAccess([SCREEN_PERMISSIONS.ATTENDANCE_MONITORING]);
          },
        }}
      />
    </Stack.Navigator>
  );
};

// Task Assignment Stack Navigator
const TaskStackNavigator = () => {
  const { checkAccess } = useNavigationGuard();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FF9800',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="TaskAssignmentMain"
        component={TaskAssignmentScreen}
        options={{
          title: 'Task Assignment',
          headerShown: false, // Screen has its own header
        }}
        listeners={{
          focus: () => {
            checkAccess([SCREEN_PERMISSIONS.TASK_ASSIGNMENT]);
          },
        }}
      />
    </Stack.Navigator>
  );
};

// Progress Reports Stack Navigator
const ReportsStackNavigator = () => {
  const { checkAccess } = useNavigationGuard();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FF9800',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ReportsMain"
        component={ProgressReportScreen}
        options={{
          title: 'Progress Reports',
          headerShown: false, // Screen has its own header
        }}
        listeners={{
          focus: () => {
            checkAccess([SCREEN_PERMISSIONS.PROGRESS_REPORTS]);
          },
        }}
      />
    </Stack.Navigator>
  );
};

// Approvals Stack Navigator
const ApprovalsStackNavigator = () => {
  const { checkAccess } = useNavigationGuard();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FF9800',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ApprovalsMain"
        component={ApprovalsScreen}
        options={{
          title: 'Approvals',
          headerShown: false, // Screen has its own header
        }}
        listeners={{
          focus: () => {
            checkAccess([SCREEN_PERMISSIONS.APPROVALS]);
          },
        }}
      />
    </Stack.Navigator>
  );
};

// Materials & Tools Stack Navigator
const MaterialsStackNavigator = () => {
  const { checkAccess } = useNavigationGuard();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FF9800',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="MaterialsMain"
        component={MaterialsToolsScreen}
        options={{
          title: 'Materials & Tools',
          headerShown: false, // Screen has its own header
        }}
        listeners={{
          focus: () => {
            checkAccess([SCREEN_PERMISSIONS.MATERIALS_TOOLS]);
          },
        }}
      />
    </Stack.Navigator>
  );
};

// Profile Stack Navigator with enhanced functionality
const ProfileStackNavigator = () => {
  const { checkAccess } = useNavigationGuard();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FF9800',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={SupervisorProfileScreen}
        options={{
          title: 'Supervisor Profile',
          headerShown: false, // Screen has its own header
        }}
        listeners={{
          focus: () => {
            // Profile doesn't need specific permission, just supervisor role
            checkAccess();
          },
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          title: 'Change Password',
        }}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{
          title: 'Help & Support',
        }}
      />
      <Stack.Screen
        name="IssueReport"
        component={IssueReportScreen}
        options={{
          title: 'Report Issue',
        }}
      />
      <Stack.Screen
        name="IssueEscalation"
        component={IssueEscalationScreen}
        options={{
          title: 'Escalate Issue to Manager',
        }}
      />
      <Stack.Screen
        name="SafetyIncident"
        component={SafetyIncidentScreen}
        options={{
          title: 'Safety Incident Report',
        }}
      />
    </Stack.Navigator>
  );
};

// Main Supervisor Navigator with enhanced tab structure
const SupervisorNavigator: React.FC = () => {
  const { state: authState } = useAuth();
  const { state: supervisorState } = useSupervisorContext();

  // Role-based access control check
  React.useEffect(() => {
    if (authState.isAuthenticated && authState.user?.role !== 'Supervisor') {
      Alert.alert(
        'Access Denied',
        'This interface is only available to supervisors.',
        [{ text: 'OK' }]
      );
    }
  }, [authState.isAuthenticated, authState.user?.role]);

  // Don't render if user is not a supervisor
  if (!authState.isAuthenticated || authState.user?.role !== 'Supervisor') {
    return null;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF9800',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginBottom: -3,
        },
        // Enhanced tab bar options for better UX
        tabBarHideOnKeyboard: true,
        tabBarAllowFontScaling: false,
      }}
      // Deep linking configuration
      screenListeners={{
        tabPress: (e) => {
          // Add analytics or logging here if needed
          console.log('Supervisor tab pressed:', e.target);
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={{ 
              fontSize: focused ? 26 : 24, 
              color,
              transform: [{ scale: focused ? 1.1 : 1 }]
            }}>
              🏠
            </Text>
          ),
          tabBarLabel: 'Dashboard',
          // Badge for urgent alerts
          tabBarBadge: supervisorState.error ? '!' : undefined,
        }}
      />
      <Tab.Screen
        name="Team"
        component={TeamStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={{ 
              fontSize: focused ? 26 : 24, 
              color,
              transform: [{ scale: focused ? 1.1 : 1 }]
            }}>
              👥
            </Text>
          ),
          tabBarLabel: 'Team',
          // Badge for team alerts (attendance issues, etc.)
          tabBarBadge: supervisorState.teamMembers?.filter(m => 
            m.attendanceStatus === 'absent' || !m.location.insideGeofence
          ).length > 0 ? supervisorState.teamMembers?.filter(m => 
            m.attendanceStatus === 'absent' || !m.location.insideGeofence
          ).length : undefined,
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TaskStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={{ 
              fontSize: focused ? 26 : 24, 
              color,
              transform: [{ scale: focused ? 1.1 : 1 }]
            }}>
              📋
            </Text>
          ),
          tabBarLabel: 'Tasks',
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={{ 
              fontSize: focused ? 26 : 24, 
              color,
              transform: [{ scale: focused ? 1.1 : 1 }]
            }}>
              📊
            </Text>
          ),
          tabBarLabel: 'Reports',
        }}
      />
      <Tab.Screen
        name="Approvals"
        component={ApprovalsStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={{ 
              fontSize: focused ? 26 : 24, 
              color,
              transform: [{ scale: focused ? 1.1 : 1 }]
            }}>
              ✅
            </Text>
          ),
          tabBarLabel: 'Approvals',
          // Badge for pending approvals
          tabBarBadge: supervisorState.pendingApprovals?.length > 0 ? 
            supervisorState.pendingApprovals.length : undefined,
        }}
      />
      <Tab.Screen
        name="Materials"
        component={MaterialsStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={{ 
              fontSize: focused ? 26 : 24, 
              color,
              transform: [{ scale: focused ? 1.1 : 1 }]
            }}>
              🔧
            </Text>
          ),
          tabBarLabel: 'Materials',
          // Badge for urgent material requests
          tabBarBadge: supervisorState.materialRequests?.filter(r => 
            r.urgency === 'URGENT' || r.urgency === 'HIGH'
          ).length > 0 ? supervisorState.materialRequests?.filter(r => 
            r.urgency === 'URGENT' || r.urgency === 'HIGH'
          ).length : undefined,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={{ 
              fontSize: focused ? 26 : 24, 
              color,
              transform: [{ scale: focused ? 1.1 : 1 }]
            }}>
              👤
            </Text>
          ),
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default SupervisorNavigator;