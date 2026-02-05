import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Context Providers
import { AuthProvider, useAuth } from './src/store/context/AuthContext';
import { LocationProvider } from './src/store/context/LocationContext';
import { OfflineProvider } from './src/store/context/OfflineContext';
import { SupervisorProvider } from './src/store/context/SupervisorContext';
import { DriverProvider } from './src/store/context/DriverContext';
import AppNavigator from './src/navigation/AppNavigator';

// Main App with all context providers
const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LocationProvider>
          <OfflineProvider>
            <SupervisorProvider>
              <DriverProvider>
                <AppContent />
                <StatusBar style="auto" />
              </DriverProvider>
            </SupervisorProvider>
          </OfflineProvider>
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

// App content that consumes auth state
const AppContent: React.FC = () => {
  const { state } = useAuth();

  // Debug: see auth state in console
  console.log('Auth State:', {
    isAuthenticated: state.isAuthenticated,
    userRole: state.user?.role || state.company?.role,
    isLoading: state.isLoading,
  });

  return (
    <AppNavigator
      isAuthenticated={state.isAuthenticated}
      userRole={state.user?.role || state.company?.role}
    />
  );
};

export default App;
