// ApprovalQueueCard Component - Pending request management for supervisors
// Requirements: 2.4, 6.1, 6.2, 6.3, 6.4, 6.5

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SupervisorDashboardResponse } from '../../types';
import ConstructionCard from '../common/ConstructionCard';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface ApprovalQueueCardProps {
  pendingApprovals: SupervisorDashboardResponse['pendingApprovals'];
  isLoading: boolean;
  onViewApproval?: (approvalType: string) => void;
  onQuickApprove?: (approvalType: string) => void;
  onViewAllApprovals?: () => void;
  highContrast?: boolean;
}

const ApprovalQueueCard: React.FC<ApprovalQueueCardProps> = ({
  pendingApprovals,
  isLoading,
  onViewApproval,
  onQuickApprove,
  onViewAllApprovals,
  highContrast = false,
}) => {
  if (isLoading) {
    return (
      <ConstructionCard title="Approval Queue" variant="default">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading approval data...</Text>
        </View>
      </ConstructionCard>
    );
  }

  if (!pendingApprovals) {
    return (
      <ConstructionCard title="Approval Queue" variant="default">
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No pending approvals</Text>
        </View>
      </ConstructionCard>
    );
  }

  const totalPending = pendingApprovals.leaveRequests + 
                      pendingApprovals.materialRequests + 
                      pendingApprovals.toolRequests;

  const hasUrgent = pendingApprovals.urgent > 0;

  return (
    <ConstructionCard 
      title="Approval Queue" 
      variant={hasUrgent ? "error" : totalPending > 0 ? "warning" : "default"}
    >
      {/* Summary Header */}
      <View style={styles.summaryContainer}>
        <View style={styles.totalContainer}>
          <Text style={[
            styles.totalValue, 
            hasUrgent ? styles.urgentValue : styles.normalValue
          ]}>
            {totalPending}
          </Text>
          <Text style={styles.totalLabel}>Pending Approvals</Text>
        </View>
        
        {hasUrgent && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentBadgeText}>
              {pendingApprovals.urgent} URGENT
            </Text>
          </View>
        )}
      </View>

      {totalPending > 0 ? (
        <>
          {/* Approval Categories */}
          <View style={styles.categoriesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {/* Leave Requests */}
              {pendingApprovals.leaveRequests > 0 && (
                <TouchableOpacity
                  style={[styles.categoryCard, styles.leaveCategory]}
                  onPress={() => onViewApproval?.('leave')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryIcon}>🏥</Text>
                  <Text style={styles.categoryValue}>{pendingApprovals.leaveRequests}</Text>
                  <Text style={styles.categoryLabel}>Leave Requests</Text>
                  <TouchableOpacity
                    style={styles.quickApproveButton}
                    onPress={() => onQuickApprove?.('leave')}
                  >
                    <Text style={styles.quickApproveText}>Quick Review</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}

              {/* Material Requests */}
              {pendingApprovals.materialRequests > 0 && (
                <TouchableOpacity
                  style={[styles.categoryCard, styles.materialCategory]}
                  onPress={() => onViewApproval?.('material')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryIcon}>📦</Text>
                  <Text style={styles.categoryValue}>{pendingApprovals.materialRequests}</Text>
                  <Text style={styles.categoryLabel}>Material Requests</Text>
                  <TouchableOpacity
                    style={styles.quickApproveButton}
                    onPress={() => onQuickApprove?.('material')}
                  >
                    <Text style={styles.quickApproveText}>Quick Review</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}

              {/* Tool Requests */}
              {pendingApprovals.toolRequests > 0 && (
                <TouchableOpacity
                  style={[styles.categoryCard, styles.toolCategory]}
                  onPress={() => onViewApproval?.('tool')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryIcon}>🔧</Text>
                  <Text style={styles.categoryValue}>{pendingApprovals.toolRequests}</Text>
                  <Text style={styles.categoryLabel}>Tool Requests</Text>
                  <TouchableOpacity
                    style={styles.quickApproveButton}
                    onPress={() => onQuickApprove?.('tool')}
                  >
                    <Text style={styles.quickApproveText}>Quick Review</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Priority Actions */}
          <View style={styles.priorityActionsContainer}>
            <Text style={styles.priorityTitle}>Priority Actions</Text>
            <View style={styles.priorityButtons}>
              <TouchableOpacity
                style={[styles.priorityButton, styles.urgentButton]}
                onPress={() => onViewApproval?.('urgent')}
              >
                <Text style={styles.priorityButtonIcon}>⚡</Text>
                <Text style={styles.priorityButtonText}>Urgent ({pendingApprovals.urgent})</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.priorityButton, styles.batchButton]}
                onPress={() => onQuickApprove?.('batch')}
              >
                <Text style={styles.priorityButtonIcon}>📋</Text>
                <Text style={styles.priorityButtonText}>Batch Approve</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStatsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.round((pendingApprovals.urgent / totalPending) * 100)}%
              </Text>
              <Text style={styles.statLabel}>Urgent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {totalPending - pendingApprovals.urgent}
              </Text>
              <Text style={styles.statLabel}>Regular</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {pendingApprovals.leaveRequests > 0 ? '🏥' : 
                 pendingApprovals.materialRequests > 0 ? '📦' : '🔧'}
              </Text>
              <Text style={styles.statLabel}>Top Type</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.noApprovalsContainer}>
          <Text style={styles.noApprovalsIcon}>✅</Text>
          <Text style={styles.noApprovalsText}>All caught up!</Text>
          <Text style={styles.noApprovalsSubtext}>No pending approvals at this time</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onViewAllApprovals}
        >
          <Text style={styles.actionButtonText}>
            {totalPending > 0 ? 'View All Approvals' : 'View Approval History'}
          </Text>
        </TouchableOpacity>
      </View>
    </ConstructionCard>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: ConstructionTheme.spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  emptyContainer: {
    padding: ConstructionTheme.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
  },
  totalContainer: {
    alignItems: 'center',
  },
  totalValue: {
    ...ConstructionTheme.typography.displaySmall,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  normalValue: {
    color: ConstructionTheme.colors.warning,
  },
  urgentValue: {
    color: ConstructionTheme.colors.error,
  },
  totalLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  urgentBadge: {
    backgroundColor: ConstructionTheme.colors.error,
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  urgentBadgeText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  categoryCard: {
    width: 120,
    padding: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginRight: ConstructionTheme.spacing.sm,
    alignItems: 'center',
    ...ConstructionTheme.shadows.small,
  },
  leaveCategory: {
    backgroundColor: '#E8F5E8',
  },
  materialCategory: {
    backgroundColor: '#E3F2FD',
  },
  toolCategory: {
    backgroundColor: '#FFF3E0',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  categoryValue: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  categoryLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  quickApproveButton: {
    backgroundColor: ConstructionTheme.colors.primary,
    paddingHorizontal: ConstructionTheme.spacing.xs,
    paddingVertical: 4,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: 28,
    justifyContent: 'center',
  },
  quickApproveText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontSize: 10,
  },
  priorityActionsContainer: {
    marginBottom: ConstructionTheme.spacing.md,
    paddingTop: ConstructionTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
  },
  priorityTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginHorizontal: ConstructionTheme.spacing.xs,
    minHeight: ConstructionTheme.dimensions.buttonMedium,
  },
  urgentButton: {
    backgroundColor: ConstructionTheme.colors.error,
  },
  batchButton: {
    backgroundColor: ConstructionTheme.colors.secondary,
  },
  priorityButtonIcon: {
    fontSize: 16,
    marginRight: ConstructionTheme.spacing.xs,
  },
  priorityButtonText: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
    paddingTop: ConstructionTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: ConstructionTheme.colors.outline,
  },
  statValue: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  statLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  noApprovalsContainer: {
    alignItems: 'center',
    padding: ConstructionTheme.spacing.lg,
  },
  noApprovalsIcon: {
    fontSize: 48,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  noApprovalsText: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.success,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  noApprovalsSubtext: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  actionsContainer: {
    paddingTop: ConstructionTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
  },
  actionButton: {
    backgroundColor: ConstructionTheme.colors.primary,
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    alignItems: 'center',
    minHeight: ConstructionTheme.dimensions.buttonMedium,
    justifyContent: 'center',
  },
  actionButtonText: {
    ...ConstructionTheme.typography.buttonMedium,
    color: ConstructionTheme.colors.onPrimary,
  },
});

export default ApprovalQueueCard;