// Supervisor-specific navigation with bottom tabs

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import SupervisorDashboard from '../screens/supervisor/SupervisorDashboard';

const Tab = createBottomTabNavigator();

// Placeholder screens for supervisor features
const TeamManagementScreen = () => (
  <Text style={{ flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 18 }}>
    Team Management - Coming Soon
  </Text>
);

const TaskAssignmentScreen = () => (
  <Text style={{ flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 18 }}>
    Task Assignment - Coming Soon
  </Text>
);

const ProgressReportsScreen = () => (
  <Text style={{ flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 18 }}>
    Progress Reports - Coming Soon
  </Text>
);

const ApprovalsScreen = () => (
  <Text style={{ flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 18 }}>
    Approvals - Coming Soon
  </Text>
);

const ProfileScreen = () => (
  <Text style={{ flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 18 }}>
    Profile - Coming Soon
  </Text>
);

const SupervisorNavigator: React.FC = () => {
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
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginBottom: -3,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={SupervisorDashboard}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Team"
        component={TeamManagementScreen}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>👥</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Assign"
        component={TaskAssignmentScreen}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ProgressReportsScreen}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Approvals"
        component={ApprovalsScreen}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>✅</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default SupervisorNavigator;