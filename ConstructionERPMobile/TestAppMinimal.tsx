import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Minimal test app to verify runtime issues are resolved
const TestAppMinimal: React.FC = () => {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Text style={styles.title}>Construction ERP Mobile</Text>
        <Text style={styles.subtitle}>Runtime Test - No Errors</Text>
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default TestAppMinimal;