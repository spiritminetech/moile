import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LoginScreenMinimal: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Construction ERP</Text>
      <Text style={styles.subtitle}>Minimal Test Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
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
  },
});

export default LoginScreenMinimal;