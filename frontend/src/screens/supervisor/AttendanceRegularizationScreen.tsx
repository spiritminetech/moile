// Supervisor Attendance Regularization Screen
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { supervisorApiService } from '../../services/api/SupervisorApiService';
import { ConstructionButton, ConstructionCard, ConstructionLoadingIndicator } from '../../components/common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface RegularizationRequest {
  id: string;
  workerId: number;
  workerName: string;
  projectId: number;
  projectName: string;
  requestType: 'forgotten_checkout' | 'late_login' | 'early_logout';
  originalTime?: string;
  requestedTime?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

const AttendanceRegularizationScreen: React.FC = () => {
  const { state: authState } = useAuth();
  const [requests, setRequests] = useState<RegularizationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  useEffect(() => {
    loadRegularizationRequests();
  }, []);

  const loadRegularizationRequests = useCallback(async () => {
    if (!authState.user) return;
    
    setIsLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockRequests: RegularizationRequest[] = [
        {
          id: '1',
          workerId: 101,
          workerName: 'John Doe',
          projectId: 1003,
          projectName: 'Construction Site A',
          requestType: 'forgotten_checkout',
          originalTime: '2024-02-10T08:00:00Z',
          reason: 'Forgot to checkout - requesting supervisor regularization',
          status: 'pending',
          requestedAt: '2024-02-11T09:00:00Z',
        },
        {
          id: '2',
          workerId: 102,
          workerName: 'Jane Smith',
          projectId: 1003,
          projectName: 'Construction Site A',
          requestType: 'late_login',
          originalTime: '2024-02-10T08:30:00Z',
          requestedTime: '2024-02-10T08:00:00Z',
          reason: 'Traffic jam caused late arrival',
          status: 'pending',
          requestedAt: '2024-02-11T08:45:00Z',
        },
      ];
      
      setRequests(mockRequests);
    } catch (error) {
      console.error('Error loading regularization requests:', error);
      Alert.alert('Error', 'Failed to load regularization requests');
    } finally {
      setIsLoading(false);
    }
  }, [authState.user]);

  const handleApproveRequest = async (request: RegularizationRequest) => {
    Alert.alert(
      'Approve Request',
      `Approve regularization request from ${request.workerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => processRequest(request.id, 'approved') },
      ]
    );
  };

  const handleRejectRequest = async (request: RegularizationRequest) => {
    Alert.alert(
      'Reject Request',
      `Reject regularization request from ${request.workerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', onPress: () => processRequest(request.id, 'rejected'), style: 'destructive' },
      ]
    );
  };

  const processRequest = async (requestId: string, action: 'approved' | 'rejected') => {
    setProcessingRequestId(requestId);
    try {
      // Mock API call - replace with actual implementation
      console.log(`Processing request ${requestId} with action: ${action}`);
      
      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: action,
              reviewedAt: new Date().toISOString(),
              reviewedBy: authState.user?.name || 'Supervisor',
            }
          : req
      ));
      
      Alert.alert(
        'Success',
        `Request has been ${action}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error(`Error ${action} request:`, error);
      Alert.alert('Error', `Failed to ${action} request`);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadRegularizationRequests();
    setIsRefreshing(false);
  }, [loadRegularizationRequests]);

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'forgotten_checkout':
        return 'Forgotten Checkout';
      case 'late_login':
        return 'Late Login';
      case 'early_logout':
        return 'Early Logout';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
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

  const renderRequestCard = (request: RegularizationRequest) => (
    <ConstructionCard
      key={request.id}
      title={`${request.workerName} - ${getRequestTypeLabel(request.requestType)}`}
      variant="outlined"
      style={styles.requestCard}
    >
      <View style={styles.requestContent}>
        {/* Status */}
        <View style={styles.statusRow}>
          <Text style={styles.statusIcon}>{getStatusIcon(request.status)}</Text>
          <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
            {request.status.toUpperCase()}
          </Text>
        </View>

        {/* Request Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Worker:</Text>
            <Text style={styles.detailValue}>{request.workerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Project:</Text>
            <Text style={styles.detailValue}>{request.projectName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Request Type:</Text>
            <Text style={styles.detailValue}>{getRequestTypeLabel(request.requestType)}</Text>
          </View>
          {request.originalTime && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Original Time:</Text>
              <Text style={styles.detailValue}>
                {new Date(request.originalTime).toLocaleString()}
              </Text>
            </View>
          )}
          {request.requestedTime && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Requested Time:</Text>
              <Text style={styles.detailValue}>
                {new Date(request.requestedTime).toLocaleString()}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Requested At:</Text>
            <Text style={styles.detailValue}>
              {new Date(request.requestedAt).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Reason */}
        <View style={styles.reasonSection}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{request.reason}</Text>
        </View>

        {/* Review Info */}
        {request.reviewedAt && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>
              Reviewed by {request.reviewedBy} at {new Date(request.reviewedAt).toLocaleString()}
            </Text>
            {request.reviewNotes && (
              <Text style={styles.reviewNotes}>{request.reviewNotes}</Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        {request.status === 'pending' && (
          <View style={styles.actionButtons}>
            <ConstructionButton
              title="Reject"
              onPress={() => handleRejectRequest(request)}
              variant="error"
              size="medium"
              disabled={processingRequestId === request.id}
              loading={processingRequestId === request.id}
              style={styles.actionButton}
            />
            <ConstructionButton
              title="Approve"
              onPress={() => handleApproveRequest(request)}
              variant="success"
              size="medium"
              disabled={processingRequestId === request.id}
              loading={processingRequestId === request.id}
              style={styles.actionButton}
            />
          </View>
        )}
      </View>
    </ConstructionCard>
  );

  if (isLoading) {
    return (
      <ConstructionLoadingIndicator
        visible={true}
        message="Loading regularization requests..."
        variant="card"
        size="large"
      />
    );
  }

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const processedRequests = requests.filter(req => req.status !== 'pending');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary */}
        <ConstructionCard
          title="Regularization Summary"
          variant="default"
          style={styles.summaryCard}
        >
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{pendingRequests.length}</Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{processedRequests.length}</Text>
              <Text style={styles.summaryLabel}>Processed</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{requests.length}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
          </View>
        </ConstructionCard>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Requests ({pendingRequests.length})</Text>
            {pendingRequests.map(renderRequestCard)}
          </View>
        )}

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Processed Requests ({processedRequests.length})</Text>
            {processedRequests.map(renderRequestCard)}
          </View>
        )}

        {/* No Requests */}
        {requests.length === 0 && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No regularization requests found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  summaryCard: {
    margin: ConstructionTheme.spacing.md,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: ConstructionTheme.spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  summaryLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginTop: ConstructionTheme.spacing.xs,
  },
  section: {
    marginHorizontal: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.md,
    fontWeight: 'bold',
  },
  requestCard: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  requestContent: {
    padding: ConstructionTheme.spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: ConstructionTheme.spacing.sm,
  },
  statusText: {
    ...ConstructionTheme.typography.bodyLarge,
    fontWeight: 'bold',
  },
  detailsSection: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  detailLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  detailValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  reasonSection: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
  },
  reasonLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  reasonText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    lineHeight: 20,
  },
  reviewSection: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.sm,
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
  },
  reviewLabel: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  reviewNotes: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    marginTop: ConstructionTheme.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ConstructionTheme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  noDataContainer: {
    padding: ConstructionTheme.spacing.xl,
    alignItems: 'center',
  },
  noDataText: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AttendanceRegularizationScreen;