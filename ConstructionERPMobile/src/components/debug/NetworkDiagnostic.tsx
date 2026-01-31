import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { getNetworkConfig, generateTestUrls, testConnection } from '../../utils/networkConfig';
import { COLORS, UI_CONSTANTS } from '../../utils/constants';

interface NetworkDiagnosticProps {
  onUrlSelected: (url: string) => void;
}

const NetworkDiagnostic: React.FC<NetworkDiagnosticProps> = ({ onUrlSelected }) => {
  const [testResults, setTestResults] = useState<{ url: string; working: boolean | null }[]>([]);
  const [testing, setTesting] = useState(false);
  const networkConfig = getNetworkConfig();

  useEffect(() => {
    const urls = generateTestUrls();
    setTestResults(urls.map(url => ({ url, working: null })));
  }, []);

  const testAllConnections = async () => {
    setTesting(true);
    const urls = generateTestUrls();
    const results = [];

    for (const url of urls) {
      const working = await testConnection(url);
      results.push({ url, working });
      
      // Update results incrementally
      setTestResults(current => 
        current.map(item => 
          item.url === url ? { ...item, working } : item
        )
      );
    }

    setTesting(false);

    // Show alert with results
    const workingUrls = results.filter(r => r.working);
    if (workingUrls.length > 0) {
      Alert.alert(
        'Connection Test Results',
        `Found ${workingUrls.length} working connection(s)!\n\nWorking URLs:\n${workingUrls.map(r => r.url).join('\n')}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'No Connections Found',
        'No backend servers were found. Make sure:\n\n1. Your backend server is running\n2. It\'s listening on the correct port\n3. Firewall allows connections\n4. You\'re using the correct IP address',
        [{ text: 'OK' }]
      );
    }
  };

  const selectUrl = (url: string) => {
    Alert.alert(
      'Use This URL?',
      `Do you want to use this API URL?\n\n${url}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Use This URL', 
          onPress: () => onUrlSelected(url)
        }
      ]
    );
  };

  const getStatusIcon = (working: boolean | null) => {
    if (working === null) return '⏳';
    return working ? '✅' : '❌';
  };

  const getStatusColor = (working: boolean | null) => {
    if (working === null) return COLORS.TEXT_SECONDARY;
    return working ? COLORS.SUCCESS : COLORS.ERROR;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Diagnostic</Text>
      
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Current Platform: {networkConfig.platform}</Text>
        <Text style={styles.infoText}>Recommended URL: {networkConfig.baseUrl}</Text>
      </View>

      <TouchableOpacity
        style={[styles.testButton, testing && styles.testButtonDisabled]}
        onPress={testAllConnections}
        disabled={testing}
      >
        <Text style={styles.testButtonText}>
          {testing ? 'Testing Connections...' : 'Test All Connections'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.resultItem,
              result.working && styles.workingResultItem
            ]}
            onPress={() => selectUrl(result.url)}
            disabled={!result.working}
          >
            <Text style={styles.statusIcon}>
              {getStatusIcon(result.working)}
            </Text>
            <Text 
              style={[
                styles.resultUrl,
                { color: getStatusColor(result.working) }
              ]}
            >
              {result.url}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>Need Help?</Text>
        <Text style={styles.helpText}>
          • Make sure your backend server is running{'\n'}
          • Check if port 5002 is open{'\n'}
          • Try using your computer's IP address{'\n'}
          • For Android emulator, use 10.0.2.2{'\n'}
          • For iOS simulator, localhost should work
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: UI_CONSTANTS.SPACING.MD,
    backgroundColor: COLORS.BACKGROUND,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  infoSection: {
    backgroundColor: COLORS.SURFACE,
    padding: UI_CONSTANTS.SPACING.MD,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  testButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: UI_CONSTANTS.SPACING.MD,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  testButtonDisabled: {
    backgroundColor: COLORS.TEXT_SECONDARY,
  },
  testButtonText: {
    color: COLORS.SURFACE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_CONSTANTS.SPACING.SM,
    backgroundColor: COLORS.SURFACE,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
    marginBottom: UI_CONSTANTS.SPACING.SM,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  workingResultItem: {
    borderColor: COLORS.SUCCESS,
    backgroundColor: '#f0fff0',
  },
  statusIcon: {
    fontSize: 16,
    marginRight: UI_CONSTANTS.SPACING.SM,
  },
  resultUrl: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  helpSection: {
    backgroundColor: COLORS.SURFACE,
    padding: UI_CONSTANTS.SPACING.MD,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  helpText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
});

export default NetworkDiagnostic;