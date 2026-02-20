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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { TEST_CREDENTIALS } from '../../services/api/mockApi';
import { API_CONFIG } from '../../utils/constants';
import NetworkDiagnostic from '../../components/debug/NetworkDiagnostic';

const LoginScreenSimple: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showNetworkDiagnostic, setShowNetworkDiagnostic] = useState(false);
  const { login, state } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <Text style={styles.title}>Construction ERP</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {/* API Status Indicator */}
        <View style={styles.apiStatusCard}>
          <Text style={styles.apiStatusTitle}>🌐 Real API Mode</Text>
          <Text style={styles.apiStatusText}>
            Connecting to: {API_CONFIG.BASE_URL}
          </Text>
          <TouchableOpacity
            style={styles.networkButton}
            onPress={() => setShowNetworkDiagnostic(true)}
          >
            <Text style={styles.networkButtonText}>🔍 Test Connection</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
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
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Test Credentials Buttons - Only show in development */}
          {__DEV__ && (
            <View style={styles.testCredentials}>
              <Text style={styles.testCredentialsTitle}>Development Test Credentials:</Text>
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
          <NetworkDiagnostic onUrlSelected={handleNetworkUrlSelected} />
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setShowNetworkDiagnostic(false)}
          >
            <Text style={styles.closeModalButtonText}>Close</Text>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
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
    marginBottom: 20,
  },
  apiStatusCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
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
    fontFamily: 'monospace',
  },
  networkButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
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
  input: {
    height: 60,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    color: '#212121',
  },
  loginButton: {
    height: 60,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginButtonDisabled: {
    backgroundColor: '#757575',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  testCredentials: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  testCredentialsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E65100',
    textAlign: 'center',
    marginBottom: 12,
  },
  testButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  testButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
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

export default LoginScreenSimple;