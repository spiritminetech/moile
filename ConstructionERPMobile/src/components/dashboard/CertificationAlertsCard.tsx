// Certification Expiry Alerts Card - Display certification expiry warnings in dashboard
// Requirements: 8.3

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useCertificationAlerts } from '../../hooks/useCertificationAlerts';

interface CertificationAlert {
  certificationId: number;
  name: string;
  expiryDate: string;
  daysUntilExpiry: number;
  alertLevel: 'warning' | 'urgent' | 'expired';
}

interface CertificationAlertsCardProps {
  onViewProfile?: () => void;
}

const CertificationAlertsCard: React.FC<CertificationAlertsCardProps> = ({
  onViewProfile,
}) => {
  const { alerts, isLoading, error } = useCertificationAlerts();

  // Debug logging
  console.log('🏆 CertificationAlertsCard render:', {
    alertsCount: alerts?.length || 0,
    isLoading,
    error,
    alerts: alerts
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getAlertLevelColor = (level: string): string => {
    switch (level) {
      case 'warning':
        return '#FF9800';
      case 'urgent':
        return '#FF5722';
      case 'expired':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getAlertIcon = (level: string): string => {
    switch (level) {
      case 'warning':
        return '⚠️';
      case 'urgent':
        return '🚨';
      case 'expired':
        return '❌';
      default:
        return '📋';
    }
  };

  const handleAlertPress = (alert: CertificationAlert) => {
    const message = alert.alertLevel === 'expired' 
      ? `Your ${alert.name} certification expired on ${formatDate(alert.expiryDate)}. Please contact your supervisor for renewal instructions.`
      : `Your ${alert.name} certification expires in ${alert.daysUntilExpiry} days (${formatDate(alert.expiryDate)}). Please plan for renewal.`;

    Alert.alert(
      'Certification Alert',
      message,
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'View Profile', 
          style: 'default',
          onPress: onViewProfile 
        },
      ]
    );
  };

  const handleViewAllAlerts = () => {
    if (onViewProfile) {
      onViewProfile();
    }
  };

  // Always render the card with View Profile button
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Certification Alerts</Text>
        {alerts && alerts.length > 3 && (
          <TouchableOpacity onPress={handleViewAllAlerts}>
            <Text style={styles.viewAllText}>View All ({alerts?.length || 0})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Show loading state */}
      {isLoading && (
        <View style={styles.alertItem}>
          <Text style={styles.alertTitle}>Loading alerts...</Text>
          <Text style={styles.alertMessage}>Please wait</Text>
        </View>
      )}

      {/* Show error state */}
      {!isLoading && error && (
        <View style={styles.alertItem}>
          <Text style={styles.alertTitle}>Error loading alerts</Text>
          <Text style={styles.alertMessage}>{error}</Text>
        </View>
      )}

      {/* Show empty state */}
      {!isLoading && !error && (!alerts || alerts.length === 0) && (
        <View style={styles.alertItem}>
          <Text style={styles.alertTitle}>No certification alerts</Text>
          <Text style={styles.alertMessage}>All certifications are up to date</Text>
        </View>
      )}

      {/* Show alerts */}
      {!isLoading && !error && alerts && alerts.length > 0 && (
        <>
          {/* Sort alerts by severity and show top 3 */}
          {alerts
            .sort((a, b) => {
              const severityOrder = { expired: 3, urgent: 2, warning: 1 };
              return severityOrder[b.alertLevel] - severityOrder[a.alertLevel];
            })
            .slice(0, 3)
            .map((alert) => (
              <TouchableOpacity
                key={alert.certificationId}
                style={[
                  styles.alertItem,
                  { borderLeftColor: getAlertLevelColor(alert.alertLevel) }
                ]}
                onPress={() => handleAlertPress(alert)}
              >
                <View style={styles.alertContent}>
                  <View style={styles.alertHeader}>
                    <Text style={styles.alertIcon}>
                      {getAlertIcon(alert.alertLevel)}
                    </Text>
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertTitle} numberOfLines={1}>
                        {alert.name}
                      </Text>
                      <Text style={[
                        styles.alertMessage,
                        { color: getAlertLevelColor(alert.alertLevel) }
                      ]}>
                        {alert.alertLevel === 'expired' 
                          ? `Expired ${formatDate(alert.expiryDate)}`
                          : `Expires in ${alert.daysUntilExpiry} days`
                        }
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.alertBadge,
                    { backgroundColor: getAlertLevelColor(alert.alertLevel) }
                  ]}>
                    <Text style={styles.alertBadgeText}>
                      {alert.alertLevel.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
        </>
      )}

      {/* Simple View Profile text link */}
      <TouchableOpacity 
        style={styles.viewProfileButton} 
        onPress={handleViewAllAlerts}
      >
        <Text style={styles.viewProfileText}>
          View Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  alertItem: {
    borderLeftWidth: 4,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  alertContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 12,
    fontWeight: '500',
  },
  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewProfileButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  viewProfileText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
});

export default CertificationAlertsCard;