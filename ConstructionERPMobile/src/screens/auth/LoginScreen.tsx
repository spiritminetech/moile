// Construction-optimized login screen with enhanced UI/UX

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { TEST_CREDENTIALS } from '../../services/api/mockApi';
import { API_CONFIG } from '../../utils/constants';
import NetworkDiagnostic from '../../components/debug/NetworkDiagnostic';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showNetworkDiagnostic, setShowNetworkDiagnostic] = useState(false);
  const { login, state } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter both email and password');
      return;
    }

    console.log('📝 Login attempt:', { email: email.trim(), passwordLength: password.length });

    try {
      await login({ email: email.trim(), password });
      console.log('✅ Login successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('❌ Login error:', errorMessage);
      Alert.alert('Login Failed', errorMessage);
    }
  };

  const fillTestCredentials = (role: 'worker' | 'supervisor' | 'driver') => {
    const credentials = TEST_CREDENTIALS[role];
    setEmail(credentials.email);
    setPassword(credentials.password);
  };

  const handleNetworkUrlSelected = (url: string) => {
    setShowNetworkDiagnostic(false);
    Alert.alert(
      'Network URL Selected',
      `Selected: ${url}\n\nTo use this permanently, update the BASE_URL in your constants file.`,
      [{ text: 'OK' }]
    );
  };

  const isLoading = Boolean(state.isLoading);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.appIcon}>🏗️</Text>
            <Text style={styles.title}>Construction ERP</Text>
            <Text style={styles.subtitle}>Mobile Workforce Management</Text>
          </View>

          {/* API Status Indicator */}
          <View style={styles.apiStatusCard}>
            <Text style={styles.apiStatusTitle}>🌐 System Status</Text>
            <Text style={styles.apiStatusText}>
              Connected to: {API_CONFIG.BASE_URL}
            </Text>
            <TouchableOpacity
              style={styles.networkButton}
              onPress={() => setShowNetworkDiagnostic(true)}
            >
              <Text style={styles.networkButtonText}>🔍 Test Connection</Text>
            </TouchableOpacity>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Sign In</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={[styles.input, isLoading && styles.inputDisabled]}
                placeholder="Enter your email"
                placeholderTextColor="#9E9E9E"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!isLoading}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={[styles.input, isLoading && styles.inputDisabled]}
                placeholder="Enter your password"
                placeholderTextColor="#9E9E9E"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
            </View>

            {/* Construction-optimized large login button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFFFFF" size="large" />
                  <Text style={styles.loadingText}>Signing In...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>SIGN IN</Text>
              )}
            </TouchableOpacity>

            {/* Error Display */}
            {state.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{state.error}</Text>
              </View>
            )}

            {/* Test Credentials - Development Only */}
            {__DEV__ && (
              <View style={styles.testCredentials}>
                <Text style={styles.testCredentialsTitle}>Development Test Accounts</Text>
                <Text style={styles.testCredentialsSubtitle}>
                  Quick login for testing different roles
                </Text>
                <View style={styles.testButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.testButton, styles.workerButton]}
                    onPress={() => fillTestCredentials('worker')}
                    disabled={isLoading}
                  >
                    <Text style={styles.testButtonIcon}>👷</Text>
                    <Text style={styles.testButtonText}>Worker</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.testButton, styles.supervisorButton]}
                    onPress={() => fillTestCredentials('supervisor')}
                    disabled={isLoading}
                  >
                    <Text style={styles.testButtonIcon}>👨‍💼</Text>
                    <Text style={styles.testButtonText}>Supervisor</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.testButton, styles.driverButton]}
                    onPress={() => fillTestCredentials('driver')}
                    disabled={isLoading}
                  >
                    <Text style={styles.testButtonIcon}>🚛</Text>
                    <Text style={styles.testButtonText}>Driver</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Network Diagnostic Modal */}
        <Modal
          visible={showNetworkDiagnostic}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <NetworkDiagnostic onUrlSelected={handleNetworkUrlSelected} />
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setShowNetworkDiagnostic(false)}
          >
            <Text style={styles.closeModalButtonText}>Close</Text>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    fontWeight: '500',
  },
  apiStatusCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  apiStatusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  apiStatusText: {
    fontSize: 12,
    color: '#1565C0',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  networkButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  networkButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    height: 64, // Large touch target for construction site use
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 18, // Large text for outdoor visibility
    backgroundColor: '#FFFFFF',
    color: '#212121',
    fontWeight: '500',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#9E9E9E',
  },
  loginButton: {
    height: 72, // Extra large button for gloved hands
    backgroundColor: '#2196F3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#9E9E9E',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  errorText: {
    color: '#C62828',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  testCredentials: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFB74D',
  },
  testCredentialsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    textAlign: 'center',
    marginBottom: 4,
  },
  testCredentialsSubtitle: {
    fontSize: 12,
    color: '#F57C00',
    textAlign: 'center',
    marginBottom: 16,
  },
  testButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  testButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 64,
    justifyContent: 'center',
  },
  workerButton: {
    backgroundColor: '#2196F3',
  },
  supervisorButton: {
    backgroundColor: '#FF9800',
  },
  driverButton: {
    backgroundColor: '#4CAF50',
  },
  testButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeModalButton: {
    backgroundColor: '#F44336',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;