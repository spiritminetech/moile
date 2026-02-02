// Request Details Screen - Display detailed request information with status and approval notes
// Requirements: 6.4, 6.5

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { workerApiService } from '../../services/api/WorkerApiService';
import { WorkerRequest, RequestType, RequestStatus } from '../../types';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import AttachmentViewer from '../../components/forms/AttachmentViewer';

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  leave: 'Leave Request',
  medical_leave: 'Medical Leave',
  advance_payment: 'Advance Payment',
  material: 'Material Request',
  tool: 'Tool Request',
  reimbursement: 'Reimbursement',
};

const REQUEST_TYPE_ICONS: Record<RequestType, string> = {
  leave: '🏖️',
  medical_leave: '🏥',
  advance_payment: '💳',
  material: '🧱',
  tool: '🔨',
  reimbursement: '💰',
};

interface RouteParams {
  requestId: number;
}

const RequestDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { requestId } = route.params as RouteParams;
  
  const [request, setRequest] = useState<WorkerRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadRequestDetails();
  }, [requestId]);

  const loadRequestDetails = async () => {
    try {
      const response = await workerApiService.getRequest(requestId);
      if (response.success) {
        // Map API response to WorkerRequest interface
        const mappedRequest: WorkerRequest = {
          id: response.data.id,
          workerId: response.data.employeeId || 0,
          type: response.data.requestType as RequestType,
          title: response.data.reason || response.data.requestType || 'Request',
          description: response.data.reason || '',
          requestDate: new Date(response.data.createdAt),
          requiredDate: response.data.fromDate ? new Date(response.data.fromDate) : undefined,
          status: response.data.status as RequestStatus,
          attachments: [], // Would need to be populated from separate API call
        };
        setRequest(mappedRequest);
      } else {
        Alert.alert('Error', response.message || 'Failed to load request details');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Error loading request details:', error);
      Alert.alert('Error', error.message || 'Failed to load request details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRequestDetails();
  };

  const handleCancelRequest = () => {
    if (!request || request.status !== 'pending') {
      return;
    }

    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request? This action cannot be undone.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await workerApiService.cancelRequest(request.id);
              if (response.success) {
                Alert.alert('Success', 'Request has been cancelled successfully');
                loadRequestDetails(); // Refresh the data
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel request');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'cancelled':
        return '#9E9E9E';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'cancelled':
        return '🚫';
      default:
        return '❓';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <LoadingOverlay visible={true} message="Loading request details..." />;
  }

  if (!request) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Request not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.requestTypeContainer}>
            <Text style={styles.requestTypeIcon}>
              {REQUEST_TYPE_ICONS[request.type]}
            </Text>
            <View style={styles.requestTypeInfo}>
              <Text style={styles.requestTitle}>{request.title}</Text>
              <Text style={styles.requestType}>
                {REQUEST_TYPE_LABELS[request.type]}
              </Text>
            </View>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(request.status) },
            ]}
          >
            <Text style={styles.statusIcon}>{getStatusIcon(request.status)}</Text>
            <Text style={styles.statusText}>
              {request.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Request Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Request Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Request ID:</Text>
          <Text style={styles.infoValue}>#{request.id}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Submitted:</Text>
          <Text style={styles.infoValue}>{formatDateTime(request.requestDate)}</Text>
        </View>

        {request.requiredDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Required Date:</Text>
            <Text style={styles.infoValue}>{formatDate(request.requiredDate)}</Text>
          </View>
        )}

        <View style={styles.descriptionContainer}>
          <Text style={styles.infoLabel}>Description:</Text>
          <Text style={styles.descriptionText}>{request.description}</Text>
        </View>
      </View>

      {/* Approval Information */}
      {(request.approver || request.approvalDate || request.approvalNotes) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Review Information</Text>
          
          {request.approver && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reviewed by:</Text>
              <Text style={styles.infoValue}>{request.approver.name}</Text>
            </View>
          )}

          {request.approvalDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Review Date:</Text>
              <Text style={styles.infoValue}>{formatDateTime(request.approvalDate)}</Text>
            </View>
          )}

          {request.approvalNotes && (
            <View style={styles.notesContainer}>
              <Text style={styles.infoLabel}>Review Notes:</Text>
              <View
                style={[
                  styles.notesBox,
                  {
                    borderLeftColor: getStatusColor(request.status),
                    backgroundColor: request.status === 'approved' 
                      ? '#E8F5E8' 
                      : request.status === 'rejected' 
                        ? '#FFEBEE' 
                        : '#F5F5F5',
                  },
                ]}
              >
                <Text style={styles.notesText}>{request.approvalNotes}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Attachments */}
      {request.attachments && request.attachments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attachments</Text>
          <AttachmentViewer
            requestId={request.id}
            requestType={request.type === 'medical_leave' ? 'leave' : request.type as 'leave' | 'material' | 'tool' | 'reimbursement' | 'advance-payment'}
            attachments={request.attachments.map(att => ({
              id: att.id.toString(),
              fileName: att.filename,
              filePath: att.uri,
              fileSize: att.size,
              mimeType: att.mimeType,
            }))}
            canAddAttachments={request.status === 'pending'}
            canDeleteAttachments={false}
          />
        </View>
      )}

      {/* Status Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Timeline</Text>
        
        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <View style={[styles.timelineIcon, { backgroundColor: '#2196F3' }]}>
              <Text style={styles.timelineIconText}>📝</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Request Submitted</Text>
              <Text style={styles.timelineDate}>{formatDateTime(request.requestDate)}</Text>
            </View>
          </View>

          {request.approvalDate && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineIcon, { backgroundColor: getStatusColor(request.status) }]}>
                <Text style={styles.timelineIconText}>{getStatusIcon(request.status)}</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>
                  Request {request.status === 'approved' ? 'Approved' : 
                           request.status === 'rejected' ? 'Rejected' : 'Reviewed'}
                </Text>
                <Text style={styles.timelineDate}>{formatDateTime(request.approvalDate)}</Text>
                {request.approver && (
                  <Text style={styles.timelineSubtext}>by {request.approver.name}</Text>
                )}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      {request.status === 'pending' && (
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelRequest}
          >
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Help Text */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>Need Help?</Text>
        <Text style={styles.helpText}>
          If you have questions about this request or need to make changes, 
          please contact your supervisor or HR department.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTop: {
    marginBottom: 16,
  },
  requestTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestTypeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  requestTypeInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  requestType: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#212121',
    lineHeight: 20,
    marginTop: 8,
  },
  notesContainer: {
    marginTop: 8,
  },
  notesBox: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#212121',
    lineHeight: 20,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 2,
  },
  attachmentSize: {
    fontSize: 12,
    color: '#757575',
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineIconText: {
    fontSize: 14,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: '#757575',
  },
  timelineSubtext: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  actionsSection: {
    margin: 16,
    marginBottom: 0,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helpSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#1976D2',
    lineHeight: 18,
  },
});

export default RequestDetailsScreen;