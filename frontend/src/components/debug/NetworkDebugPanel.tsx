import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import { networkLogger } from '../../utils/networkLogger';

interface NetworkDebugPanelProps {
  visible: boolean;
  onClose: () => void;
}

const NetworkDebugPanel: React.FC<NetworkDebugPanelProps> = ({ visible, onClose }) => {
  const [logs] = useState(() => networkLogger.getAllLogs());

  const clearLogs = () => {
    networkLogger.clearLogs();
    onClose();
  };

  const formatData = (data: any) => {
    if (!data) return 'None';
    return JSON.stringify(data, null, 2);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Network Debug Panel</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.logContainer}>
          {logs.length === 0 ? (
            <Text style={styles.noLogs}>No network requests logged yet</Text>
          ) : (
            logs.reverse().map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <Text style={styles.method}>{log.method}</Text>
                  <Text style={styles.url}>{log.url}</Text>
                  <Text style={styles.timestamp}>
                    {log.timestamp.toLocaleTimeString()}
                  </Text>
                </View>

                {log.responseStatus && (
                  <Text
                    style={[
                      styles.status,
                      log.responseStatus >= 400 ? styles.errorStatus : styles.successStatus,
                    ]}
                  >
                    Status: {log.responseStatus}
                  </Text>
                )}

                {log.requestData && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Request Data:</Text>
                    <Text style={styles.data}>{formatData(log.requestData)}</Text>
                  </View>
                )}

                {log.responseData && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Response Data:</Text>
                    <Text style={styles.data}>{formatData(log.responseData)}</Text>
                  </View>
                )}

                {log.error && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Error:</Text>
                    <Text style={styles.errorText}>{log.error}</Text>
                  </View>
                )}

                {log.duration && (
                  <Text style={styles.duration}>Duration: {log.duration}ms</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  closeButton: {
    backgroundColor: '#4ecdc4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    padding: 16,
  },
  noLogs: {
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  logItem: {
    backgroundColor: '#111',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4ecdc4',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  method: {
    color: '#4ecdc4',
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 50,
  },
  url: {
    color: '#fff',
    flex: 1,
    fontSize: 12,
  },
  timestamp: {
    color: '#888',
    fontSize: 10,
  },
  status: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successStatus: {
    color: '#4caf50',
  },
  errorStatus: {
    color: '#f44336',
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#4ecdc4',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  data: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#222',
    padding: 8,
    borderRadius: 4,
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
  },
  duration: {
    color: '#888',
    fontSize: 10,
    textAlign: 'right',
  },
});

export default NetworkDebugPanel;