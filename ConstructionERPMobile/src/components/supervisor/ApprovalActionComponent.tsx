// Approval Action Component for Supervisor Request Processing
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { PendingApproval } from '../../types';
import ConstructionCard from '../common/ConstructionCard';
import ConstructionInput from '../common/ConstructionInput';
import ConstructionButton from '../common/ConstructionButton';
import ConstructionSelector from '../common/ConstructionSelector';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface ApprovalActionComponentProps {
  approval: PendingApproval;
  onApprove: (approvalId: number, notes?: string) => Promise<void>;
  onReject: (approvalId: number, reason: string) => Promise<void>;
  onEscalate?: (approvalId: number, reason: string) => Promise<void>;
  onViewDetails?: (approval: PendingApproval) => void;
  isLoading?: boolean;
  showActions?: boolean;
}

const ApprovalActionComponent: React.FC<ApprovalActionComponentProps> = ({
  approval,
  onApprove,
  onReject,
  onEscalate,
  onViewDetails,
  isLoading = false,
  showActions = true,
}) => {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [selectedRejectionCategory, setSelectedRejectionCategory] = useState('');

  const getRequestTypeIcon = (type: PendingApproval['requestType']): string => {
    switch (type) {
      case 'leave':
        return '🏖️';
      case 'material':
        return '📦';
      case 'tool':
        return '🔧';
      case 'reimbursement':
        return '💰';
      case 'advance_payment':
        return '💳';
      default:
        return '📋';
    }
  };

  const getUrgencyColor = (urgency: PendingApproval['urgency']): string => {
    switch (urgency) {
      case 'urgent':
        return ConstructionTheme.colors.error;
      case 'high':
        return ConstructionTheme.colors.warning;
      case 'normal':
        return ConstructionTheme.colors.info;
      case 'low':
        return ConstructionTheme.colors.success;
      default:
        return ConstructionTheme.colors.neutral;
    }
  };

  const getUrgencyIcon = (urgency: PendingApproval['urgency']): string => {
    switch (urgency) {
      case 'urgent':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'normal':
        return '📋';
      case 'low':
        return '✅';
      default:
        return '📋';
    }
  };

  const formatRequestDate = (date: Date): string => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const isOverdue = (): boolean => {
    if (!approval.approvalDeadline) return false;
    return new Date() > approval.approvalDeadline;
  };

  const handleApprove = async () => {
    try {
      await onApprove(approval.id, approvalNotes);
      setShowApprovalModal(false);
      setApprovalNotes('');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve request. Please try again.');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    try {
      await onReject(approval.id, rejectionReason);
      setShowRejectionModal(false);
      setRejectionReason('');
      setSelectedRejectionCategory('');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request. Please try again.');
    }
  };

  const handleEscalate = async () => {
    if (!escalationReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for escalation');
      return;
    }

    try {
      if (onEscalate) {
        await onEscalate(approval.id, escalationReason);
      }
      setShowEscalationModal(false);
      setEscalationReason('');
    } catch (error) {
      Alert.alert('Error', 'Failed to escalate request. Please try again.');
    }
  };

  const rejectionCategories = [
    { label: 'Insufficient Information', value: 'insufficient_info' },
    { label: 'Budget Constraints', value: 'budget' },
    { label: 'Policy Violation', value: 'policy' },
    { label: 'Timing Issues', value: 'timing' },
    { label: 'Resource Unavailable', value: 'resource' },
    { label: 'Safety Concerns', value: 'safety' },
    { label: 'Other', value: 'other' },
  ];

  const renderRequestDetails = () => {
    const details = approval.details;
    
    switch (approval.requestType) {
      case 'leave':
        return (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailLabel}>Leave Type:</Text>
            <Text style={styles.detailValue}>{details?.leaveType || 'Not specified'}</Text>
            
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>
              {details?.startDate} to {details?.endDate} ({details?.duration} days)
            </Text>
            
            <Text style={styles.detailLabel}>Reason:</Text>
            <Text style={styles.detailValue}>{details?.reason || 'Not provided'}</Text>
          </View>
        );
        
      case 'material':
        return (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailLabel}>Material:</Text>
            <Text style={styles.detailValue}>{details?.itemName}</Text>
            
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{details?.quantity} {details?.unit}</Text>
            
            <Text style={styles.detailLabel}>Purpose:</Text>
            <Text style={styles.detailValue}>{details?.purpose}</Text>
          </View>
        );
        
      case 'tool':
        return (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailLabel}>Tool:</Text>
            <Text style={styles.detailValue}>{details?.toolName}</Text>
            
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{details?.duration} days</Text>
            
            <Text style={styles.detailLabel}>Purpose:</Text>
            <Text style={styles.detailValue}>{details?.purpose}</Text>
          </View>
        );
        
      case 'reimbursement':
        return (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>${details?.amount}</Text>
            
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{details?.category}</Text>
            
            <Text style={styles.detailLabel}>Description:</Text>
            <Text style={styles.detailValue}>{details?.description}</Text>
          </View>
        );
        
      case 'advance_payment':
        return (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>${details?.amount}</Text>
            
            <Text style={styles.detailLabel}>Reason:</Text>
            <Text style={styles.detailValue}>{details?.reason}</Text>
            
            <Text style={styles.detailLabel}>Repayment Plan:</Text>
            <Text style={styles.detailValue}>{details?.repaymentPlan}</Text>
          </View>
        );
        
      default:
        return (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailValue}>
              {JSON.stringify(details, null, 2)}
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <ConstructionCard
        variant={isOverdue() ? 'error' : approval.urgency === 'urgent' ? 'warning' : 'default'}
        style={styles.approvalCard}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => onViewDetails?.(approval)}
          activeOpacity={0.7}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.requestInfo}>
              <Text style={styles.requestIcon}>
                {getRequestTypeIcon(approval.requestType)}
              </Text>
              <View style={styles.requestDetails}>
                <Text style={styles.requestTitle}>
                  {approval.requestType.replace('_', ' ').toUpperCase()} REQUEST
                </Text>
                <Text style={styles.requesterName}>
                  From: {approval.requesterName}
                </Text>
              </View>
            </View>
            
            <View style={styles.urgencyContainer}>
              <Text style={styles.urgencyIcon}>
                {getUrgencyIcon(approval.urgency)}
              </Text>
              <Text style={[
                styles.urgencyText,
                { color: getUrgencyColor(approval.urgency) }
              ]}>
                {approval.urgency.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Request Details */}
          {renderRequestDetails()}

          {/* Meta Information */}
          <View style={styles.metaInfo}>
            <Text style={styles.metaText}>
              Requested: {formatRequestDate(approval.requestDate)}
            </Text>
            
            {approval.estimatedCost && (
              <Text style={styles.metaText}>
                Estimated Cost: ${approval.estimatedCost.toLocaleString()}
              </Text>
            )}
            
            {approval.approvalDeadline && (
              <Text style={[
                styles.metaText,
                isOverdue() && styles.overdueText
              ]}>
                Deadline: {approval.approvalDeadline.toLocaleDateString()}
                {isOverdue() && ' (OVERDUE)'}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          {showActions && (
            <View style={styles.actionButtons}>
              <ConstructionButton
                title="Approve"
                onPress={() => setShowApprovalModal(true)}
                variant="success"
                size="small"
                style={styles.actionButton}
                disabled={isLoading}
                icon="✅"
              />
              
              <ConstructionButton
                title="Reject"
                onPress={() => setShowRejectionModal(true)}
                variant="error"
                size="small"
                style={styles.actionButton}
                disabled={isLoading}
                icon="❌"
              />
              
              {onEscalate && (
                <ConstructionButton
                  title="Escalate"
                  onPress={() => setShowEscalationModal(true)}
                  variant="warning"
                  size="small"
                  style={styles.actionButton}
                  disabled={isLoading}
                  icon="⬆️"
                />
              )}
            </View>
          )}
        </TouchableOpacity>
      </ConstructionCard>

      {/* Approval Modal */}
      <Modal
        visible={showApprovalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApprovalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Approve Request</Text>
            
            <Text style={styles.modalSubtitle}>
              {approval.requestType.replace('_', ' ').toUpperCase()} from {approval.requesterName}
            </Text>
            
            <ConstructionInput
              label="Approval Notes (Optional)"
              value={approvalNotes}
              onChangeText={setApprovalNotes}
              placeholder="Add any notes or conditions..."
              multiline
              numberOfLines={3}
              maxLength={300}
              showCharacterCount
            />
            
            <View style={styles.modalActions}>
              <ConstructionButton
                title="Cancel"
                onPress={() => setShowApprovalModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              
              <ConstructionButton
                title="Approve"
                onPress={handleApprove}
                variant="success"
                style={styles.modalButton}
                loading={isLoading}
                icon="✅"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        visible={showRejectionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Request</Text>
            
            <Text style={styles.modalSubtitle}>
              {approval.requestType.replace('_', ' ').toUpperCase()} from {approval.requesterName}
            </Text>
            
            <ConstructionSelector
              label="Rejection Category"
              value={selectedRejectionCategory}
              options={rejectionCategories}
              onSelect={setSelectedRejectionCategory}
              placeholder="Select rejection reason"
            />
            
            <ConstructionInput
              label="Rejection Reason *"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Provide detailed reason for rejection..."
              multiline
              numberOfLines={4}
              maxLength={500}
              showCharacterCount
              required
            />
            
            <View style={styles.modalActions}>
              <ConstructionButton
                title="Cancel"
                onPress={() => setShowRejectionModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              
              <ConstructionButton
                title="Reject"
                onPress={handleReject}
                variant="error"
                style={styles.modalButton}
                loading={isLoading}
                icon="❌"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Escalation Modal */}
      {onEscalate && (
        <Modal
          visible={showEscalationModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEscalationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Escalate Request</Text>
              
              <Text style={styles.modalSubtitle}>
                {approval.requestType.replace('_', ' ').toUpperCase()} from {approval.requesterName}
              </Text>
              
              <ConstructionInput
                label="Escalation Reason *"
                value={escalationReason}
                onChangeText={setEscalationReason}
                placeholder="Why does this request need escalation?"
                multiline
                numberOfLines={4}
                maxLength={500}
                showCharacterCount
                required
              />
              
              <View style={styles.modalActions}>
                <ConstructionButton
                  title="Cancel"
                  onPress={() => setShowEscalationModal(false)}
                  variant="outline"
                  style={styles.modalButton}
                />
                
                <ConstructionButton
                  title="Escalate"
                  onPress={handleEscalate}
                  variant="warning"
                  style={styles.modalButton}
                  loading={isLoading}
                  icon="⬆️"
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  approvalCard: {
    marginBottom: 0,
  },
  cardContent: {
    padding: ConstructionTheme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.md,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestIcon: {
    fontSize: ConstructionTheme.dimensions.iconLarge,
    marginRight: ConstructionTheme.spacing.md,
  },
  requestDetails: {
    flex: 1,
  },
  requestTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  requesterName: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  urgencyContainer: {
    alignItems: 'center',
  },
  urgencyIcon: {
    fontSize: ConstructionTheme.dimensions.iconMedium,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  urgencyText: {
    ...ConstructionTheme.typography.labelSmall,
    fontWeight: '600',
  },
  detailsContainer: {
    marginBottom: ConstructionTheme.spacing.md,
    padding: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  detailLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
    marginTop: ConstructionTheme.spacing.sm,
  },
  detailValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
  },
  metaInfo: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  metaText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  overdueText: {
    color: ConstructionTheme.colors.error,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.lg,
    padding: ConstructionTheme.spacing.lg,
    width: '90%',
    maxHeight: '80%',
    ...ConstructionTheme.shadows.large,
  },
  modalTitle: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.lg,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
});

export default ApprovalActionComponent;