// Overtime approval status component
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { OvertimeApprovalStatus, OvertimeManager } from '../../utils/timeValidation';
import { ConstructionButton, ConstructionCard } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface OvertimeApprovalProps {
  workerId: number;
  projectId: number;
  onApprovalChange: (status: OvertimeApprovalStatus) => void;
  showRequestButton?: boolean;
}

export const OvertimeApprovalComponent: React.FC<OvertimeApprovalProps> = ({
  workerId,
  projectId,
  onApprovalChange,
  showRequestButton = true,
}) => {
  const [approvalStatus, setApprovalStatus] = useState<OvertimeApprovalStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestReason, setRequestReason] = useState('');

  useEffect(() => {
    checkApprovalStatus();
  }, [workerId, projectId]);

  const checkApprovalStatus = async () => {
    setIsLoading(true);
    try {
      const status = await OvertimeManager.checkOvertimeApproval(workerId, projectId);
      setApprovalStatus(status);
      onApprovalChange(status);
    } catch (error) {
      console.error('Error checking overtime approval:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestApproval = async () => {
    if (!requestReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for overtime request');
      return;
    }

    setIsLoading(true);
    try {
      const success = await OvertimeManager.requestOvertimeApproval(
        workerId,
        projectId,
        requestReason
      );
      
      if (success) {
        Alert.alert(
          'Request Sent',
          'Your overtime request has been sent to your supervisor for approval.',
          [{ text: 'OK', onPress: () => setShowRequestModal(false) }]
        );
        setRequestReason('');
        // Refresh approval status
        setTimeout(checkApprovalStatus, 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send overtime request');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!approvalStatus) return ConstructionTheme.colors.onSurfaceVariant;
    
    switch (approvalStatus.status) {
      case 'approved':
        return ConstructionTheme.colors.success;
      case 'rejected':
        return ConstructionTheme.colors.error;
      case 'pending':
        return ConstructionTheme.colors.warning;
      default:
        return ConstructionTheme.colors.onSurfaceVariant;
    }
  };

  const getStatusIcon = () => {
    if (!approvalStatus) return '⏳';
    
    switch (approvalStatus.status) {
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  };

  const getStatusText = () => {
    if (!approvalStatus) return 'Checking approval status...';
    
    switch (approvalStatus.status) {
      case 'approved':
        return `Approved by ${approvalStatus.approvedBy || 'Supervisor'}`;
      case 'rejected':
        return 'Overtime request rejected';
      case 'pending':
        return 'Waiting for supervisor approval';
      default:
        return 'Unknown status';
    }
  };

  if (isLoading && !approvalStatus) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Checking overtime approval...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ConstructionCard
        title="Overtime Status"
        variant="outlined"
        style={styles.statusCard}
      >
        <View style={styles.statusRow}>
          <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
          <View style={styles.statusContent}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
            <Text style={styles.statusMessage}>
              {approvalStatus?.message}
            </Text>
            {approvalStatus?.approvedAt && (
              <Text style={styles.approvalTime}>
                Approved at: {new Date(approvalStatus.approvedAt).toLocaleString()}
              </Text>
            )}
          </View>
        </View>

        {showRequestButton && approvalStatus && !approvalStatus.isApproved && (
          <View style={styles.actionSection}>
            <ConstructionButton
              title="Request Overtime Approval"
              onPress={() => setShowRequestModal(true)}
              variant="secondary"
              size="medium"
              disabled={isLoading || approvalStatus.status === 'pending'}
            />
          </View>
        )}
      </ConstructionCard>

      {/* Request Modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Overtime Approval</Text>
            
            <Text style={styles.inputLabel}>Reason for overtime:</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter reason for overtime work..."
              value={requestReason}
              onChangeText={setRequestReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <ConstructionButton
                title="Cancel"
                onPress={() => setShowRequestModal(false)}
                variant="secondary"
                size="medium"
                style={styles.modalButton}
              />
              <ConstructionButton
                title="Send Request"
                onPress={handleRequestApproval}
                variant="primary"
                size="medium"
                loading={isLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: ConstructionTheme.spacing.sm,
  },
  loadingText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    padding: ConstructionTheme.spacing.md,
  },
  statusCard: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: ConstructionTheme.spacing.md,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: ConstructionTheme.spacing.md,
  },
  statusContent: {
    flex: 1,
  },
  statusText: {
    ...ConstructionTheme.typography.bodyLarge,
    fontWeight: '600',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  statusMessage: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  approvalTime: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  actionSection: {
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.surfaceVariant,
    paddingTop: ConstructionTheme.spacing.md,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingBottom: ConstructionTheme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.lg,
  },
  modalContent: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.lg,
    padding: ConstructionTheme.spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.lg,
    textAlign: 'center',
  },
  inputLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
    fontWeight: '600',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    backgroundColor: ConstructionTheme.colors.surface,
    minHeight: 100,
    marginBottom: ConstructionTheme.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ConstructionTheme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});

export default OvertimeApprovalComponent;