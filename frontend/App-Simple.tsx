import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Minimal test app to verify basic functionality
const App: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ App is working!</Text>
      <Text style={styles.subtext}>If you see this, the basic setup is fine.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
  },
});

export default App;
