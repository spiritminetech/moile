// Request Management Main Screen - Entry point for all request types
// Requirements: 6.1, 6.2, 6.3

import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { workerApiService } from '../../services/api/WorkerApiService';
import { WorkerRequest, RequestType, RequestStatus } from '../../types';
import LoadingOverlay from '../../components/common/LoadingOverlay';

interface RequestTypeCard {
  type: RequestType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const REQUEST_TYPES: RequestTypeCard[] = [
  {
    type: 'leave',
    title: 'Leave Request',
    description: 'Request time off for personal, medical, or emergency reasons',
    icon: '🏖️',
    color: '#4CAF50',
  },
  {
    type: 'material',
    title: 'Material Request',
    description: 'Request construction materials and supplies',
    icon: '🧱',
    color: '#FF9800',
  },
  {
    type: 'tool',
    title: 'Tool Request',
    description: 'Request tools and equipment for work',
    icon: '🔨',
    color: '#2196F3',
  },
  {
    type: 'reimbursement',
    title: 'Reimbursement',
    description: 'Submit expenses for reimbursement with receipts',
    icon: '💰',
    color: '#9C27B0',
  },
  {
    type: 'advance_payment',
    title: 'Advance Payment',
    description: 'Request advance payment for urgent needs',
    icon: '💳',
    color: '#F44336',
  },
];

const RequestsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [recentRequests, setRecentRequests] = useState<WorkerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadRecentRequests();
  }, []);

  const loadRecentRequests = async () => {
    try {
      const response = await workerApiService.getRequests();
      if (response.success) {
        // Show only the 3 most recent requests
        const mappedRequests: WorkerRequest[] = response.data.requests.slice(0, 3).map((request: any) => ({
          id: request.id,
          workerId: request.employeeId || 0,
          type: request.requestType as RequestType,
          title: request.reason || request.requestType || 'Request',
          description: request.reason || '',
          requestDate: new Date(request.createdAt),
          requiredDate: request.fromDate ? new Date(request.fromDate) : undefined,
          status: request.status as RequestStatus,
          attachments: [],
        }));
        
        setRecentRequests(mappedRequests);
      }
    } catch (error) {
      console.error('Error loading recent requests:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRecentRequests();
  };

  const handleRequestTypePress = (requestType: RequestType) => {
    switch (requestType) {
      case 'leave':
        (navigation as any).navigate('LeaveRequest');
        break;
      case 'material':
        (navigation as any).navigate('MaterialRequest');
        break;
      case 'tool':
        (navigation as any).navigate('ToolRequest');
        break;
      case 'reimbursement':
        (navigation as any).navigate('ReimbursementRequest');
        break;
      case 'advance_payment':
        (navigation as any).navigate('AdvancePaymentRequest');
        break;
    }
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
        return '#757575';
      default:
        return '#757575';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return <LoadingOverlay visible={true} message="Loading requests..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Submit New Request</Text>
        <Text style={styles.headerSubtitle}>
          Choose the type of request you want to submit
        </Text>
      </View>

      {/* Request Type Cards */}
      <View style={styles.requestTypesContainer}>
        {REQUEST_TYPES.map((requestType) => (
          <TouchableOpacity
            key={requestType.type}
            style={[styles.requestTypeCard, { borderLeftColor: requestType.color }]}
            onPress={() => handleRequestTypePress(requestType.type)}
            activeOpacity={0.7}
          >
            <View style={styles.requestTypeIcon}>
              <Text style={styles.iconText}>{requestType.icon}</Text>
            </View>
            <View style={styles.requestTypeContent}>
              <Text style={styles.requestTypeTitle}>{requestType.title}</Text>
              <Text style={styles.requestTypeDescription}>
                {requestType.description}
              </Text>
            </View>
            <View style={styles.requestTypeArrow}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Requests Section */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Requests</Text>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('RequestHistory')}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📝</Text>
            <Text style={styles.emptyStateText}>No requests yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Submit your first request using the options above
            </Text>
          </View>
        ) : (
          <View style={styles.recentRequestsList}>
            {recentRequests.map((request) => (
              <TouchableOpacity
                key={request.id}
                style={styles.recentRequestCard}
                onPress={() =>
                  (navigation as any).navigate('RequestDetails', {
                    requestId: request.id,
                  })
                }
              >
                <View style={styles.recentRequestHeader}>
                  <Text style={styles.recentRequestTitle}>{request.title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(request.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {(request.status || 'pending').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recentRequestType}>
                  {(request.type || 'unknown').replace('_', ' ').toUpperCase()}
                </Text>
                <Text style={styles.recentRequestDate}>
                  Submitted: {formatDate(request.requestDate)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#757575',
  },
  requestTypesContainer: {
    padding: 16,
  },
  requestTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestTypeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 24,
  },
  requestTypeContent: {
    flex: 1,
  },
  requestTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  requestTypeDescription: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  requestTypeArrow: {
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 24,
    color: '#BDBDBD',
    fontWeight: '300',
  },
  recentSection: {
    padding: 16,
    paddingTop: 8,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  viewAllText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
  },
  recentRequestsList: {
    gap: 12,
  },
  recentRequestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recentRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recentRequestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recentRequestType: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
    marginBottom: 4,
  },
  recentRequestDate: {
    fontSize: 12,
    color: '#9E9E9E',
  },
});

export default RequestsScreen;