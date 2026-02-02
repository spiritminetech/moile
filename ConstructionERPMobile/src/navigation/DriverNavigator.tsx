// Driver-specific navigation with bottom tabs

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import DriverDashboard from '../screens/driver/DriverDashboard';

const Tab = createBottomTabNavigator();

// Placeholder screens for driver features
const DeliveryRoutesScreen = () => (
  <Text style={{ flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 18 }}>
    Delivery Routes - Coming Soon
  </Text>
);

const LoadManagementScreen = () => (
  <Text style={{ flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 18 }}>
    Load Management - Coming Soon
  </Text>
);

const GPSTrackingScreen = () => (
  <Text style={{ flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 18 }}>
    GPS Tracking - Coming Soon
  </Text>
);

const TripReportsScreen = () => (
  <Text style={{ flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 18 }}>
    Trip Reports - Coming Soon
  </Text>
);

const ProfileScreen = () => (
  <Text style={{ flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 18 }}>
    Profile - Coming Soon
  </Text>
);

const DriverNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',
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
        component={DriverDashboard}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Routes"
        component={DeliveryRoutesScreen}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>🚛</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Load"
        component={LoadManagementScreen}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>📦</Text>
          ),
        }}
      />
      <Tab.Screen
        name="GPS"
        component={GPSTrackingScreen}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>📍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={TripReportsScreen}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>📋</Text>
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

export default DriverNavigator;