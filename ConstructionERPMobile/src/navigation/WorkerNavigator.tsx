// Worker-specific navigation with bottom tabs

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, TouchableOpacity } from 'react-native';
import WorkerDashboard from '../screens/worker/WorkerDashboard';
import AttendanceScreen from '../screens/worker/AttendanceScreen';
import AttendanceHistoryScreen from '../screens/worker/AttendanceHistoryScreen';
import TodaysTasksScreen from '../screens/worker/TodaysTasksScreen';
import TaskProgressScreen from '../screens/worker/TaskProgressScreen';
import TaskLocationScreen from '../screens/worker/TaskLocationScreen';
import TaskHistoryScreen from '../screens/worker/TaskHistoryScreen';
import DailyReportScreen from '../screens/worker/DailyReportScreen';
import RequestsScreen from '../screens/worker/RequestsScreen';
import LeaveRequestScreen from '../screens/worker/LeaveRequestScreen';
import ToolRequestScreen from '../screens/worker/ToolRequestScreen';
import ReimbursementRequestScreen from '../screens/worker/ReimbursementRequestScreen';
import AdvancePaymentRequestScreen from '../screens/worker/AdvancePaymentRequestScreen';
import RequestHistoryScreen from '../screens/worker/RequestHistoryScreen';
import RequestDetailsScreen from '../screens/worker/RequestDetailsScreen';
import ProfileScreen from '../screens/worker/ProfileScreen';
import ChangePasswordScreen from '../screens/worker/ChangePasswordScreen';
import HelpSupportScreen from '../screens/worker/HelpSupportScreen';
import IssueReportScreen from '../screens/worker/IssueReportScreen';
import SafetyIncidentScreen from '../screens/worker/SafetyIncidentScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Profile Stack Navigator
const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{
          title: 'Profile',
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
        name="SafetyIncident"
        component={SafetyIncidentScreen}
        options={{
          title: 'Safety Incident',
        }}
      />
    </Stack.Navigator>
  );
};

// Tasks Stack Navigator
const TasksStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TasksMain"
        component={TodaysTasksScreen}
        options={({ navigation }) => ({
          title: "Today's Tasks",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('TaskHistory')}
              style={{ marginRight: 16 }}
            >
              <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '600' }}>
                History
              </Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="TaskHistory"
        component={TaskHistoryScreen}
        options={{
          title: 'Task History',
        }}
      />
      <Stack.Screen
        name="TaskProgress"
        component={TaskProgressScreen}
        options={{
          title: 'Update Progress',
        }}
      />
      <Stack.Screen
        name="TaskLocation"
        component={TaskLocationScreen}
        options={{
          title: 'Task Location',
        }}
      />
    </Stack.Navigator>
  );
};

// Request Stack Navigator
const RequestStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RequestsMain"
        component={RequestsScreen}
        options={{
          title: 'Requests',
        }}
      />
      <Stack.Screen
        name="LeaveRequest"
        component={LeaveRequestScreen}
        options={{
          title: 'Leave Request',
        }}
      />
      <Stack.Screen
        name="ToolRequest"
        component={ToolRequestScreen}
        options={{
          title: 'Tool Request',
        }}
      />
      <Stack.Screen
        name="ReimbursementRequest"
        component={ReimbursementRequestScreen}
        options={{
          title: 'Reimbursement Request',
        }}
      />
      <Stack.Screen
        name="AdvancePaymentRequest"
        component={AdvancePaymentRequestScreen}
        options={{
          title: 'Advance Payment Request',
        }}
      />
      <Stack.Screen
        name="RequestHistory"
        component={RequestHistoryScreen}
        options={{
          title: 'Request History',
        }}
      />
      <Stack.Screen
        name="RequestDetails"
        component={RequestDetailsScreen}
        options={{
          title: 'Request Details',
        }}
      />
    </Stack.Navigator>
  );
};

// Report Stack Navigator
const ReportStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ReportMain"
        component={DailyReportScreen}
        options={{
          title: 'Daily Report',
        }}
      />
    </Stack.Navigator>
  );
};

// Attendance Stack Navigator
const AttendanceStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AttendanceMain"
        component={AttendanceScreen}
        options={({ navigation }) => ({
          title: 'Attendance',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('AttendanceHistory')}
              style={{ marginRight: 16 }}
            >
              <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '600' }}>
                History
              </Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="AttendanceHistory"
        component={AttendanceHistoryScreen}
        options={{
          title: 'Attendance History',
        }}
      />
    </Stack.Navigator>
  );
};

const WorkerNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2196F3',
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
        component={WorkerDashboard}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksStackNavigator}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceStackNavigator}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>⏰</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportStackNavigator}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Requests"
        component={RequestStackNavigator}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>📝</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 24, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default WorkerNavigator;