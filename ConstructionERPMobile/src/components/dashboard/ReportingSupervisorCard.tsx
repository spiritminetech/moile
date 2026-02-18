// Reporting Supervisor Card Component
// Displays supervisor contact information with call and message actions

import React from 'react';
import { View, Text, StyleSheet, Linking, Alert } from 'react-native';
import { ConstructionCard, ConstructionButton } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface ReportingSupervisorCardProps {
  supervisor: {
    id: number;
    name: string;
    phone: string;
    email?: string;
  } | null;
  isLoading?: boolean;
}

const ReportingSupervisorCard: React.FC<ReportingSupervisorCardProps> = ({
  supervisor,
  isLoading = false,
}) => {
  const handleCall = () => {
    if (!supervisor?.phone) {
      Alert.alert('Error', 'Supervisor phone number not available');
      return;
    }

    const phoneNumber = supervisor.phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const handleMessage = () => {
    if (!supervisor?.phone) {
      Alert.alert('Error', 'Supervisor phone number not available');
      return;
    }

    const phoneNumber = supervisor.phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`sms:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to open messaging app');
    });
  };

  if (isLoading) {
    return (
      <ConstructionCard
        title="👨‍🔧 Reporting Supervisor"
        variant="default"
        style={styles.card}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading supervisor information...</Text>
        </View>
      </ConstructionCard>
    );
  }

  if (!supervisor) {
    return (
      <ConstructionCard
        title="👨‍🔧 Reporting Supervisor"
        variant="default"
        style={styles.card}
      >
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No supervisor assigned</Text>
        </View>
      </ConstructionCard>
    );
  }

  return (
    <ConstructionCard
      title="👨‍🔧 Reporting Supervisor"
      variant="default"
      style={styles.card}
    >
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{supervisor.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Mobile:</Text>
          <Text style={styles.value}>{supervisor.phone}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <ConstructionButton
            title="Call"
            onPress={handleCall}
            variant="primary"
            size="small"
            icon="📞"
            style={styles.button}
          />
          <ConstructionButton
            title="Message"
            onPress={handleMessage}
            variant="secondary"
            size="small"
            icon="💬"
            style={styles.button}
          />
        </View>
      </View>
    </ConstructionCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  content: {
    gap: ConstructionTheme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ConstructionTheme.spacing.sm,
  },
  label: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: 'bold',
    minWidth: 70,
  },
  value: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.sm,
  },
  button: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: ConstructionTheme.spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  emptyContainer: {
    paddingVertical: ConstructionTheme.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
});

export default ReportingSupervisorCard;
