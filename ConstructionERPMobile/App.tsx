import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/store/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Main App component wrapped with providers
const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

// App content that uses auth context
const AppContent: React.FC = () => {
  const { state } = useAuth();
  
  console.log('Auth State:', {
    isAuthenticated: state.isAuthenticated,
    userRole: state.user?.role || state.company?.role,
    isLoading: state.isLoading
  });

  return (
    <AppNavigator 
      isAuthenticated={state.isAuthenticated} 
      userRole={state.user?.role || state.company?.role} 
    />
  );
};

export default App;
