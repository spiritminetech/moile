// Login Screen Component

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { COLORS, UI_CONSTANTS, API_CONFIG } from '../../utils/constants';
import { TEST_CREDENTIALS } from '../../services/api/mockApi';

/**
 * Login Screen Component
 * 
 * Features:
 * - Username/password input with validation
 * - Integration with AuthService through AuthContext
 * - Loading states and error handling
 * - Construction-optimized UI with large touch targets
 * - Keyboard handling for better UX
 */
const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, state } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    // 🔍 DEBUG: Log login form data
    console.log('📝 Login form submission:', {
      email: email.trim(),
      passwordLength: password.length,
      hasEmail: !!email.trim(),
      hasPassword: !!password.trim(),
    });

    try {
      await login({ email: email.trim(), password });
      // Navigation will be handled automatically by AppNavigator
      console.log('✅ Login form - success callback reached');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('❌ Login form error:', errorMessage);
      Alert.alert('Login Failed', errorMessage);
    }
  };

  const isLoading = Boolean(state.isLoading);

  const handleNetworkUrlSelected = (url: string) => {
    setShowNetworkDiagnostic(false);
    Alert.alert(
      'Network URL Selected',
      `Selected: ${url}\n\nTo use this permanently, update the BASE_URL in your constants file.`,
      [{ text: 'OK' }]
    );
  };

  const fillTestCredentials = (role: 'worker' | 'supervisor' | 'driver') => {
    const credentials = TEST_CREDENTIALS[role];
    setEmail(credentials.email);
    setPassword(credentials.password);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Construction ERP</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {/* Mock Mode Indicator */}
        {API_CONFIG.MOCK_MODE && (
          <View style={styles.mockModeIndicator}>
            <Text style={styles.mockModeText}>🎭 MOCK MODE - No Backend Required</Text>
          </View>
        )}

        {/* Network Diagnostic Button (Development Only) */}
        {__DEV__ && !API_CONFIG.MOCK_MODE && (
          <TouchableOpacity
            style={styles.networkButton}
            onPress={() => setShowNetworkDiagnostic(true)}
          >
            <Text style={styles.networkButtonText}>🔍 Network Diagnostic</Text>
          </TouchableOpacity>
        )}

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.TEXT_SECONDARY}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.TEXT_SECONDARY}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.SURFACE} />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Test Credentials Buttons (Mock Mode Only) */}
          {API_CONFIG.MOCK_MODE && (
            <View style={styles.testCredentials}>
              <Text style={styles.testCredentialsTitle}>Test Credentials:</Text>
              <View style={styles.testButtonsRow}>
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={() => fillTestCredentials('worker')}
                >
                  <Text style={styles.testButtonText}>Worker</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={() => fillTestCredentials('supervisor')}
                >
                  <Text style={styles.testButtonText}>Supervisor</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={() => fillTestCredentials('driver')}
                >
                  <Text style={styles.testButtonText}>Driver</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {state.error && (
            <Text style={styles.errorText}>{state.error}</Text>
          )}
        </View>

        {/* Network Diagnostic Modal */}
        <Modal
          visible={showNetworkDiagnostic}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <NetworkDiagnostic
            onUrlSelected={handleNetworkUrlSelected}
          />
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setShowNetworkDiagnostic(false)}
          >
            <Text style={styles.closeModalButtonText}>Close</Text>
          </TouchableOpacity>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: UI_CONSTANTS.SPACING.LG,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.SPACING.XL,
  },
  mockModeIndicator: {
    backgroundColor: COLORS.WARNING,
    padding: UI_CONSTANTS.SPACING.SM,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  mockModeText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12,
  },
  networkButton: {
    backgroundColor: COLORS.SECONDARY,
    padding: UI_CONSTANTS.SPACING.SM,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  networkButtonText: {
    color: COLORS.SURFACE,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12,
  },
  form: {
    width: '100%',
  },
  input: {
    height: UI_CONSTANTS.LARGE_BUTTON_HEIGHT,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    fontSize: 16,
    backgroundColor: COLORS.SURFACE,
    marginBottom: UI_CONSTANTS.SPACING.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  loginButton: {
    height: UI_CONSTANTS.LARGE_BUTTON_HEIGHT,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: UI_CONSTANTS.SPACING.MD,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.TEXT_SECONDARY,
  },
  loginButtonText: {
    color: COLORS.SURFACE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  testCredentials: {
    marginTop: UI_CONSTANTS.SPACING.LG,
    padding: UI_CONSTANTS.SPACING.MD,
    backgroundColor: COLORS.SURFACE,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  testCredentialsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  testButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  testButton: {
    backgroundColor: COLORS.SECONDARY,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    paddingVertical: UI_CONSTANTS.SPACING.SM,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    minWidth: 80,
  },
  testButtonText: {
    color: COLORS.SURFACE,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 14,
    textAlign: 'center',
    marginTop: UI_CONSTANTS.SPACING.MD,
  },
  closeModalButton: {
    backgroundColor: COLORS.ERROR,
    margin: UI_CONSTANTS.SPACING.MD,
    padding: UI_CONSTANTS.SPACING.MD,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: COLORS.SURFACE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;