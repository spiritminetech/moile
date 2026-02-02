// Request History Screen - Display all requests with status tracking
// Requirements: 6.4, 6.5

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { workerApiService } from '../../services/api/WorkerApiService';
import { WorkerRequest, RequestType, RequestStatus } from '../../types';
import LoadingOverlay from '../../components/common/LoadingOverlay';

interface FilterOption {
  value: RequestStatus | 'all';
  label: string;
  color: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All', color: '#757575' },
  { value: 'pending', label: 'Pending', color: '#FF9800' },
  { value: 'approved', label: 'Approved', color: '#4CAF50' },
  { value: 'rejected', label: 'Rejected', color: '#F44336' },
  { value: 'cancelled', label: 'Cancelled', color: '#9E9E9E' },
];

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

const RequestHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [requests, setRequests] = useState<WorkerRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<WorkerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<RequestStatus | 'all'>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, selectedFilter]);

  const loadRequests = async () => {
    try {
      const response = await workerApiService.getRequests();
      if (response.success) {
        // Sort by request date (newest first)
        const sortedRequests = response.data.requests.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        // Map API response to WorkerRequest interface
        const mappedRequests: WorkerRequest[] = sortedRequests.map((request: any) => ({
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
        
        setRequests(mappedRequests);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load request history');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterRequests = () => {
    if (selectedFilter === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(request => request.status === selectedFilter));
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRequests();
  };

  const handleRequestPress = (request: WorkerRequest) => {
    (navigation as any).navigate('RequestDetails', {
      requestId: request.id,
    });
  };

  const getStatusColor = (status: RequestStatus) => {
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getRequestCounts = () => {
    const counts = {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
    };
    return counts;
  };

  if (isLoading) {
    return <LoadingOverlay visible={true} message="Loading request history..." />;
  }

  const counts = getRequestCounts();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Request History</Text>
        <Text style={styles.headerSubtitle}>
          {requests.length} total request{requests.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterTabs}>
            {FILTER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterTab,
                  selectedFilter === option.value && styles.filterTabActive,
                  { borderBottomColor: option.color },
                ]}
                onPress={() => setSelectedFilter(option.value)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === option.value && styles.filterTabTextActive,
                    { color: selectedFilter === option.value ? option.color : '#757575' },
                  ]}
                >
                  {option.label}
                </Text>
                <View
                  style={[
                    styles.filterTabBadge,
                    { backgroundColor: option.color },
                  ]}
                >
                  <Text style={styles.filterTabBadgeText}>
                    {counts[option.value as keyof typeof counts]}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Request List */}
      <ScrollView
        style={styles.requestList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📝</Text>
            <Text style={styles.emptyStateText}>
              {selectedFilter === 'all' 
                ? 'No requests found' 
                : `No ${selectedFilter} requests`}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedFilter === 'all'
                ? 'Submit your first request to get started'
                : 'Try selecting a different filter'}
            </Text>
          </View>
        ) : (
          <View style={styles.requestCards}>
            {filteredRequests.map((request) => (
              <TouchableOpacity
                key={request.id}
                style={styles.requestCard}
                onPress={() => handleRequestPress(request)}
                activeOpacity={0.7}
              >
                <View style={styles.requestCardHeader}>
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
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(request.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {request.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.requestDescription} numberOfLines={2}>
                  {request.description}
                </Text>

                <View style={styles.requestCardFooter}>
                  <Text style={styles.requestDate}>
                    Submitted: {formatDate(request.requestDate)}
                  </Text>
                  {request.approvalDate && (
                    <Text style={styles.approvalDate}>
                      {request.status === 'approved' ? 'Approved' : 'Reviewed'}: {formatDate(request.approvalDate)}
                    </Text>
                  )}
                </View>

                {request.approver && (
                  <View style={styles.approverInfo}>
                    <Text style={styles.approverText}>
                      Reviewed by: {request.approver.name}
                    </Text>
                  </View>
                )}

                <View style={styles.requestCardArrow}>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
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
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomWidth: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  filterTabTextActive: {
    fontWeight: 'bold',
  },
  filterTabBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterTabBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  requestList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
  },
  requestCards: {
    padding: 16,
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  requestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  requestTypeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  requestTypeInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  requestType: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
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
  requestDescription: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
    marginBottom: 12,
  },
  requestCardFooter: {
    marginBottom: 8,
  },
  requestDate: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 2,
  },
  approvalDate: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  approverInfo: {
    marginTop: 4,
  },
  approverText: {
    fontSize: 12,
    color: '#757575',
    fontStyle: 'italic',
  },
  requestCardArrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -12,
  },
  arrowText: {
    fontSize: 24,
    color: '#BDBDBD',
    fontWeight: '300',
  },
});

export default RequestHistoryScreen;